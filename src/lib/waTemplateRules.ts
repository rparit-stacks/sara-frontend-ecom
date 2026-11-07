/**
 * WhatsApp template rules (from Meta's component limits and category guidelines), kept free of
 * UI code so they can be checked on their own. The service enforces the same rules, so a wrong
 * template is stopped here first and again on the server.
 */

export const LIMITS = {
  nameMax: 100,
  headerText: 60,
  body: 1024,
  footer: 60,
  buttonText: 25,
  url: 2000,
  phone: 20,
  copyCodeExample: 20,
  buttons: 10,
  quickReplies: 10,
  urlButtons: 2,
  phoneButtons: 1,
  copyCodeButtons: 1,
  emojiUtility: 6,
  emojiMarketing: 10,
  sampleImageMB: 5,
  sampleVideoMB: 16,
  sampleDocumentMB: 20,
  authCode: 15,
  couponCode: 20,
  authExpiryMin: 1,
  authExpiryMax: 90,
} as const;

export type Category = 'UTILITY' | 'MARKETING';
export type HeaderKind = 'none' | 'text' | 'image' | 'video' | 'document';
export type ButtonKind = 'quick_reply' | 'url' | 'phone' | 'copy_code';

export interface ButtonDraft {
  id: string;
  kind: ButtonKind;
  text: string;
  url: string;
  urlExample: string;
  phone: string;
  example: string;
}
export interface HeaderDraft {
  kind: HeaderKind;
  text: string;
  textExample: string;
  handle: string;
  fileName: string;
}
export interface Draft {
  name: string;
  language: string;
  category: Category;
  header: HeaderDraft;
  body: string;
  bodyExamples: Record<number, string>;
  footer: string;
  buttons: ButtonDraft[];
}
export interface AuthDraft {
  name: string;
  language: string;
  securityRecommendation: boolean;
  expiryMinutes: number | null;
}
export type IssueField = 'name' | 'language' | 'header' | 'body' | 'footer' | 'buttons' | 'general';
export interface Issue {
  field: IssueField;
  message: string;
}
export type Component = Record<string, any>;

export const emptyHeader = (): HeaderDraft => ({ kind: 'none', text: '', textExample: '', handle: '', fileName: '' });
export const emptyDraft = (): Draft => ({
  name: '', language: 'en', category: 'UTILITY', header: emptyHeader(), body: '', bodyExamples: {}, footer: '', buttons: [],
});
export const newButton = (kind: ButtonKind): ButtonDraft => ({
  id: Math.random().toString(36).slice(2), kind, text: '', url: 'https://', urlExample: '', phone: '+91', example: '',
});

// ---------- small helpers ----------

const VARIABLE = /\{\{\s*([^{}\s]+)\s*\}\}/g;
export const variablesOf = (text: string): string[] => {
  const out: string[] = [];
  for (const m of (text || '').matchAll(VARIABLE)) if (!out.includes(m[1])) out.push(m[1]);
  return out;
};
export const numericVariables = (text: string): number[] =>
  variablesOf(text).filter((v) => /^\d+$/.test(v)).map(Number).sort((a, b) => a - b);

/** Emoji are counted as pictographs; a joined sequence (family, flags with joiner) counts once. */
export const emojiCount = (text: string): number => {
  const withoutJoined = (text || '').replace(/‍\p{Extended_Pictographic}/gu, '');
  return (withoutJoined.match(/\p{Extended_Pictographic}/gu) || []).length;
};

export const toTemplateName = (label: string) =>
  label.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').slice(0, LIMITS.nameMax);

const PROMOTIONAL =
  /\b(discounts?|sale|offers?|deals?|coupons?|promo(tion|tional)?|cashback|buy now|shop now|order now|limited time|hurry|exclusive|free shipping|best price|lowest price|flash sale)\b|% ?off/i;
const OTP_TEXT = /\b(otp|one[- ]time (password|passcode|code)|verification code|login code|security code|passcode)\b/i;
const SENSITIVE_ASK =
  /\b(share|send|enter|provide|reply with|give|tell us)\b[^.\n]{0,30}\b(password|cvv|card number|credit card|debit card|aadhaar|aadhar|pan number|pin number|bank account|net ?banking|upi pin)\b/i;

