const STORAGE_KEY = 'sara_ai_mockup_tokens_used';
export const MAX_MOCKUP_TOKENS = 3;

export function getMockupTokensUsed(): number {
  const raw = localStorage.getItem(STORAGE_KEY);
  const used = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(used) ? Math.min(used, MAX_MOCKUP_TOKENS) : 0;
}

export function getMockupTokensRemaining(): number {
  return Math.max(0, MAX_MOCKUP_TOKENS - getMockupTokensUsed());
}

export function consumeMockupToken(): boolean {
  const used = getMockupTokensUsed();
  if (used >= MAX_MOCKUP_TOKENS) return false;
  localStorage.setItem(STORAGE_KEY, String(used + 1));
  return true;
}
