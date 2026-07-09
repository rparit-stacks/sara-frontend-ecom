// Backend timestamps are Java LocalDateTime (no timezone), stored as IST wall
// clock (hibernate.jdbc.time_zone=Asia/Kolkata). A bare string like
// "2026-07-04T14:30:00" is parsed by JS as the *viewer's* local time, which is
// wrong for anyone not in IST (and wrong if the server JVM runs UTC). This
// normalizes such strings to the correct instant by pinning them to IST (+05:30).

const IST_OFFSET = '+05:30';

/** Parse a server timestamp into a correct Date. Adds IST offset when the
 *  string carries no timezone; leaves offset-aware strings untouched. */
export function parseServerDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const s = String(iso).trim();
  // already has a zone (Z or ±hh:mm) → trust it
  const hasZone = /[zZ]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s);
  const normalized = hasZone ? s : `${s}${IST_OFFSET}`;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

/** "2:30 PM" today, else "4 Jul, 2:30 PM". */
export function formatServerTime(iso?: string | null): string {
  const d = parseServerDate(iso);
  if (!d) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** "4 July 2026" — for date dividers / created-on lines. */
export function formatServerDate(iso?: string | null): string {
  const d = parseServerDate(iso);
  if (!d) return '';
  return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}
