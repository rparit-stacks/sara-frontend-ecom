import { DEFAULT_COUNTRY, countryOfDigits, parsePhone } from './phone';

export const MAX_RECIPIENTS = 5000;

export interface ListRow {
  line: number;
  raw: string;
  digits: string;
  display: string;
  country: string;
  /** Values for the variables that come from the list, by variable number. */
  values: Record<string, string>;
  status: 'valid' | 'invalid' | 'duplicate';
  reason?: string;
}

export interface ParsedList {
  rows: ListRow[];
  valid: ListRow[];
  invalid: ListRow[];
  duplicates: ListRow[];
  byCountry: Array<{ country: string; count: number }>;
  tooMany: boolean;
}

/**
 * Reads a pasted or uploaded list. Each line is a phone number, then one value for each variable
 * that comes from the list (in order of variable number), separated by comma, tab or semicolon.
 * A first line that is a header (it has letters where the number should be) is skipped.
 */
export const parseList = (text: string, defaultCode: string = DEFAULT_COUNTRY, listVariables: string[] = []): ParsedList => {
  const lines = (text ?? '').split(/\r?\n/).map((l, i) => ({ l: l.trim(), n: i + 1 })).filter((x) => x.l);
  if (lines.length && /[A-Za-z]/.test(lines[0].l.split(/[,;\t]/)[0] ?? '')) lines.shift();

  const seen = new Set<string>();
  const rows: ListRow[] = lines.map(({ l, n }) => {
    const cells = l.split(/[,;\t]/).map((c) => c.trim());
    const phone = parsePhone(cells[0] ?? '', defaultCode);
    const values: Record<string, string> = {};
    listVariables.forEach((v, i) => { values[v] = cells[i + 1] ?? ''; });
    const row: ListRow = {
      line: n, raw: l, digits: phone.digits, display: phone.display || cells[0] || '', country: phone.ok ? countryOfDigits(phone.digits) : '',
      values, status: 'valid',
    };
    if (!phone.ok) return { ...row, status: 'invalid', reason: phone.reason };
    const missing = listVariables.find((v) => !values[v]);
    if (missing) return { ...row, status: 'invalid', reason: `Missing value for {{${missing}}}` };
    if (seen.has(phone.digits)) return { ...row, status: 'duplicate', reason: 'This number is already in the list' };
    seen.add(phone.digits);
    return row;
  });

  const valid = rows.filter((r) => r.status === 'valid');
  const counts = new Map<string, number>();
  valid.forEach((r) => counts.set(r.country, (counts.get(r.country) ?? 0) + 1));
  return {
    rows,
    valid,
    invalid: rows.filter((r) => r.status === 'invalid'),
    duplicates: rows.filter((r) => r.status === 'duplicate'),
    byCountry: Array.from(counts, ([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count),
    tooMany: valid.length > MAX_RECIPIENTS,
  };
};

export const toCsv = (header: string[], rows: string[][]): string =>
  [header, ...rows].map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',')).join('\n');
