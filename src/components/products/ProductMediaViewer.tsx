import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

export type MediaViewerType = 'image' | 'video';

export interface ProductMediaViewerProps {
  open: boolean;
  onClose: () => void;
  url: string | null;
  type: MediaViewerType;
  alt?: string;
}

export function ProductMediaViewer({ open, onClose, url, type, alt = 'Product media' }: ProductMediaViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Pinch/drag refs (to avoid closure issues)
  const pinchRef = useRef<{ initialDistance: number; initialZoom: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);

  // Reset state when media changes or modal opens
  useEffect(() => {
    if (open && url) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [open, url]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => {
      const next = Math.max(MIN_ZOOM, z - ZOOM_STEP);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (type !== 'image') return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((z) => {
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta));
        if (next <= 1) setPan({ x: 0, y: 0 });
        return next;
      });
    },
    [type]
  );

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    return Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (type !== 'image') return;
      if (e.touches.length === 2) {
        e.preventDefault();
        pinchRef.current = {
          initialDistance: getTouchDistance(e.touches),
          initialZoom: zoom,
        };
        dragRef.current = null;
      } else if (e.touches.length === 1 && zoom > 1) {
        dragRef.current = {
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          startPanX: pan.x,
          startPanY: pan.y,
        };
        pinchRef.current = null;
      }
    },
    [type, zoom, pan]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (type !== 'image') return;
      e.preventDefault();
      if (e.touches.length === 2 && pinchRef.current) {
        const currentDistance = getTouchDistance(e.touches);
        const scale = currentDistance / pinchRef.current.initialDistance;
        const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchRef.current.initialZoom * scale));
        setZoom(nextZoom);
        if (nextZoom <= 1) setPan({ x: 0, y: 0 });
      } else if (e.touches.length === 1 && dragRef.current && zoom > 1) {
        const dx = e.touches[0].clientX - dragRef.current.startX;
        const dy = e.touches[0].clientY - dragRef.current.startY;
        setPan({
          x: dragRef.current.startPanX + dx,
          y: dragRef.current.startPanY + dy,
        });
      }
    },
    [type, zoom]
  );

  const handleTouchEnd = useCallback(() => {
    pinchRef.current = null;
    if (zoom <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (type !== 'image' || zoom <= 1 || e.button !== 0) return;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
    },
    [type, zoom, pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (type !== 'image' || !dragRef.current || zoom <= 1) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPan({
        x: dragRef.current.startPanX + dx,
        y: dragRef.current.startPanY + dy,
      });
    },
    [type, zoom]
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          'inset-0 left-0 right-0 top-0 bottom-0 w-screen h-screen max-w-none max-h-none translate-x-0 translate-y-0 p-0 gap-0',
          'bg-black/90 border-none rounded-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-100',
          '[&>button]:hidden'
        )}
      >
        <div
          ref={containerRef}
          className="fixed inset-0 flex flex-col items-center justify-center w-full h-full touch-none select-none"
          style={{ overscrollBehavior: 'none' }}
        >
          {/* Top-right controls */}
          <div className="absolute top-0 right-0 z-50 flex items-center gap-1 sm:gap-2 p-3 sm:p-4">
            {type === 'image' && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 active:scale-95"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={handleZoomIn}
                  className="p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 active:scale-95"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 active:scale-95"
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Media content */}
          <div
            className={cn(
              'flex-1 w-full h-full flex items-center justify-center overflow-hidden',
              'min-h-0' // Allow flex child to shrink
            )}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ touchAction: type === 'image' ? 'none' : 'auto' }}
          >
            {url && type === 'image' && (
              <img
                ref={imageRef}
                src={url}
                alt={alt}
                className="max-w-[95vw] max-h-[85vh] w-auto h-auto object-contain select-none pointer-events-none transition-transform duration-150 ease-out"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                }}
                draggable={false}
              />
            )}
            {url && type === 'video' && (
              <div className="w-full h-full flex items-center justify-center p-4 sm:p-6">
                <video
                  src={url}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                  controls
                  autoPlay
                  muted
                  playsInline
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
