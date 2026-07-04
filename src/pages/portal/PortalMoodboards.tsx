import { useState } from 'react';
import PortalShell from '@/components/portal/PortalShell';
import ProjectSidebar from '@/components/portal/ProjectSidebar';
import Lightbox from '@/components/portal/Lightbox';
import { Sym } from '@/components/portal/Sym';

const IMAGES = [
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=500&q=60',
  'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&w=500&q=60',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=500&q=60',
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=500&q=60',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=60',
  'https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=500&q=60',
  'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=500&q=60',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=500&q=60',
];

export default function PortalMoodboards() {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <PortalShell active="home">
      <ProjectSidebar active="moodboards" />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--p-surface-container-lowest)' }}>
        <div className="h-14 px-6 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <div className="flex items-center gap-3">
            <Sym name="grid_view" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            <h2 className="font-display text-[18px]">Moodboards</h2>
          </div>
          <button className="px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 text-white hover:brightness-110" style={{ background: 'var(--p-primary)' }}>
            <Sym name="add_photo_alternate" className="text-[18px]" /> Add inspiration
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 [&>*]:mb-4">
            {IMAGES.map((src) => (
              <button key={src} onClick={() => setLightbox(src)} className="block w-full rounded-xl overflow-hidden border break-inside-avoid hover:ring-2 transition-all" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <img src={src} className="w-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>
      </main>
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </PortalShell>
  );
}
