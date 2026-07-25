/**
 * Tiny bridge so any page (Cart, Product, etc.) can open the site-wide ChatWidget
 * and auto-send a prepared prompt — without prop-drilling into App.tsx.
 */
export const AI_CHAT_ASK_EVENT = 'ai-chat:ask';

export type AiChatAskDetail = {
  message: string;
  /** Short label shown in the chat bubble (full `message` still goes to the model). */
  displayText?: string;
  /** Open in the large centered modal (better for long breakdowns). Default true. */
  expand?: boolean;
};

export function openAiChatAsk(message: string, opts?: { expand?: boolean; displayText?: string }) {
  const trimmed = message?.trim();
  if (!trimmed || typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<AiChatAskDetail>(AI_CHAT_ASK_EVENT, {
      detail: {
        message: trimmed,
        displayText: opts?.displayText?.trim() || undefined,
        expand: opts?.expand ?? true,
      },
    })
  );
}

function money(n: unknown): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatVariants(item: any): string[] {
  const lines: string[] = [];
  if (item.variantSelections && typeof item.variantSelections === 'object') {
    for (const sel of Object.values(item.variantSelections) as any[]) {
      if (!sel) continue;
      const name = sel.variantName || 'Variant';
      const value = sel.optionValue ?? sel.optionLabel ?? sel.optionId ?? '';
      const mod = sel.priceModifier != null ? Number(sel.priceModifier) : 0;
      lines.push(
        mod
          ? `${name}: ${value} (modifier ${money(mod)}/m)`
          : `${name}: ${value}`
      );
    }
  } else if (item.variants && typeof item.variants === 'object') {
    for (const [k, v] of Object.entries(item.variants)) {
      lines.push(`${k}: ${String(v)}`);
    }
  }
  return lines;
}

/**
 * Builds a detailed, instruction-heavy prompt so the assistant explains a cart line
 * breakdown using only the numbers from the cart (never invents a new total).
 */
export function buildCartItemBreakdownPrompt(item: any): string {
  const qty = Number(item.quantity || 1);
  const productType = String(item.productType || 'UNKNOWN');
  const typeLabel =
    productType === 'DESIGNED'
      ? 'Print / designed product'
      : productType === 'PLAIN'
        ? 'Plain fabric'
        : productType === 'CUSTOM'
          ? 'Custom print'
          : productType === 'DIGITAL'
            ? 'Digital product'
            : productType;

  const variantLines = formatVariants(item);
  const customKeys =
    item.customFormData && typeof item.customFormData === 'object'
      ? Object.entries(item.customFormData)
          .filter(([k, v]) => v != null && String(v).trim() !== '' && k !== 'fabricMeters')
          .map(([k, v]) => `${k}: ${String(v)}`)
      : [];

  const facts: string[] = [
    `Product name: ${item.productName || 'Untitled'}`,
    `Product type: ${typeLabel} (${productType})`,
    `Quantity: ${qty}${productType === 'DIGITAL' ? ' unit(s)' : ' meter(s)'}`,
  ];

  if (item.designPrice != null) facts.push(`Print / design price (per meter): ${money(item.designPrice)}`);
  if (item.fabricId != null) facts.push(`Fabric id: ${item.fabricId}`);
  if (item.baseFabricPerMeter != null) facts.push(`Base fabric rate (per meter, before slab): ${money(item.baseFabricPerMeter)}`);
  if (item.fabricSlabDiscountPerMeter != null)
    facts.push(`Fabric slab discount (per meter): ${money(item.fabricSlabDiscountPerMeter)}`);
  if (item.effectiveFabricPerMeter != null)
    facts.push(`Effective fabric rate (per meter, after slab): ${money(item.effectiveFabricPerMeter)}`);
  if (item.fabricPrice != null) facts.push(`Fabric line total (for this qty): ${money(item.fabricPrice)}`);
  if (item.combinedFabricMetres != null)
    facts.push(`Combined fabric metres used for slab (cart-wide): ${item.combinedFabricMetres}`);
  if (item.discountSource) facts.push(`Discount source: ${item.discountSource}`);
  if (item.unitPrice != null) facts.push(`Unit price (per meter / unit, all-in): ${money(item.unitPrice)}`);
  if (item.totalPrice != null) facts.push(`Line total (unit × qty) — AUTHORITATIVE: ${money(item.totalPrice)}`);

  if (variantLines.length) {
    facts.push('Selected variants:');
    variantLines.forEach((l) => facts.push(`  - ${l}`));
  }
  if (customKeys.length) {
    facts.push('Custom / form details:');
    customKeys.forEach((l) => facts.push(`  - ${l}`));
  }

  return [
    'Please explain the PRICE BREAKDOWN for this cart item.',
    '',
    'HOW TO REPLY (follow strictly):',
    '1) Start with 1 short sentence confirming which item you are explaining.',
    '2) Put the numeric breakdown in the `table` field with columns like: Component | Amount | Notes.',
    '   Include rows that apply: fabric (base → discount → effective), print/design, variant modifiers, quantity/meters, and the final line total.',
    '3) In replyText, use clear bullet points that teach the customer *why* each number exists (e.g. what a slab discount is, what print/m means, why qty multiplies the unit price).',
    '4) Use ONLY the figures in CART ITEM FACTS below. Do NOT invent prices, do NOT recalculate a different grand total, and do NOT contradict the authoritative line total.',
    '5) If something is missing (e.g. no fabric on a plain digital item), skip that row — do not guess.',
    '6) Keep currency as ₹. Prefer point-by-point explanation; each bullet can be 1–2 full sentences.',
    '7) End with suggestedFollowUps (3–4 short taps), e.g. change quantity, swap fabric, ask about sampling, explain GST/shipping at checkout.',
    '8) Do NOT call price-estimate or KB tools for this — the cart numbers are already final for this line.',
    '',
    'CART ITEM FACTS (source of truth from the customer\'s cart):',
    ...facts.map((f) => `- ${f}`),
  ].join('\n');
}
