import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  X,
  Sparkles,
  Loader2,
  Lock,
  Plus,
  Equal,
  ImageIcon,
  Wand2,
  Coins,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { mockupApi } from '@/lib/api';
import {
  getMockupTokensRemaining,
  consumeMockupToken,
  resetMockupTokens,
  MAX_MOCKUP_TOKENS,
} from '@/lib/mockupTokens';
import {
  MOCKUP_TEMPLATES,
  FABRIC_OPTIONS,
  STUDIO_SARA_BRAND,
  type FabricTypeId,
  type MockupTemplate,
} from '@/lib/mockupTemplates';

export interface MockupAttachPayload {
  designFile: File;
  mockupDataUrl: string;
  templateName: string;
  fabricType: string;
  width: number;
  height: number;
}

interface MockupGeneratorPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after generation — parent uploads & attaches to product */
  onAttach?: (payload: MockupAttachPayload) => Promise<void>;
  premiumMaintenancePath?: string;
}

export function MockupGeneratorPopup({
  open,
  onOpenChange,
  onAttach,
  premiumMaintenancePath = '/admin-sara/maintenance',
}: MockupGeneratorPopupProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tokensLeft, setTokensLeft] = useState(MAX_MOCKUP_TOKENS);
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designPreview, setDesignPreview] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<MockupTemplate | null>(null);
  const [fabricType, setFabricType] = useState<FabricTypeId>('cotton');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [attached, setAttached] = useState(false);

  useEffect(() => {
    if (open) {
      setTokensLeft(getMockupTokensRemaining());
      setAttached(false);
    }
  }, [open]);

  const resetDesign = () => {
    if (designPreview) URL.revokeObjectURL(designPreview);
    setDesignFile(null);
    setDesignPreview(null);
    setAttached(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDesignSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10 MB.');
      return;
    }

    if (designPreview) URL.revokeObjectURL(designPreview);
    setDesignFile(file);
    setDesignPreview(URL.createObjectURL(file));
    setAttached(false);
  };

  const handleTemplateSelect = (template: MockupTemplate) => {
    setSelectedTemplate(template);
    setFabricType(template.defaultFabric);
    setAttached(false);
  };

  const handleGenerate = async () => {
    if (!designFile) {
      toast.error('Please upload your design first.');
      return;
    }
    if (!selectedTemplate) {
      toast.error('Please pick a mockup template.');
      return;
    }
    if (tokensLeft <= 0) {
      toast.error('No tokens left. You have used all 3 free mockups.');
      return;
    }
    if (!onAttach) {
      toast.error('Attach handler not configured.');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await mockupApi.generateMockup({
        designFile,
        templateUrl: selectedTemplate.imageUrl,
        templateFileName: selectedTemplate.fileName,
        fabricType,
        companyName: STUDIO_SARA_BRAND,
        brandingMode: 'name',
      });

      setIsGenerating(false);
      setIsAttaching(true);

      await onAttach({
        designFile,
        mockupDataUrl: result.imageUrl,
        templateName: selectedTemplate.name,
        fabricType: result.fabricType,
        width: result.width,
        height: result.height,
      });

      if (!consumeMockupToken()) {
        toast.error('Token update failed.');
        return;
      }
      setTokensLeft(getMockupTokensRemaining());

      setAttached(true);
      toast.success('Mockup attached to your product!');
      setTimeout(() => onOpenChange(false), 1200);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Mockup failed. Token not used.');
    } finally {
      setIsGenerating(false);
      setIsAttaching(false);
    }
  };

  const handleRefillTokens = () => {
    resetMockupTokens();
    setTokensLeft(MAX_MOCKUP_TOKENS);
    toast.success(`${MAX_MOCKUP_TOKENS} mockup credits refilled!`);
  };

  const handleLogoPremiumClick = () => {
    onOpenChange(false);
    navigate(premiumMaintenancePath);
  };

  const isBusy = isGenerating || isAttaching;
  const canGenerate = !!designFile && !!selectedTemplate && tokensLeft > 0 && !isBusy && !attached;

  return (
    <Dialog open={open} onOpenChange={isBusy ? undefined : onOpenChange}>
      <DialogContent className="w-[94vw] max-w-2xl gap-0 overflow-hidden rounded-[28px] border-0 p-0 shadow-2xl max-h-[92vh] [&>button]:hidden">
        <button
          type="button"
          aria-label="Close"
          disabled={isBusy}
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-600 shadow-md ring-1 ring-black/5 backdrop-blur transition hover:bg-white hover:text-zinc-900 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative bg-gradient-to-b from-teal-50 via-white to-teal-50/50">
          <div className="relative z-10 max-h-[92vh] overflow-y-auto px-5 py-7 sm:px-8">
            <div className="text-center pr-8">
              <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary/80 text-white shadow-lg">
                <Wand2 className="h-6 w-6" />
              </span>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">AI Fabric Mockup</h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
                Upload design, pick template — mockup seedha aapke product mein attach ho jayega.
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Badge variant="secondary" className="gap-1.5 bg-teal-100 text-teal-800 hover:bg-primary/10">
                  <Coins className="h-3 w-3" />
                  {tokensLeft} of {MAX_MOCKUP_TOKENS} left
                </Badge>
                <Badge variant="outline" className="text-xs">Branding: {STUDIO_SARA_BRAND}</Badge>
                {tokensLeft < MAX_MOCKUP_TOKENS && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={handleRefillTokens}
                    className="text-xs font-medium text-primary underline underline-offset-2 hover:text-primary/80 disabled:opacity-50"
                  >
                    Refill credits
                  </button>
                )}
              </div>
            </div>

            {attached ? (
              <div className="mt-8 flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="h-14 w-14 text-primary" />
                <p className="text-lg font-semibold">Mockup attached!</p>
                <p className="text-sm text-muted-foreground">Product page pe mockup image add ho gayi hai.</p>
              </div>
            ) : (
              <>
                <div className="mt-6 rounded-2xl bg-white/80 p-4 ring-1 ring-black/5">
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">How it works</p>
                  <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                    <div className="flex flex-col items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/5 ring-1 ring-teal-200">
                        {designPreview ? (
                          <img src={designPreview} alt="Design" className="max-h-14 max-w-14 object-contain" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-teal-600" />
                        )}
                      </div>
                      <span className="mt-1 text-[10px] text-muted-foreground">Your design</span>
                    </div>
                    <Plus className="h-4 w-4 text-teal-500" />
                    <div className="flex flex-col items-center">
                      <div className="flex h-16 w-16 overflow-hidden rounded-xl bg-primary/5 ring-1 ring-teal-200">
                        {selectedTemplate ? (
                          <img src={selectedTemplate.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-teal-700">Template</span>
                        )}
                      </div>
                      <span className="mt-1 text-[10px] text-muted-foreground">Our template</span>
                    </div>
                    <Equal className="h-4 w-4 text-teal-500" />
                    <div className="flex flex-col items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary/80 to-primary text-white">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <span className="mt-1 text-[10px] font-semibold text-teal-700">Attached mockup</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <p className="text-sm font-semibold">1. Upload your design</p>
                  <div
                    className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-teal-200 bg-white/60 p-4 cursor-pointer hover:border-teal-400"
                    onClick={() => !isBusy && fileInputRef.current?.click()}
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleDesignSelect} disabled={isBusy} />
                    {designPreview ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={designPreview} alt="Design" className="max-h-28 rounded-lg object-contain" />
                        <Button type="button" variant="ghost" size="sm" disabled={isBusy} onClick={(e) => { e.stopPropagation(); resetDesign(); }}>Change</Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-teal-600" />
                        <p className="text-sm text-muted-foreground">PNG, JPG, AVIF — up to 10 MB</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <p className="text-sm font-semibold">2. Pick a template</p>
                  <div className="grid grid-cols-3 gap-2">
                    {MOCKUP_TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleTemplateSelect(t)}
                        className={`relative aspect-square overflow-hidden rounded-xl ring-2 transition disabled:opacity-50 ${
                          selectedTemplate?.id === t.id ? 'ring-primary shadow-md' : 'ring-black/10 hover:ring-primary/30'
                        }`}
                      >
                        <img src={t.imageUrl} alt={t.name} className="h-full w-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-black/50 py-1 text-[9px] text-white truncate px-1">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <p className="text-sm font-semibold">3. Fabric type</p>
                  <div className="flex flex-wrap gap-2">
                    {FABRIC_OPTIONS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        disabled={isBusy}
                        onClick={() => setFabricType(f.id)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                          fabricType === f.id ? 'bg-primary text-white' : 'bg-white ring-1 ring-black/10 text-muted-foreground'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-white/70 p-3 ring-1 ring-black/5">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Branding</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge className="bg-primary hover:bg-primary">{STUDIO_SARA_BRAND} (text)</Badge>
                    <button type="button" onClick={handleLogoPremiumClick} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" /> Logo — Premium
                    </button>
                  </div>
                </div>
              </>
            )}

            {!attached && (
              <Button
                className="mt-6 w-full h-12 rounded-full bg-gradient-to-r from-primary to-primary/80"
                disabled={!canGenerate}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Generating mockup…</>
                ) : isAttaching ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Uploading & attaching…</>
                ) : tokensLeft <= 0 ? (
                  'No mockups left'
                ) : (
                  <><Sparkles className="mr-2 h-5 w-5" />Generate & Attach Mockup</>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
