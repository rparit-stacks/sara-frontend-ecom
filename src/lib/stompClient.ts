import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '@/lib/api';

/**
 * App-wide singleton STOMP client over WebSocket (SockJS fallback).
 *
 * One connection is shared by chat subscriptions and presence. It authenticates
 * with the current portal token via the STOMP CONNECT frame (the browser can't
 * set headers on the WS handshake, so the backend reads Authorization from the
 * CONNECT frame — see StompAuthChannelInterceptor).
 *
 * `mode` picks which stored token to send: 'admin' -> adminToken, 'client' -> authToken.
 */
export type StompMode = 'admin' | 'client';

let client: Client | null = null;
let activeMode: StompMode | null = null;
let refCount = 0;

/** Listeners re-run on every (re)connect so subscriptions survive reconnects. */
const connectListeners = new Set<(c: Client) => void>();

function tokenFor(mode: StompMode): string | null {
  return mode === 'admin'
    ? localStorage.getItem('adminToken')
    : localStorage.getItem('authToken');
}

function buildClient(mode: StompMode): Client {
  const c = new Client({
    // SockJS so we work behind proxies/networks that block raw WebSocket.
    webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    // Refresh the token on every (re)connect in case it rotated.
    beforeConnect: () => {
      c.connectHeaders = { Authorization: `Bearer ${tokenFor(mode) ?? ''}` };
    },
    onConnect: () => {
      console.info('[STOMP] connected', mode);
      connectListeners.forEach((fn) => fn(c));
    },
    onStompError: (frame) => {
      console.error('[STOMP] broker error:', frame.headers['message'], frame.body);
    },
    onWebSocketError: (evt) => {
      console.error('[STOMP] websocket error', evt);
    },
    onWebSocketClose: (evt) => {
      console.warn('[STOMP] websocket closed', evt?.code, evt?.reason);
    },
  });
  return c;
}

/**
 * Acquire the shared client, activating it for `mode`. Ref-counted: the socket
 * stays up while any consumer holds it, and deactivates when the last releases.
 * If the mode changes (admin<->client), the old socket is torn down first.
 */
export function acquireStomp(mode: StompMode): Client {
  if (client && activeMode !== mode) {
    // A different portal took over this tab — reset the connection.
    void client.deactivate();
    client = null;
    refCount = 0;
  }
  if (!client) {
    client = buildClient(mode);
    activeMode = mode;
    client.activate();
  }
  refCount += 1;
  return client;
}

export function releaseStomp() {
  refCount -= 1;
  if (refCount <= 0 && client) {
    void client.deactivate();
    client = null;
    activeMode = null;
    refCount = 0;
  }
}

/**
 * Subscribe to a destination, resilient across reconnects. Re-subscribes
 * automatically whenever the client (re)connects. Returns an unsubscribe fn.
 */
export function subscribeTopic(
  c: Client,
  destination: string,
  handler: (msg: IMessage) => void,
): () => void {
  let sub: StompSubscription | null = null;
  let cancelled = false;

  const open = (cl: Client) => {
    if (cancelled) return;
    sub = cl.subscribe(destination, handler);
  };

  // (Re)subscribe on every future connect...
  connectListeners.add(open);
  // ...and immediately if we're already connected.
  if (c.connected) open(c);

  return () => {
    cancelled = true;
    connectListeners.delete(open);
    if (sub) {
      try {
        sub.unsubscribe();
      } catch {
        /* socket already gone */
      }
      sub = null;
    }
  };
}
