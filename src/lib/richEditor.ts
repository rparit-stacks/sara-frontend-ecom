/** Active inline formatting state from the browser selection. */
export type FormatState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  unorderedList: boolean;
  orderedList: boolean;
};

export function readFormatState(): FormatState {
  try {
    return {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      unorderedList: document.queryCommandState('insertUnorderedList'),
      orderedList: document.queryCommandState('insertOrderedList'),
    };
  } catch {
    return { bold: false, italic: false, underline: false, unorderedList: false, orderedList: false };
  }
}

export function applyFormat(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

export function wrapSelectionInCode() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  const code = document.createElement('code');
  code.style.background = 'var(--p-surface-container-high)';
  code.style.padding = '1px 4px';
  code.style.borderRadius = '3px';
  code.style.fontSize = '0.9em';
  try {
    range.surroundContents(code);
  } catch {
    code.appendChild(range.extractContents());
    range.insertNode(code);
  }
  sel.removeAllRanges();
  const nr = document.createRange();
  nr.selectNodeContents(code);
  nr.collapse(false);
  sel.addRange(nr);
}

function closestListItem(node: Node | null): HTMLLIElement | null {
  let el: Node | null = node;
  while (el) {
    if (el instanceof HTMLLIElement) return el;
    el = el.parentNode;
  }
  return null;
}

function isListItemEmpty(li: HTMLLIElement): boolean {
  const text = li.textContent?.replace(/\u00a0/g, ' ').trim() ?? '';
  if (text) return false;
  return li.querySelectorAll('img, br').length <= 1;
}

function placeCaretAtEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/** Handle Enter inside bullet/numbered lists — exit after two Enters on an empty item. */
export function handleListEnter(e: React.KeyboardEvent, editor: HTMLElement | null): boolean {
  if (e.key !== 'Enter' || e.metaKey || e.ctrlKey || e.shiftKey) return false;
  const sel = window.getSelection();
  if (!sel?.anchorNode) return false;
  const li = closestListItem(sel.anchorNode);
  if (!li) return false;
  const list = li.closest('ul, ol');
  if (!list || !editor?.contains(list)) return false;

  if (!isListItemEmpty(li)) {
    delete li.dataset.pendingExit;
    return false;
  }

  e.preventDefault();
  if (li.dataset.pendingExit !== '1') {
    li.dataset.pendingExit = '1';
    return true;
  }
  delete li.dataset.pendingExit;

  const parent = list.parentNode;
  if (!parent) return true;

  const after = document.createElement('div');
  after.appendChild(document.createElement('br'));
  if (list.querySelectorAll('li').length <= 1) {
    list.remove();
  } else {
    li.remove();
  }
  parent.insertBefore(after, list.nextSibling);
  placeCaretAtEnd(after);
  return true;
}
