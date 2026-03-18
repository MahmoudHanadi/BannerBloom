import React from 'react';
import { useBannerStore } from '../store/bannerStore';
import { BannerRenderer } from './BannerRenderer';
import { calculateElementLayout } from '../utils/layoutUtils';
import { getCategoryMasterSize } from '../config/bannerPresets';

export const CanvasArea: React.FC = () => {
  const bannerSizes = useBannerStore((state) => state.bannerSizes);
  const elements = useBannerStore((state) => state.elements);
  const overrides = useBannerStore((state) => state.overrides);
  const isolatedBannerId = useBannerStore((state) => state.isolatedBannerId);
  const removeElement = useBannerStore((state) => state.removeElement);
  const selectedElementId = useBannerStore((state) => state.selectedElementId);
  const addElement = useBannerStore((state) => state.addElement);
  const addImageElementFromBlob = useBannerStore((state) => state.addImageElementFromBlob);
  const setShowGallery = useBannerStore((state) => state.setShowGallery);

  const [isSpacePressed, setIsSpacePressed] = React.useState(false);
  const [isPanning, setIsPanning] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const lastMousePos = React.useRef({ x: 0, y: 0 });

  const squareBanners = bannerSizes.filter((banner) => banner.category === 'square');
  const horizontalBanners = bannerSizes.filter((banner) => banner.category === 'horizontal');
  const verticalBanners = bannerSizes.filter((banner) => banner.category === 'vertical');
  const isolatedBanner = isolatedBannerId
    ? bannerSizes.find((banner) => banner.id === isolatedBannerId)
    : null;

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        const state = useBannerStore.getState();
        const selectedId = state.selectedElementId;

        if (selectedId) {
          event.preventDefault();

          const bannerId = state.selectedBannerId;
          const banner = state.bannerSizes.find((item) => item.id === bannerId);
          const element = state.elements.find((item) => item.id === selectedId);

          if (banner && element) {
            const stepPixels = event.shiftKey ? 10 : 1;
            const layout = calculateElementLayout(
              element,
              state.overrides[banner.id],
              banner.width,
              banner.height,
              banner.category as 'square' | 'horizontal' | 'vertical',
              1,
              getCategoryMasterSize(state.bannerSizes, banner.category)?.height ?? banner.height,
            );

            let newPixelX = layout.pixelX;
            let newPixelY = layout.pixelY;

            switch (event.key) {
              case 'ArrowUp':
                newPixelY -= stepPixels;
                break;
              case 'ArrowDown':
                newPixelY += stepPixels;
                break;
              case 'ArrowLeft':
                newPixelX -= stepPixels;
                break;
              case 'ArrowRight':
                newPixelX += stepPixels;
                break;
            }

            state.setOverride(banner.id, selectedId, {
              x: (newPixelX / banner.width) * 100,
              y: (newPixelY / banner.height) * 100,
            });
          }
        }
      }

      if (
        event.code === 'Space' &&
        !event.repeat &&
        (event.target as HTMLElement).tagName !== 'INPUT' &&
        (event.target as HTMLElement).tagName !== 'TEXTAREA'
      ) {
        event.preventDefault();
        setIsSpacePressed(true);
      }

      if ((event.metaKey || event.ctrlKey) && event.key === 'h') {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          setShowGallery(true);
        }
      }

      if ((event.key === 'Backspace' || event.key === 'Delete') && selectedElementId) {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          removeElement(selectedElementId);
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let index = 0; index < items.length; index += 1) {
        if (items[index].type.indexOf('image') !== -1) {
          const blob = items[index].getAsFile();
          if (!blob) continue;
          void addImageElementFromBlob(blob, 'clipboard-image.png');
        }
      }

      const text = event.clipboardData?.getData('text/plain');
      if (
        text &&
        (event.target as HTMLElement).tagName !== 'INPUT' &&
        (event.target as HTMLElement).tagName !== 'TEXTAREA'
      ) {
        addElement('text', text);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('paste', handlePaste);
    };
  }, [selectedElementId, removeElement, addElement, addImageElementFromBlob, setShowGallery]);

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!isSpacePressed) return;

    setIsPanning(true);
    lastMousePos.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isPanning || !scrollRef.current) return;

    const dx = event.clientX - lastMousePos.current.x;
    const dy = event.clientY - lastMousePos.current.y;

    scrollRef.current.scrollLeft -= dx;
    scrollRef.current.scrollTop -= dy;
    lastMousePos.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const renderBannerColumn = (banners: typeof bannerSizes, title: string) => (
    <div className="studio-banner-column flex flex-col gap-6 pt-1">
      <h3 className="studio-banner-column-title sticky top-4 z-10 text-base font-bold text-slate-800">
        {title}
      </h3>
      {banners.map((size) => (
        <div key={size.id} className="studio-banner-card flex flex-col gap-3">
          <div className="studio-banner-meta">
            <span className="text-sm font-semibold text-slate-700">{size.name}</span>
            {size.isMaster && (
              <span className="studio-pill studio-badge-master px-2.5 py-1 text-[0.68rem]">
                Source
              </span>
            )}
            <span className="studio-pill studio-badge-size px-2.5 py-1 text-[0.68rem]">
              {size.width} x {size.height}
            </span>
          </div>
          <div className="studio-banner-frame w-fit p-4" data-banner-id={size.id}>
            <BannerRenderer
              bannerId={size.id}
              width={size.width}
              height={size.height}
              elements={elements}
              overrides={overrides[size.id]}
              isMaster={size.isMaster}
              category={size.category}
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={scrollRef}
      className={`studio-canvas-scroll flex-1 overflow-auto p-8 pt-0 ${isSpacePressed ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {isolatedBanner && (
        <div className="pb-3 pt-4">
          <div className="studio-canvas-status flex w-fit items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white/90"></span>
            Placement focus: {isolatedBanner.name}
          </div>
        </div>
      )}

      <div className={`studio-canvas-grid pt-4 ${isSpacePressed ? 'pointer-events-none' : ''}`}>
        {renderBannerColumn(squareBanners, 'Square formats (1:1)')}
        {renderBannerColumn(horizontalBanners, 'Landscape formats')}
        {renderBannerColumn(verticalBanners, 'Vertical formats')}
      </div>
    </div>
  );
};
