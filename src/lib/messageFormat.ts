/** Convert contenteditable HTML to markdown for storage. */
export function htmlToMarkdown(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return walkNodes(div).replace(/\n{3,}/g, '\n\n').trim();
}

function walkNodes(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as HTMLElement;
  const children = Array.from(el.childNodes).map(walkNodes).join('');
  switch (el.tagName) {
    case 'B':
    case 'STRONG':
      return `**${children}**`;
    case 'I':
    case 'EM':
      return `*${children}*`;
    case 'CODE':
      return `\`${children}\``;
    case 'BR':
      return '\n';
    case 'DIV':
    case 'P':
      return children.endsWith('\n') ? children : `${children}\n`;
    case 'UL':
      return `${Array.from(el.children)
        .map((li) => `- ${walkNodes(li).trim()}`)
        .join('\n')}\n`;
    case 'OL': {
      let n = 1;
      return `${Array.from(el.children)
        .map((li) => `${n++}. ${walkNodes(li).trim()}`)
        .join('\n')}\n`;
    }
    case 'LI':
      return children;
    case 'A': {
      const href = el.getAttribute('href') || 'url';
      return `[${children || href}](${href})`;
    }
    default:
      return children;
  }
}

export function isEditorEmpty(el: HTMLElement | null): boolean {
  if (!el) return true;
  const text = el.textContent?.replace(/\u00a0/g, ' ').trim();
  return !text;
}

/** Strip product/payment markers for plain-text previews. */
export function stripMessageMarkers(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/\[\[(?:product|payment):[^\]]+\]\]/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/\*|_/g, '')
    .trim();
}
