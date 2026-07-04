import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import InquiryPageView from '@/components/inquiry/InquiryPageView';
import { manufacturingApi } from '@/lib/api';
import {
  DEFAULT_INQUIRY_CONTENT,
  SECTION_TEMPLATES,
  createSection,
  normalizeInquiryContent,
  type InquiryPageContent,
  type InquirySectionType,
} from '@/components/inquiry/inquiryContent';

export default function PortalAdminInquiryContent() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [content, setContent] = useState<InquiryPageContent>(DEFAULT_INQUIRY_CONTENT);
  const [dirty, setDirty] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-inquiry-content'],
    queryFn: () => manufacturingApi.getInquiryContentAdmin(),
  });

  useEffect(() => {
    if (data) setContent(normalizeInquiryContent(data));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: InquiryPageContent) => manufacturingApi.saveInquiryContent(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-inquiry-content'] });
      qc.invalidateQueries({ queryKey: ['inquiry-content'] });
      setDirty(false);
      toast.success('Inquiry page published');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to save'),
  });

  const change = (next: InquiryPageContent) => {
    setContent(next);
    setDirty(true);
  };

  const addSection = (type: InquirySectionType) => {
    change({ ...content, sections: [...content.sections, createSection(type)] });
    setPanelOpen(false);
    toast.success('Section added at the bottom — scroll down');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Slim full-width toolbar */}
      <header className="sticky top-0 z-50 h-14 px-3 sm:px-5 flex items-center justify-between gap-3 bg-white/95 backdrop-blur border-b border-primary/10 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => navigate('/portal-admin')}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-foreground hover:bg-primary/10 transition-colors shrink-0"
            title="Back to dashboard"
          >
            <i className="fa-solid fa-arrow-left" />
          </button>
          <div className="min-w-0">
            <h1 className="font-semibold text-[15px] truncate">Inquiry Page</h1>
            <p className="text-[11px] text-muted-foreground -mt-0.5 truncate">
              Click any text to edit · live page builder
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {dirty && (
            <span className="hidden sm:inline text-[12px] font-medium text-amber-600">Unsaved changes</span>
          )}
          <a
            href="/inquiry"
            target="_blank"
            rel="noreferrer"
            className="h-9 px-3 rounded-lg text-[13px] font-semibold border border-primary/20 text-foreground hover:bg-primary/5 transition-colors flex items-center gap-1.5"
          >
            <i className="fa-solid fa-up-right-from-square text-[12px]" />
            <span className="hidden sm:inline">View live</span>
          </a>
          <button
            onClick={() => saveMutation.mutate(content)}
            disabled={saveMutation.isPending}
            className="h-9 px-4 rounded-lg text-[13px] font-semibold text-white bg-primary hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            <i className="fa-solid fa-cloud-arrow-up text-[12px]" />
            {saveMutation.isPending ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </header>

      {/* Full-width live editable page */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <i className="fa-solid fa-spinner fa-spin text-2xl" />
        </div>
      ) : (
        <InquiryPageView content={content} editable onChange={change} />
      )}

      {/* Floating "Add section" button */}
      <button
        onClick={() => setPanelOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-12 px-5 rounded-full bg-primary text-white font-semibold text-[14px] shadow-xl hover:brightness-110 hover:scale-105 transition-all flex items-center gap-2"
        title="Add a section"
      >
        <i className="fa-solid fa-plus" /> Add section
      </button>

      {/* Slide-over panel of pre-built sections */}
      {panelOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPanelOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[88vw] max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="h-14 px-4 flex items-center justify-between border-b border-primary/10 shrink-0">
              <h2 className="font-bold text-[15px] flex items-center gap-2">
                <i className="fa-solid fa-shapes text-primary" /> Pre-built sections
              </h2>
              <button onClick={() => setPanelOpen(false)} className="w-9 h-9 rounded-lg hover:bg-primary/10 flex items-center justify-center" title="Close">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto flex-1">
              <p className="text-[12px] text-muted-foreground mb-1">
                Click to add a block to the bottom of the page, then use the toolbar on the section to reorder it.
              </p>
              {SECTION_TEMPLATES.map((t) => (
                <button
                  key={t.type}
                  onClick={() => addSection(t.type)}
                  className="w-full text-left rounded-xl border border-primary/15 p-3 flex items-start gap-3 hover:border-primary hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <i className={`fa-solid ${t.icon} text-[16px] text-primary`} />
                  </div>
                  <span>
                    <span className="block text-[14px] font-semibold">{t.label}</span>
                    <span className="block text-[12px] leading-snug text-muted-foreground">{t.description}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-primary/10 shrink-0">
              <button
                onClick={() => { change(DEFAULT_INQUIRY_CONTENT); setPanelOpen(false); toast.message('Reset to default layout'); }}
                className="w-full h-10 rounded-lg text-[13px] font-semibold border border-primary/20 text-muted-foreground hover:bg-primary/5 flex items-center justify-center gap-1.5"
              >
                <i className="fa-solid fa-rotate-left" /> Reset to default
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
