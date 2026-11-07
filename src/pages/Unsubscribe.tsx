import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { marketingApi } from '@/lib/api';

type State = 'checking' | 'ready' | 'done' | 'invalid' | 'failed';

/** Opened from the link in every email. Opening it changes nothing: removal happens only on the button, so mail scanners cannot unsubscribe people. */
const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get('t') ?? '';
  const [state, setState] = useState<State>('checking');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Unsubscribe - Studio Sara';
    if (!token) { setState('invalid'); return; }
    marketingApi.previewUnsubscribe(token)
      .then((r) => { setEmail(r.email); setState('ready'); })
      .catch(() => setState('invalid'));
  }, [token]);

  const confirm = async () => {
    setBusy(true);
    try {
      await marketingApi.unsubscribe(token);
      setState('done');
    } catch {
      setState('failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-custom max-w-lg text-center">
          <h1 className="font-cursive text-4xl mb-6">Unsubscribe</h1>
          {state === 'checking' && <p className="text-muted-foreground">Checking your link…</p>}
          {state === 'ready' && (
            <>
              <p className="mb-6 text-muted-foreground">Stop offers and updates for <span className="font-medium text-foreground">{email}</span> by email and WhatsApp? You will still get messages about your orders and account.</p>
              <Button onClick={confirm} disabled={busy} className="h-11 px-8">{busy ? 'Working…' : 'Yes, unsubscribe me'}</Button>
            </>
          )}
          {state === 'done' && (
            <>
              <p className="mb-6 text-muted-foreground">You are unsubscribed. We will not send you offers and updates any more.</p>
              <Link to="/" className="text-primary underline">Back to Studio Sara</Link>
            </>
          )}
          {state === 'invalid' && <p className="text-muted-foreground">This unsubscribe link is not valid. Use the link from a recent email, or <Link to="/contact" className="text-primary underline">contact us</Link>.</p>}
          {state === 'failed' && <p className="text-red-700">Something went wrong. Please try again in a moment.</p>}
        </div>
      </section>
    </Layout>
  );
};

export default Unsubscribe;
