import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { mockupApi } from '@/lib/api';
import {
  getMockupTokensRemaining,
  consumeMockupToken,
  MAX_MOCKUP_TOKENS,
} from '@/lib/mockupTokens';
import {
  MOCKUP_TEMPLATES,
  FABRIC_OPTIONS,
  STUDIO_SARA_BRAND,
  type FabricTypeId,
  type MockupTemplate,
} from '@/lib/mockupTemplates';

export interface MockupGeneratorResult {
  imageUrl: string;
  templateName: string;
  fabricType: string;
}

interface MockupGeneratorPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated?: (result: MockupGeneratorResult) => void;
  /** Where to send users for logo branding (premium) */
  premiumMaintenancePath?: string;
}

export function MockupGeneratorPopup({
  open,
  onOpenChange,
  onGenerated,
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
  const [resultImage, setResultImage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTokensLeft(getMockupTokensRemaining());
    }
  }, [open]);

  const resetDesign = () => {
    if (designPreview) URL.revokeObjectURL(designPreview);
    setDesignFile(null);
    setDesignPreview(null);
    setResultImage(null);
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
    setResultImage(null);
  };

  const handleTemplateSelect = (template: MockupTemplate) => {
    setSelectedTemplate(template);
    setFabricType(template.defaultFabric);
    setResultImage(null);
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
      toast.error('No tokens left. You have used all 3 free mockup previews.');
      return;
    }

    if (!consumeMockupToken()) {
      setTokensLeft(0);
      toast.error('No tokens left.');
      return;
    }
    setTokensLeft(getMockupTokensRemaining());

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

      setResultImage(result.imageUrl);
      onGenerated?.({
        imageUrl: result.imageUrl,
        templateName: selectedTemplate.name,
        fabricType: result.fabricType,
      });
      toast.success('Mockup generated! Check the banner on the page.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Mockup generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogoPremiumClick = () => {
    onOpenChange(false);
    navigate(premiumMaintenancePath);
  };

  const canGenerate = !!designFile && !!selectedTemplate && tokensLeft > 0 && !isGenerating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] max-w-2xl gap-0 overflow-hidden rounded-[28px] border-0 p-0 shadow-2xl max-h-[92vh] [&>button]:hidden">
        <button
          type="button"
          aria-label="Close"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-600 shadow-md ring-1 ring-black/5 backdrop-blur transition hover:bg-white hover:text-zinc-900"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative bg-gradient-to-b from-teal-50 via-white to-teal-50/50">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-16 top-8 h-60 w-60 rounded-full bg-teal-300/20 blur-3xl" />
            <div className="absolute -right-16 bottom-0 h-60 w-60 rounded-full bg-teal-300/15 blur-3xl" />
          </div>

          <div className="relative z-10 max-h-[92vh] overflow-y-auto px-5 py-7 sm:px-8">
            {/* Header */}
            <div className="text-center pr-8">
              <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#2b9d8f] to-teal-600 text-white shadow-lg shadow-teal-500/25">
                <Wand2 className="h-6 w-6" />
              </span>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">AI Fabric Mockup</h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
                Upload your design, pick a Studio Sara template — get a realistic fabric mockup with your branding.
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Badge variant="secondary" className="gap-1.5 bg-teal-100 text-teal-800 hover:bg-teal-100">
                  <Coins className="h-3 w-3" />
                  {tokensLeft} of {MAX_MOCKUP_TOKENS} free previews left
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Branding: {STUDIO_SARA_BRAND}
                </Badge>
              </div>
            </div>

            {/* How it works */}
            <div className="mt-6 rounded-2xl bg-white/80 p-4 ring-1 ring-black/5">
              <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                How it works
              </p>
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-200">
                    {designPreview ? (
                      <img src={designPreview} alt="Your design" className="max-h-14 max-w-14 object-contain" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-teal-600" />
                    )}
                  </div>
                  <span className="mt-1 text-[10px] font-medium text-muted-foreground">Your design</span>
                </div>
                <Plus className="h-4 w-4 shrink-0 text-teal-500" />
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-200 overflow-hidden">
                    {selectedTemplate ? (
                      <img src={selectedTemplate.imageUrl} alt={selectedTemplate.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-teal-700 px-1">Our template</span>
                    )}
                  </div>
                  <span className="mt-1 text-[10px] font-medium text-muted-foreground">Studio Sara template</span>
                </div>
                <Equal className="h-4 w-4 shrink-0 text-teal-500" />
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-[#2b9d8f] text-white shadow-md">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="mt-1 text-[10px] font-semibold text-teal-700">AI mockup</span>
                </div>
              </div>
            </div>

            {/* Step 1: Design upload */}
            <div className="mt-5 space-y-2">
              <p className="text-sm font-semibold">1. Upload your design</p>
              <div
                className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-teal-200 bg-white/60 p-4 transition hover:border-teal-400 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleDesignSelect}
                />
                {designPreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={designPreview} alt="Design preview" className="max-h-28 rounded-lg object-contain shadow-sm" />
                    <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); resetDesign(); }}>
                      Change design
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-teal-600" />
                    <p className="text-sm text-muted-foreground">PNG, JPG, AVIF — up to 10 MB</p>
                  </>
                )}
              </div>
            </div>

            {/* Step 2: Template pick */}
            <div className="mt-5 space-y-2">
              <p className="text-sm font-semibold">2. Pick a template <span className="font-normal text-muted-foreground">(provided by us)</span></p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {MOCKUP_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className={`relative aspect-square overflow-hidden rounded-xl ring-2 transition ${
                      selectedTemplate?.id === template.id
                        ? 'ring-[#2b9d8f] shadow-md'
                        : 'ring-black/10 hover:ring-teal-300'
                    }`}
                  >
                    <img src={template.imageUrl} alt={template.name} className="h-full w-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-black/50 px-1 py-1 text-[9px] font-medium text-white truncate">
                      {template.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Fabric */}
            <div className="mt-5 space-y-2">
              <p className="text-sm font-semibold">3. Choose fabric type</p>
              <div className="flex flex-wrap gap-2">
                {FABRIC_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFabricType(f.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      fabricType === f.id
                        ? 'bg-[#2b9d8f] text-white shadow-sm'
                        : 'bg-white ring-1 ring-black/10 text-muted-foreground hover:ring-teal-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Branding */}
            <div className="mt-5 rounded-xl bg-white/70 p-3 ring-1 ring-black/5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Branding</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className="bg-[#2b9d8f] hover:bg-[#2b9d8f]">{STUDIO_SARA_BRAND} (text)</Badge>
                <button
                  type="button"
                  onClick={handleLogoPremiumClick}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition hover:bg-muted/80"
                >
                  <Lock className="h-3 w-3" />
                  Logo branding — Premium
                </button>
              </div>
            </div>

            {/* Result inside popup */}
            <AnimatePresence>
              {resultImage && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 overflow-hidden rounded-2xl bg-white ring-2 ring-[#2b9d8f]/40 shadow-lg"
                >
                  <div className="bg-gradient-to-r from-[#2b9d8f] to-teal-600 px-4 py-2 text-center text-sm font-semibold text-white">
                    Your mockup is ready!
                  </div>
                  <img src={resultImage} alt="Generated mockup" className="mx-auto max-h-[40vh] w-full object-contain p-3" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generate */}
            <Button
              className="mt-6 w-full h-12 rounded-full bg-gradient-to-r from-[#2b9d8f] to-teal-600 text-base shadow-lg shadow-teal-500/20"
              disabled={!canGenerate}
              onClick={handleGenerate}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating mockup… (may take 1–2 min)
                </>
              ) : tokensLeft <= 0 ? (
                'No previews left'
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Mockup
                </>
              )}
            </Button>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              You can close this anytime. When ready, a banner on the page will show your mockup.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
