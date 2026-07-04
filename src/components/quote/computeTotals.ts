// Pure calculation engine for a QuoteDoc. No React. Imported by the summary
// renderer (live preview) and by the save path (the persisted `total`).
//
// Totals come ONLY from `items` blocks (Amount = qty × rate). A free-form
// `table` block never contributes to totals. Legacy fallback: if a doc has no
// items blocks at all but has old tables with an amount column, those are
// summed so quotes saved before the items/table split keep their total.

import type { QuoteDoc, ItemsBlock, TableBlock } from './quoteDoc';

export interface QuoteTotals {
  /** Subtotal per items block, keyed by block id. */
  perBlockSubtotals: Record<string, number>;
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  discount: number;
  grandTotal: number;
}

const num = (s: string | number | undefined): number => {
  if (typeof s === 'number') return isNaN(s) ? 0 : s;
  const v = parseFloat((s ?? '').replace(/[^0-9.\-]/g, ''));
  return isNaN(v) ? 0 : v;
};

export function computeItemsSubtotal(b: ItemsBlock): number {
  return (b.items || []).reduce((sum, it) => sum + num(it.qty) * num(it.rate), 0);
}

/** Legacy: subtotal of an old table that used column roles for amounts. */
function legacyTableSubtotal(t: TableBlock): number {
  const roles = t.roles ?? [];
  let amountCol = roles.indexOf('amount');
  if (amountCol < 0) amountCol = t.columns.findIndex((c) => /amount|total/i.test(c));
  if (amountCol < 0) return 0; // a genuinely free-form table contributes nothing
  const qtyCol = roles.indexOf('qty');
  const rateCol = roles.indexOf('rate');
  let sum = 0;
  for (const row of t.rows) {
    if (t.autoAmount && qtyCol >= 0 && rateCol >= 0) sum += num(row[qtyCol]) * num(row[rateCol]);
    else sum += num(row[amountCol]);
  }
  return sum;
}

export function computeTotals(doc: QuoteDoc): QuoteTotals {
  const perBlockSubtotals: Record<string, number> = {};
  let subtotal = 0;
  let hasItems = false;

  for (const page of doc.pages) {
    for (const b of page.blocks) {
      if (b.type === 'items' && !b.hidden) {
        hasItems = true;
        const s = computeItemsSubtotal(b as ItemsBlock);
        perBlockSubtotals[b.id] = s;
        subtotal += s;
      }
    }
  }

  // Legacy fallback only when there are no items blocks at all.
  if (!hasItems) {
    for (const page of doc.pages) {
      for (const b of page.blocks) {
        if (b.type === 'table' && !b.hidden) {
          const s = legacyTableSubtotal(b as TableBlock);
          if (s) { perBlockSubtotals[b.id] = s; subtotal += s; }
        }
      }
    }
  }

  const gstPercent = doc.calc?.gstPercent ?? 0;
  const discount = doc.calc?.discountIsPercent
    ? (subtotal * (doc.calc?.discount ?? 0)) / 100
    : (doc.calc?.discount ?? 0);
  const gstAmount = ((subtotal - discount) * gstPercent) / 100;
  const grandTotal = subtotal - discount + gstAmount;

  return { perBlockSubtotals, subtotal, gstPercent, gstAmount, discount, grandTotal };
}
