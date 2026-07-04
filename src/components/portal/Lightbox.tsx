import { useEffect } from 'react';
import { Sym } from './Sym';

/** Fullscreen image preview. Click backdrop or press Esc to close. */
export default function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6" onClick={onClose}>
      <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" onClick={onClose}>
        <Sym name="close" />
      </button>
      <a href={src} download onClick={(e) => e.stopPropagation()} className="absolute top-4 right-16 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
        <Sym name="download" />
      </a>
      <img src={src} className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} alt="" />
    </div>
  );
}
