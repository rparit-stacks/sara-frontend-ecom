import type { QuoteDoc, QuoteBlock, QuoteBlockType, QuoteCalc } from './quoteDoc';
import { Group, BrandingForm, MetaForm, CalcForm, SectionsEditor, inputCls } from './quoteFormParts';

/** The split-view left panel: every form group stacked, sections inline. */
export default function QuoteFormPanel({
  doc, currency, accent, focusBlockId,
  onPatchMeta, onPatchBranding, onPatchCalc, onPatchBlock, onAddBlock, onRemoveBlock, onReorder, onToggle, onAddPage, onRemovePage, onPatchFooter,
}: {
  doc: QuoteDoc; currency: string; accent: string; focusBlockId?: string | null;
  onPatchMeta: (p: Partial<QuoteDoc['meta']>) => void;
  onPatchBranding: (p: Partial<QuoteDoc['branding']>) => void;
  onPatchCalc: (p: Partial<QuoteCalc>) => void;
  onPatchBlock: (pageId: string, blockId: string, p: Partial<QuoteBlock>) => void;
  onAddBlock: (pageId: string, t: QuoteBlockType) => void;
  onRemoveBlock: (pageId: string, blockId: string) => void;
  onReorder: (pageId: string, from: number, to: number) => void;
  onToggle: (pageId: string, blockId: string) => void;
  onAddPage: () => void;
  onRemovePage: (pageId: string) => void;
  onPatchFooter: (text: string) => void;
}) {
  const calc = doc.calc ?? { gstPercent: 0, discount: 0 };
  return (
    <div className="p-3 space-y-3">
      <Group title="Company / branding" icon="fa-building" accent={accent}>
        <BrandingForm doc={doc} onPatchBranding={onPatchBranding} accent={accent} />
      </Group>

      <Group title="Quote details" icon="fa-circle-info" accent={accent} defaultOpen={false}>
        <MetaForm doc={doc} onPatchMeta={onPatchMeta} />
      </Group>

      <Group title="Tax & discount" icon="fa-percent" accent={accent} defaultOpen={false}>
        <CalcForm calc={calc} currency={currency} onPatchCalc={onPatchCalc} />
      </Group>

      {doc.pages.map((page, pageIdx) => (
        <SectionsEditor
          key={page.id}
          page={page}
          pageIdx={pageIdx}
          accent={accent}
          currency={currency}
          focusBlockId={focusBlockId}
          removablePage={pageIdx > 0}
          onPatchBlock={(blockId, p) => onPatchBlock(page.id, blockId, p)}
          onAddBlock={(t) => onAddBlock(page.id, t)}
          onRemoveBlock={(blockId) => onRemoveBlock(page.id, blockId)}
          onReorder={(from, to) => onReorder(page.id, from, to)}
          onToggle={(blockId) => onToggle(page.id, blockId)}
          onRemovePage={() => onRemovePage(page.id)}
        />
      ))}

      <button onClick={onAddPage} className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#924623] hover:text-[#924623] font-semibold text-[13px] flex items-center justify-center gap-2">
        <i className="fa-solid fa-file-circle-plus" /> Add page
      </button>

      <Group title="Footer" icon="fa-shoe-prints" accent={accent} defaultOpen={false}>
        <input className={inputCls} value={doc.footerText} onChange={(e) => onPatchFooter(e.target.value)} />
      </Group>
    </div>
  );
}
