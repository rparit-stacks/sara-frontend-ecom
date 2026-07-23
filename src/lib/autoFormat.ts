/**
 * Markdown-style auto-formatting for the chat contentEditable editor — Slack/WhatsApp style.
 * As the user types, common markdown syntax is turned into live rich formatting so the
 * message looks in the composer exactly like it will after sending. No send needed to preview.
 *
 * Two trigger kinds:
 *  - Line-start prefixes on Space:  "- ", "* ", "1. "  → bullet / numbered list
 *  - Inline wrappers on closing char: **b**, *i*, _i_, `code`  → bold / italic / code
 *  - Bare URL on Space/Enter → auto-linked <a>
 *
 * Everything works via the browser selection/Range API so undo/caret behave naturally.
 */

function currentTextNodeAndOffset(): { node: Text; offset: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return null;
  return { node: node as Text, offset: range.startOffset };
}

function setCaret(node: Node, offset: number) {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

/**
 * Handle inline wrapper markdown when the user just typed the CLOSING character.
 * Call this from onInput (after the char is in the DOM) or a keyup. Returns true if it
 * transformed something. Uses execCommand so the change is undoable.
 */
export function handleInlineAutoFormat(editor: HTMLElement | null): boolean {
  if (!editor) return false;
  const pos = currentTextNodeAndOffset();
  if (!pos) return false;
  const { node, offset } = pos;
  const text = node.textContent || '';
  const before = text.slice(0, offset);

  // Try each pattern; the delimiters are captured so we can strip them and wrap the inner text.
  // Order matters: ** before * so bold wins over italic.
  const patterns: { re: RegExp; cmd: 'bold' | 'italic' | 'code' }[] = [
    { re: /\*\*([^*\n]+)\*\*$/, cmd: 'bold' },
    { re: /__([^_\n]+)__$/, cmd: 'bold' },
    { re: /(?<!\*)\*([^*\n]+)\*$/, cmd: 'italic' },
    { re: /(?<!_)_([^_\n]+)_$/, cmd: 'italic' },
    { re: /`([^`\n]+)`$/, cmd: 'code' },
  ];

  for (const { re, cmd } of patterns) {
    const m = before.match(re);
    if (!m) continue;
    const inner = m[1];
    if (!inner.trim()) continue;
    const matchStart = offset - m[0].length;

    // Select the whole "**inner**" run, replace with just "inner", then format that selection.
    const sel = window.getSelection();
    if (!sel) return false;
    const range = document.createRange();
    range.setStart(node, matchStart);
    range.setEnd(node, offset);
    sel.removeAllRanges();
    sel.addRange(range);

    if (cmd === 'code') {
      // execCommand has no "code"; do it manually.
      range.deleteContents();
      const codeEl = document.createElement('code');
      codeEl.textContent = inner;
      codeEl.style.background = 'var(--p-surface-container-high)';
      codeEl.style.padding = '1px 4px';
      codeEl.style.borderRadius = '3px';
      codeEl.style.fontSize = '0.9em';
      range.insertNode(codeEl);
      // caret after the code element
      const after = document.createTextNode('​'); // zero-width so caret leaves the <code>
      codeEl.after(after);
      setCaret(after, after.length);
    } else {
      // Replace "**inner**" with "inner" then toggle bold/italic on the selection.
      document.execCommand('insertText', false, inner);
      // After insertText the caret is at end of inserted text; re-select the inserted text.
      const p2 = currentTextNodeAndOffset();
      if (p2) {
        const r2 = document.createRange();
        r2.setStart(p2.node, Math.max(0, p2.offset - inner.length));
        r2.setEnd(p2.node, p2.offset);
        sel.removeAllRanges();
        sel.addRange(r2);
        document.execCommand(cmd);
        // collapse to end so typing continues after the formatted run (not inside it)
        sel.collapseToEnd();
        // typing a normal char next would keep the format on; insert a marker break
        document.execCommand(cmd); // toggle OFF so subsequent text is unformatted
      }
    }
    return true;
  }
  return false;
}

/**
 * Handle line-start list prefixes ("- ", "* ", "1. ") the moment Space is pressed.
 * Call from onKeyDown for the Space key. Returns true if it consumed the space and
 * started a list (caller should preventDefault).
 */
export function handleListShortcut(e: React.KeyboardEvent, editor: HTMLElement | null): boolean {
  if (e.key !== ' ' || e.metaKey || e.ctrlKey || e.altKey) return false;
  if (!editor) return false;
  const pos = currentTextNodeAndOffset();
  if (!pos) return false;
  const { node, offset } = pos;
  const before = (node.textContent || '').slice(0, offset);

  // Only trigger when the prefix is the entire line so far.
  const bullet = /^\s*([-*])$/.test(before);
  const numbered = /^\s*(\d+)\.$/.test(before);
  if (!bullet && !numbered) return false;

  // Don't nest if we're already inside a list item.
  let n: Node | null = node;
  while (n && n !== editor) {
    if (n instanceof HTMLLIElement) return false;
    n = n.parentNode;
  }

  e.preventDefault();
  // Remove the typed prefix, then start the list.
  const range = document.createRange();
  range.setStart(node, 0);
  range.setEnd(node, offset);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
  range.deleteContents();
  document.execCommand(bullet ? 'insertUnorderedList' : 'insertOrderedList');
  return true;
}

/**
 * Auto-link a bare URL that the user just finished typing (on Space or Enter).
 * Returns true if it linked something (caller need not preventDefault for Space —
 * the space is preserved; for Enter the caller keeps its own handling).
 */
export function handleAutoLink(editor: HTMLElement | null): boolean {
  if (!editor) return false;
  const pos = currentTextNodeAndOffset();
  if (!pos) return false;
  const { node, offset } = pos;
  const before = (node.textContent || '').slice(0, offset);
  // Match a URL ending right at the caret (allowing the just-typed trailing space to be excluded).
  const m = before.match(/(?:^|\s)(https?:\/\/[^\s]+?)(\s?)$/);
  if (!m) return false;
  const url = m[1];
  if (url.length < 8) return false;

  // Don't double-link if already inside an <a>.
  let n: Node | null = node;
  while (n && n !== editor) {
    if (n instanceof HTMLAnchorElement) return false;
    n = n.parentNode;
  }

  const trailingSpace = m[2];
  const urlStart = offset - url.length - trailingSpace.length;
  const range = document.createRange();
  range.setStart(node, urlStart);
  range.setEnd(node, offset - trailingSpace.length);
  const sel = window.getSelection();
  if (!sel) return false;
  sel.removeAllRanges();
  sel.addRange(range);
  document.execCommand('createLink', false, url);
  // Move caret to the end (after link + preserve any trailing space).
  sel.collapseToEnd();
  return true;
}
