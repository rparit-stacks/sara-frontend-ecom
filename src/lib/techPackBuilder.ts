/**
 * Opens the standalone Tech Pack Studio (`sara-techpack-builder`, its own Vercel
 * deployment/origin) to a given doc/project.
 *
 * No admin token is passed here — the builder authenticates itself to the shared
 * backend with its OWN long-lived API key (baked into its build as
 * `VITE_TECHPACK_API_KEY`, checked by `TechPackApiKeyFilter` on the backend), not a
 * per-session admin JWT. That replaced an earlier design where this function handed
 * the admin's own JWT across via a URL hash fragment: that JWT expires, so an admin
 * who kept the builder tab open past the expiry window saw every subsequent autosave
 * silently 401 — nothing typed after that point ever reached the database. A static,
 * non-expiring key removes that failure mode; this function is now just a plain
 * "open the builder to this doc/project" link.
 */
export function openTechPackBuilder(builderUrl: string, params: Record<string, string>): void {
  const query = new URLSearchParams(params).toString();
  window.open(`${builderUrl}${query ? `?${query}` : ''}`, '_blank', 'noopener');
}
