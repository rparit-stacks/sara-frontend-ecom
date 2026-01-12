import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, CheckCircle2 } from 'lucide-react';

const fabrics = [
  {
    id: 'silk-pink',
    name: 'Silk – Blush Pink',
    description: 'Soft premium mulberry silk with subtle sheen.',
    image: 'https://images.unsplash.com/photo-1604908176997-1251884b08a3?w=600&h=800&fit=crop',
  },
  {
    id: 'cotton-cream',
    name: 'Cotton – Warm Cream',
    description: 'Breathable cotton, perfect for everyday wear.',
    image: 'https://images.unsplash.com/photo-1600093463592-9f61806a0aab?w=600&h=800&fit=crop',
  },
  {
    id: 'linen-sage',
    name: 'Linen – Sage Green',
    description: 'Textured linen with a modern earthy tone.',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=800&fit=crop',
  },
];

const designs = [
  {
    id: 'rose-garden',
    name: 'Rose Garden',
    description: 'Hand-drawn rose motifs inspired by Jaipur gardens.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=800&fit=crop',
  },
  {
    id: 'paisley-classic',
    name: 'Classic Paisley',
    description: 'Timeless paisley pattern for a regal look.',
    image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&h=800&fit=crop',
  },
  {
    id: 'geometric-modern',
    name: 'Modern Geometric',
    description: 'Clean geometric lines for a contemporary feel.',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
  },
];

const Customize = () => {
  const [selectedFabricId, setSelectedFabricId] = useState(fabrics[0].id);
  const [selectedDesignId, setSelectedDesignId] = useState(designs[0].id);
  const [uploadedDesignUrl, setUploadedDesignUrl] = useState<string | null>(null);

  const selectedFabric = fabrics.find((f) => f.id === selectedFabricId)!;
  const selectedDesign = designs.find((d) => d.id === selectedDesignId)!;

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedDesignUrl(url);
  };

  return (
    <Layout>
      <section className="w-full py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          {/* Header */}
          <div className="mb-12 lg:mb-16">
            <ScrollReveal>
              <span className="text-primary uppercase tracking-[0.2em] text-sm font-medium">
                Custom Mockup
              </span>
              <h1 className="font-cursive text-4xl md:text-5xl lg:text-6xl mt-4">
                Design Your Own <span className="text-primary">Silk Scarf</span>
              </h1>
              <p className="text-muted-foreground text-lg mt-4 max-w-2xl">
                Choose a fabric, pick a design or upload your own artwork and preview your
                unique Studio Sara piece in real time.
              </p>
            </ScrollReveal>
          </div>

          {/* Layout: Left (controls) / Right (preview + summary) */}
          <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-10 lg:gap-14 items-start">
            {/* Left: Fabric + Design selection */}
            <div className="space-y-8">
              <Tabs defaultValue="fabric" className="w-full">
                <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 gap-6">
                  <TabsTrigger
                    value="fabric"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 text-sm md:text-base"
                  >
                    Fabrics
                  </TabsTrigger>
                  <TabsTrigger
                    value="design"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 text-sm md:text-base"
                  >
                    Designs
                  </TabsTrigger>
                  <TabsTrigger
                    value="upload"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 text-sm md:text-base"
                  >
                    Upload Your Design
                  </TabsTrigger>
                </TabsList>

                {/* Fabrics */}
                <TabsContent value="fabric" className="pt-6">
                  <div className="grid md:grid-cols-3 gap-5">
                    {fabrics.map((fabric) => (
                      <button
                        key={fabric.id}
                        type="button"
                        onClick={() => setSelectedFabricId(fabric.id)}
                        className={`text-left rounded-xl border transition-all overflow-hidden group ${
                          selectedFabricId === fabric.id
                            ? 'border-primary shadow-md shadow-primary/10'
                            : 'border-border hover:border-primary/40 hover:shadow-sm'
                        }`}
                      >
                        <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                          <img
                            src={fabric.image}
                            alt={fabric.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {selectedFabricId === fabric.id && (
                            <div className="absolute top-2 right-2 bg-primary text-white rounded-full px-2 py-1 text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Selected
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-semibold text-sm md:text-base">{fabric.name}</p>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1">
                            {fabric.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                {/* Designs */}
                <TabsContent value="design" className="pt-6">
                  <div className="grid md:grid-cols-3 gap-5">
                    {designs.map((design) => (
                      <button
                        key={design.id}
                        type="button"
                        onClick={() => {
                          setSelectedDesignId(design.id);
                          setUploadedDesignUrl(null);
                        }}
                        className={`text-left rounded-xl border transition-all overflow-hidden group ${
                          selectedDesignId === design.id && !uploadedDesignUrl
                            ? 'border-primary shadow-md shadow-primary/10'
                            : 'border-border hover:border-primary/40 hover:shadow-sm'
                        }`}
                      >
                        <div className="relative aspect-square bg-muted overflow-hidden">
                          <img
                            src={design.image}
                            alt={design.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {selectedDesignId === design.id && !uploadedDesignUrl && (
                            <div className="absolute top-2 right-2 bg-primary text-white rounded-full px-2 py-1 text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Selected
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-semibold text-sm md:text-base">{design.name}</p>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1">
                            {design.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                {/* Upload */}
                <TabsContent value="upload" className="pt-6">
                  <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6 items-start">
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-white">
                      <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload a transparent PNG/JPG design to apply on the fabric.
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Recommended: 2000x2000px, less than 5MB.
                      </p>
                      <input
                        id="design-upload-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUpload}
                      />
                      <label htmlFor="design-upload-input">
                        <Button type="button" variant="outline" className="h-11 px-6 cursor-pointer">
                          Choose File
                        </Button>
                      </label>
                    </div>
                    <div className="bg-white rounded-xl border border-border p-4 min-h-[180px] flex items-center justify-center">
                      {uploadedDesignUrl ? (
                        <div className="space-y-2 text-center">
                          <img
                            src={uploadedDesignUrl}
                            alt="Uploaded design preview"
                            className="max-h-40 mx-auto object-contain rounded-lg border border-border"
                          />
                          <p className="text-xs text-muted-foreground">
                            Your design will be used instead of the predefined patterns.
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No file selected yet. Upload a design to see a preview here.
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right: Preview + Summary */}
            <div className="space-y-6">
              {/* Preview */}
              <div className="bg-white rounded-2xl border border-border shadow-sm p-4 lg:p-5">
                <h2 className="font-semibold text-base lg:text-lg mb-3">Live Preview</h2>
                <div className="aspect-[3/4] rounded-2xl bg-muted relative overflow-hidden">
                  {/* Fabric layer */}
                  <img
                    src={selectedFabric.image}
                    alt={selectedFabric.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Design overlay */}
                  <div className="absolute inset-5 rounded-2xl overflow-hidden">
                    <img
                      src={uploadedDesignUrl || selectedDesign.image}
                      alt={selectedDesign.name}
                      className="w-full h-full object-cover mix-blend-multiply opacity-80"
                    />
                  </div>
                  {/* Soft vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/5 pointer-events-none" />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
                <h2 className="font-semibold text-base lg:text-lg mb-1">Selection Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">Fabric</p>
                      <p className="text-muted-foreground">{selectedFabric.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">Design</p>
                      <p className="text-muted-foreground">
                        {uploadedDesignUrl ? 'Custom Upload' : selectedDesign.name}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">Estimated Price</p>
                    <p className="font-cursive text-2xl text-primary">₹1,899</p>
                  </div>
                </div>
                <Button className="w-full btn-primary h-12 mt-2 text-base">
                  Add Mockup to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Customize;