export const PROMO_WORDS_HINT = 'offer, sale, discount, coupon, cashback, limited time';

// ---------- creating / editing ----------

export const validateDraft = (d: Draft): Issue[] => {
  const issues: Issue[] = [];
  const add = (field: IssueField, message: string) => issues.push({ field, message });

  if (!d.name.trim()) add('name', 'Give the template a name');
  else if (!/^[a-z0-9_]+$/.test(d.name)) add('name', 'Use only lowercase letters, numbers and underscores');
  else if (d.name.length > LIMITS.nameMax) add('name', `The name can be at most ${LIMITS.nameMax} characters`);
  if (!/^[a-z]{2,3}(_[A-Za-z]{2})?$/.test(d.language)) add('language', 'Choose a language');

  let all = '';

  // header
  const h = d.header;
  if (h.kind === 'text') {
    all += ` ${h.text}`;
    if (!h.text.trim()) add('header', 'The header text is empty. Write it, or remove the header');
    if (h.text.length > LIMITS.headerText) add('header', `The header can be at most ${LIMITS.headerText} characters`);
    if (/\n/.test(h.text)) add('header', 'The header must be a single line');
    if (emojiCount(h.text) > 0) add('header', 'The header cannot contain emoji');
    if (/[*_~`]/.test(h.text)) add('header', 'The header cannot use formatting characters (* _ ~ `)');
    const v = variablesOf(h.text);
    if (v.length > 1 || (v.length === 1 && v[0] !== '1')) add('header', 'The header can have one variable, written {{1}}');
    if (v.length === 1 && !h.textExample.trim()) add('header', 'Add an example value for the header variable');
  } else if (h.kind !== 'none' && !h.handle) {
    add('header', `Upload a sample ${h.kind} for the header`);
  }

  // body
  const body = d.body;
  all += ` ${body}`;
  const bodyVars = variablesOf(body);
  if (!body.trim()) add('body', 'Write the message text');
  if (body.replace(VARIABLE, 'x').length > LIMITS.body) add('body', `The message can be at most ${LIMITS.body} characters`);
  if (/\n\s*\n\s*\n/.test(body.replace(/\r\n/g, '\n'))) add('body', 'Leave at most one blank line between paragraphs');
  if (bodyVars.length) {
    if (!bodyVars.every((v) => /^\d+$/.test(v))) add('body', 'Write variables as {{1}}, {{2}}, {{3}}');
    else {
      const nums = numericVariables(body);
      if (nums.some((n, i) => n !== i + 1)) add('body', 'Number the variables {{1}}, {{2}}, {{3}} with none missing');
    }
    const t = body.trim();
    if (t.startsWith('{{') || t.endsWith('}}')) add('body', 'The message cannot start or end with a variable');
    if (/\}\}\s*\{\{/.test(body)) add('body', 'Two variables cannot sit next to each other. Put words between them');
    const words = body.replace(VARIABLE, ' ').split(/\s+/).filter(Boolean).length;
    if (words < 3 * bodyVars.length) add('body', 'Add more text around the variables (WhatsApp expects about 3 words for each variable)');
    const nums = numericVariables(body);
    if (nums.some((n) => !(d.bodyExamples[n] ?? '').trim())) add('body', 'Add an example for every variable');
  }
  const emojiLimit = d.category === 'MARKETING' ? LIMITS.emojiMarketing : LIMITS.emojiUtility;
  if (emojiCount(body) > emojiLimit) add('body', `At most ${emojiLimit} emoji in a ${d.category.toLowerCase()} template`);

  // footer
  if (d.footer) {
    all += ` ${d.footer}`;
    if (d.footer.length > LIMITS.footer) add('footer', `The footer can be at most ${LIMITS.footer} characters`);
    if (d.footer.includes('{{')) add('footer', 'The footer cannot have variables');
    if (/\n/.test(d.footer)) add('footer', 'The footer must be a single line');
    if (emojiCount(d.footer) > 0) add('footer', 'The footer cannot contain emoji');
  }

  // buttons
  const b = d.buttons;
  if (b.length > LIMITS.buttons) add('buttons', `At most ${LIMITS.buttons} buttons`);
  const count = (k: ButtonKind) => b.filter((x) => x.kind === k).length;
  if (count('quick_reply') > LIMITS.quickReplies) add('buttons', `At most ${LIMITS.quickReplies} quick replies`);
  if (count('url') > LIMITS.urlButtons) add('buttons', `At most ${LIMITS.urlButtons} link buttons`);
  if (count('phone') > LIMITS.phoneButtons) add('buttons', `At most ${LIMITS.phoneButtons} call button`);
  if (count('copy_code') > LIMITS.copyCodeButtons) add('buttons', `At most ${LIMITS.copyCodeButtons} copy-code button`);
  const seen = new Set<string>();
  b.forEach((x, i) => {
    const n = i + 1;
    all += ` ${x.text}`;
    if (x.kind !== 'copy_code') {
      if (!x.text.trim()) add('buttons', `Button ${n} needs a label`);
      if (x.text.length > LIMITS.buttonText) add('buttons', `Button ${n}: the label can be at most ${LIMITS.buttonText} characters`);
      if (x.text.includes('{{')) add('buttons', `Button ${n}: labels cannot have variables`);
      if (emojiCount(x.text) > 0) add('buttons', `Button ${n}: labels cannot contain emoji`);
      const key = x.text.trim().toLowerCase();
      if (key && seen.has(key)) add('buttons', `Button ${n}: every button needs a different label`);
      seen.add(key);
    }
    if (x.kind === 'url') {
      if (!/^https:\/\//i.test(x.url.trim())) add('buttons', `Button ${n}: the link must start with https://`);
      if (x.url.length > LIMITS.url) add('buttons', `Button ${n}: the link is too long`);
      const v = variablesOf(x.url);
      if (v.length > 1 || (v.length === 1 && (v[0] !== '1' || !x.url.trim().endsWith('{{1}}')))) {
        add('buttons', `Button ${n}: a link can have one variable, {{1}}, at the very end`);
      }
      if (v.length === 1 && !x.urlExample.trim()) add('buttons', `Button ${n}: add an example for the link variable`);
    }
    if (x.kind === 'phone' && !/^\+[0-9]{6,19}$/.test(x.phone.trim())) {
      add('buttons', `Button ${n}: type the phone number with country code, digits only (for example +919876543210)`);
    }
    if (x.kind === 'copy_code') {
      if (d.category !== 'MARKETING') add('buttons', 'A copy-code button can only be used in a Marketing template');
      if (!/^[A-Za-z0-9]{1,20}$/.test(x.example.trim())) add('buttons', `Button ${n}: the example code must be 1 to ${LIMITS.copyCodeExample} letters or numbers`);
    }
  });

  // category guidelines
  if (OTP_TEXT.test(all)) add('general', 'Login codes and OTPs must use the “Login code” template type, not this one');
  if (SENSITIVE_ASK.test(all)) add('general', 'A template cannot ask customers to share passwords, card, PIN or ID details');
  if (d.category === 'UTILITY' && PROMOTIONAL.test(all)) {
    add('general', `This reads like a promotion (${PROMO_WORDS_HINT}). Promotional text must be a Marketing template`);
  }
  return issues;
};

export const buildComponents = (d: Draft): Component[] => {
  const out: Component[] = [];
  const h = d.header;
  if (h.kind === 'text') {
    out.push({
      type: 'HEADER', format: 'TEXT', text: h.text.trim(),
      ...(variablesOf(h.text).length ? { example: { header_text: [h.textExample.trim()] } } : {}),
    });
  } else if (h.kind !== 'none') {
    out.push({ type: 'HEADER', format: h.kind.toUpperCase(), example: { header_handle: [h.handle] } });
  }
  const nums = numericVariables(d.body);
  out.push({
    type: 'BODY', text: d.body.trim(),
    ...(nums.length ? { example: { body_text: [nums.map((n) => (d.bodyExamples[n] ?? '').trim())] } } : {}),
  });
  if (d.footer.trim()) out.push({ type: 'FOOTER', text: d.footer.trim() });
  if (d.buttons.length) {
    const toMeta = (x: ButtonDraft): Component => {
      if (x.kind === 'quick_reply') return { type: 'QUICK_REPLY', text: x.text.trim() };
      if (x.kind === 'phone') return { type: 'PHONE_NUMBER', text: x.text.trim(), phone_number: x.phone.trim() };
      if (x.kind === 'copy_code') return { type: 'COPY_CODE', example: x.example.trim() };
      return {
        type: 'URL', text: x.text.trim(), url: x.url.trim(),
        ...(variablesOf(x.url).length ? { example: [x.url.trim().replace('{{1}}', x.urlExample.trim())] } : {}),
      };
    };
    // Meta wants the quick replies together and the other buttons together.
    const others = d.buttons.filter((x) => x.kind !== 'quick_reply').map(toMeta);
    const quick = d.buttons.filter((x) => x.kind === 'quick_reply').map(toMeta);
    out.push({ type: 'BUTTONS', buttons: [...others, ...quick] });
  }
  return out;
};

export const validateAuth = (a: AuthDraft): Issue[] => {
  const issues: Issue[] = [];
  if (!a.name.trim()) issues.push({ field: 'name', message: 'Give the template a name' });
  else if (!/^[a-z0-9_]+$/.test(a.name)) issues.push({ field: 'name', message: 'Use only lowercase letters, numbers and underscores' });
  if (!/^[a-z]{2,3}(_[A-Za-z]{2})?$/.test(a.language)) issues.push({ field: 'language', message: 'Choose a language' });
  if (a.expiryMinutes !== null && (!Number.isInteger(a.expiryMinutes) || a.expiryMinutes < LIMITS.authExpiryMin || a.expiryMinutes > LIMITS.authExpiryMax)) {
    issues.push({ field: 'footer', message: `The expiry must be between ${LIMITS.authExpiryMin} and ${LIMITS.authExpiryMax} minutes` });
  }
  return issues;
};

export const buildAuthComponents = (a: AuthDraft): Component[] => [
  { type: 'BODY', add_security_recommendation: a.securityRecommendation },
  ...(a.expiryMinutes ? [{ type: 'FOOTER', code_expiration_minutes: a.expiryMinutes }] : []),
  { type: 'BUTTONS', buttons: [{ type: 'OTP', otp_type: 'COPY_CODE' }] },
];

/** Rebuilds an editable draft from the content Meta holds. */
export const draftFromComponents = (name: string, language: string, category: string, components: Component[]): Draft => {
  const d = emptyDraft();
  d.name = name;
  d.language = language;
  d.category = category === 'MARKETING' ? 'MARKETING' : 'UTILITY';
  for (const c of components || []) {
    const type = String(c.type || '').toUpperCase();
    if (type === 'HEADER') {
      const f = String(c.format || '').toLowerCase();
      if (f === 'text') {
        d.header = { ...emptyHeader(), kind: 'text', text: c.text || '', textExample: c.example?.header_text?.[0] ?? '' };
      } else if (f === 'image' || f === 'video' || f === 'document') {
        // Meta returns a preview link, not an upload handle: the sample has to be uploaded again to edit.
        d.header = { ...emptyHeader(), kind: f };
      }
    } else if (type === 'BODY') {
      d.body = c.text || '';
      const ex: string[] = (c.example?.body_text?.[0] as string[]) || [];
      numericVariables(d.body).forEach((n, i) => { d.bodyExamples[n] = ex[i] ?? ''; });
    } else if (type === 'FOOTER') {
      d.footer = c.text || '';
    } else if (type === 'BUTTONS') {
      for (const b of (c.buttons || []) as Component[]) {
        const t = String(b.type || '').toUpperCase();
        const base = newButton('quick_reply');
        if (t === 'QUICK_REPLY') d.buttons.push({ ...base, text: b.text || '' });
        else if (t === 'URL') {
          const url: string = b.url || 'https://';
          const example: string = (Array.isArray(b.example) ? b.example[0] : '') || '';
          d.buttons.push({ ...base, kind: 'url', text: b.text || '', url, urlExample: variablesOf(url).length ? example.replace(url.replace('{{1}}', ''), '') : '' });
        } else if (t === 'PHONE_NUMBER') d.buttons.push({ ...base, kind: 'phone', text: b.text || '', phone: b.phone_number || '+91' });
        else if (t === 'COPY_CODE') d.buttons.push({ ...base, kind: 'copy_code', example: (Array.isArray(b.example) ? b.example[0] : b.example) || '' });
      }
    }
  }
  return d;
};

// ---------- reading a template (preview and sending) ----------

export interface PartButton {
  index: number;
  type: string;
  text: string;
  url?: string;
  phone?: string;
  needsValue: boolean;
  example?: string;
}
export interface TemplateParts {
  auth: boolean;
  header: { format: string; text: string; hasVariable: boolean } | null;
  body: string;
  bodyVariables: string[];
  footer: string | null;
  buttons: PartButton[];
  unsupported: string[];
}

export const describeTemplate = (category: string, components: Component[] | undefined | null): TemplateParts => {
  const parts: TemplateParts = { auth: category === 'AUTHENTICATION', header: null, body: '', bodyVariables: [], footer: null, buttons: [], unsupported: [] };
  for (const c of components || []) {
    const type = String(c.type || '').toUpperCase();
    if (type === 'HEADER') {
      const format = String(c.format || 'TEXT').toUpperCase();
      parts.header = { format, text: c.text || '', hasVariable: variablesOf(c.text || '').length > 0 };
      if (!['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'].includes(format)) parts.unsupported.push(`a ${format.toLowerCase()} header`);
    } else if (type === 'BODY') {
      parts.body = c.text
        || (parts.auth ? `{{1}} is your verification code.${c.add_security_recommendation ? ' For your security, do not share this code.' : ''}` : '');
      parts.bodyVariables = variablesOf(parts.body);
    } else if (type === 'FOOTER') {
      parts.footer = c.text || (c.code_expiration_minutes ? `This code expires in ${c.code_expiration_minutes} minutes.` : null);
    } else if (type === 'BUTTONS') {
      ((c.buttons || []) as Component[]).forEach((b, index) => {
        const t = String(b.type || '').toUpperCase();
        const url: string = b.url || '';
        const button: PartButton = { index, type: t, text: b.text || (t === 'COPY_CODE' || t === 'OTP' ? 'Copy code' : ''), needsValue: false };
        if (t === 'URL') {
          button.url = url;
          button.needsValue = url.includes('{{');
          button.example = Array.isArray(b.example) ? b.example[0] : undefined;
        } else if (t === 'PHONE_NUMBER') button.phone = b.phone_number;
        else if (t === 'COPY_CODE') { button.needsValue = true; button.example = typeof b.example === 'string' ? b.example : b.example?.[0]; }
        else if (t === 'OTP') { /* filled from the code */ }
        else if (t !== 'QUICK_REPLY') parts.unsupported.push(`a ${t.toLowerCase().replace(/_/g, ' ')} button`);
        parts.buttons.push(button);
      });
    } else if (type !== 'BODY' && type !== 'FOOTER') {
      parts.unsupported.push(`the ${type.toLowerCase()} part`);
    }
  }
  return parts;
};

export interface SendValues {
  variables: Record<string, string>;
  headerText: string;
  headerLink: string;
  buttons: Record<number, string>;
}

export const validateSend = (parts: TemplateParts, v: SendValues): string[] => {
  const problems: string[] = [];
  if (parts.unsupported.length) problems.push(`This template has ${parts.unsupported[0]}, which cannot be sent from here yet`);
  for (const name of parts.bodyVariables) {
    const value = (v.variables[name] ?? '').trim();
    if (!value) problems.push(parts.auth ? 'Type the code' : `Fill in {{${name}}}`);
    else if (value.length > LIMITS.body) problems.push(`{{${name}}} is too long`);
  }
  if (parts.auth) {
    const code = (v.variables['1'] ?? '').trim();
    if (code && !/^[A-Za-z0-9]{1,15}$/.test(code)) problems.push(`The code can be 1 to ${LIMITS.authCode} letters or numbers, with no spaces`);
  }
  if (parts.header) {
    if (parts.header.format === 'TEXT' && parts.header.hasVariable && !v.headerText.trim()) problems.push('Fill in the header value');
    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(parts.header.format) && !/^https:\/\//i.test(v.headerLink.trim())) {
      problems.push(`Paste a public https link to the ${parts.header.format.toLowerCase()} for the header`);
    }
  }
  for (const b of parts.buttons) {
    const value = (v.buttons[b.index] ?? '').trim();
    if (b.type === 'URL' && b.needsValue && !value) problems.push(`Fill in the link value for “${b.text}”`);
    if (b.type === 'COPY_CODE' && !/^[A-Za-z0-9]{1,20}$/.test(value)) problems.push(`The copy code must be 1 to ${LIMITS.couponCode} letters or numbers`);
  }
  return problems;
};

export const fillText = (text: string, values: Record<string, string>) =>
  text.replace(VARIABLE, (_, n) => (values[n]?.trim() ? values[n].trim() : `{{${n}}}`));

// ---------- guidance for the template wizard ----------

export interface Starter {
  id: string;
  label: string;
  category: Category;
  description: string;
  name: string;
  body: string;
  examples: Record<number, string>;
  footer?: string;
}

/** Ready-made wording that already follows every rule. Each one is checked by the rules in a test. */
export const STARTERS: Starter[] = [
  {
    id: 'order_shipped', label: 'Order shipped', category: 'UTILITY', name: 'order_shipped',
    description: 'Tells a customer their order is on the way.',
    body: 'Hello {{1}}, your order #{{2}} has been shipped and will reach you by {{3}}. Thank you for shopping with Studio Sara.',
    examples: { 1: 'Rohit', 2: '1042', 3: '10 Nov' },
  },
  {
    id: 'payment_received', label: 'Payment received', category: 'UTILITY', name: 'payment_received',
    description: 'Confirms a payment for an order.',
    body: 'Hello {{1}}, we have received your payment of {{2}} for order #{{3}}. Your order is now being prepared by our team.',
    examples: { 1: 'Rohit', 2: 'Rs 1,500', 3: '1042' },
  },
  {
    id: 'design_ready', label: 'Design ready for review', category: 'UTILITY', name: 'design_ready',
    description: 'Lets a customer know their custom design is ready to look at.',
    body: 'Hello {{1}}, the design for your request #{{2}} is ready. Please open your Studio Sara account to review it and tell us if you want any changes.',
    examples: { 1: 'Rohit', 2: '42' },
  },
  {
    id: 'new_collection', label: 'New collection', category: 'MARKETING', name: 'new_collection',
    description: 'Announces a new collection to customers who agreed to hear from you.',
    body: 'Hello {{1}}, our new {{2}} collection is now live at Studio Sara. Visit our store to see the new designs and place your order today.',
    examples: { 1: 'Rohit', 2: 'festive' },
    footer: 'Reply STOP to opt out',
  },
  {
    id: 'festival_offer', label: 'Festival offer', category: 'MARKETING', name: 'festival_offer',
    description: 'A time-limited offer.',
    body: 'Hello {{1}}, enjoy {{2}} off on all custom prints at Studio Sara until {{3}}. Order now and make your festival special.',
    examples: { 1: 'Rohit', 2: '15%', 3: '30 Nov' },
    footer: 'Reply STOP to opt out',
  },
  {
    id: 'cart_reminder', label: 'Cart reminder', category: 'MARKETING', name: 'cart_reminder',
    description: 'Reminds someone about items they left in their cart.',
    body: 'Hello {{1}}, you left {{2}} in your cart at Studio Sara. Open our website to complete your order whenever you are ready.',
    examples: { 1: 'Rohit', 2: 'a custom shirt' },
    footer: 'Reply STOP to opt out',
  },
];

export const draftFromStarter = (s: Starter, language: string): Draft => ({
  ...emptyDraft(), name: s.name, language, category: s.category, body: s.body, bodyExamples: { ...s.examples }, footer: s.footer ?? '',
});

export interface CategoryInfo {
  id: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  title: string;
  tagline: string;
  useFor: string[];
  examples: string[];
  watchOut: string[];
  approval: string;
}

export const CATEGORY_INFO: CategoryInfo[] = [
  {
    id: 'UTILITY', title: 'Utility', tagline: 'Updates about something the customer did or asked for',
    useFor: ['Order placed, shipped, delivered', 'Payment received or refunded', 'Booking, design or quote updates', 'Account changes'],
    examples: ['Your order #1042 has shipped.', 'We received your payment of Rs 1,500.'],
    watchOut: ['No offers, discounts or "shop now" wording, even a small one', 'It must be about that customer’s own order or request', 'If it reads like promotion, WhatsApp moves it to Marketing and it costs more'],
    approval: 'Usually minutes to a few hours',
  },
  {
    id: 'MARKETING', title: 'Marketing', tagline: 'Offers, new arrivals and reminders to come back',
    useFor: ['New collections and launches', 'Sales and festival offers', 'Cart and wishlist reminders', 'Greetings with a promotion'],
    examples: ['Our festive collection is live.', '15% off custom prints this week.'],
    watchOut: ['Only for customers who agreed to receive messages from you', 'It costs more per message than Utility', 'Include a way to opt out, such as "Reply STOP"'],
    approval: 'Usually minutes to a few hours',
  },
  {
    id: 'AUTHENTICATION', title: 'Login code (OTP)', tagline: 'A one-time code with a Copy Code button',
    useFor: ['Login and sign-up codes', 'Confirming a phone number'],
    examples: ['123456 is your verification code.'],
    watchOut: ['WhatsApp fixes the wording, so you only choose the expiry and the security line', 'No links, images or emoji', 'The code can be up to 15 letters or numbers'],
    approval: 'Usually approved straight away',
  },
];

export interface RuleCheck {
  id: string;
  label: string;
  why: string;
  ok: boolean;
}

const has = (issues: Issue[], field: IssueField, re?: RegExp) =>
  issues.some((i) => i.field === field && (!re || re.test(i.message)));

/** The rules a template is checked against, each with whether it passes right now. */
export const ruleChecklist = (d: Draft, issues: Issue[]): RuleCheck[] => [
  { id: 'name', label: 'Name uses lowercase letters, numbers and underscores', why: 'WhatsApp only accepts this format, and it is how the platform finds the template.', ok: !!d.name && !has(issues, 'name') },
  { id: 'body', label: 'Message is written and within 1024 characters', why: 'WhatsApp rejects an empty message or one that is too long.', ok: !!d.body.trim() && !has(issues, 'body', /message|characters|blank line|emoji/i) },
  { id: 'variables', label: 'Variables are numbered in order, not first, last or side by side', why: 'WhatsApp refuses a template where a variable opens or closes the text, or two sit together.', ok: !has(issues, 'body', /variable|number|start or end|next to each other|more text/i) },
  { id: 'examples', label: 'Every variable has an example', why: 'WhatsApp reviews the template with your sample values. They are never sent to customers.', ok: !has(issues, 'body', /example/i) && !has(issues, 'header', /example/i) },
  { id: 'header', label: 'Header follows the limits', why: 'A text header is one short line with no emoji or formatting. Media needs a sample file.', ok: !has(issues, 'header') },
  { id: 'footer', label: 'Footer follows the limits', why: 'A footer is one short line, with no variables or emoji.', ok: !has(issues, 'footer') },
  { id: 'buttons', label: 'Buttons follow the limits', why: 'Labels up to 25 characters, https links, and the allowed number of each kind.', ok: !has(issues, 'buttons') },
  { id: 'fit', label: 'Wording fits the type you chose', why: 'Promotion in a Utility template, a login code outside the Login code type, or asking for passwords and card details gets a template rejected.', ok: !has(issues, 'general') },
];
