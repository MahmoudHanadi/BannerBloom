import React from 'react';
import { useBannerStore } from '../store/bannerStore';
import { BannerRenderer } from './BannerRenderer';
import { calculateElementLayout } from '../utils/layoutUtils';
import { Info } from 'lucide-react';

export const CanvasArea: React.FC = () => {
    const bannerSizes = useBannerStore((state) => state.bannerSizes);
    const elements = useBannerStore((state) => state.elements);
    const overrides = useBannerStore((state) => state.overrides);
    const isolatedBannerId = useBannerStore((state) => state.isolatedBannerId);
    const [showIsolatedTip, setShowIsolatedTip] = React.useState(true);

    // Group banners by category
    const squareBanners = bannerSizes.filter(b => b.category === 'square');
    const horizontalBanners = bannerSizes.filter(b => b.category === 'horizontal');
    const verticalBanners = bannerSizes.filter(b => b.category === 'vertical');

    const renderBannerColumn = (banners: typeof bannerSizes, title: string) => (
        <div className="flex flex-col gap-6 pt-2">
            <h3 className="text-lg font-bold text-gray-700 sticky top-[76px] bg-white py-3 z-10 shadow-sm border-b border-gray-100 px-3 rounded-md">{title}</h3>
            {banners.map((size) => (
                <div key={size.id} className="flex flex-col gap-2">
                    <div className={`text-sm font-medium ${size.isMaster ? 'text-emerald-600 font-bold' : 'text-gray-600'}`}>
                        {size.name} {size.isMaster && '(Master)'}
                    </div>
                    <div data-banner-id={size.id}>
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

    const [isSpacePressed, setIsSpacePressed] = React.useState(false);
    const [isPanning, setIsPanning] = React.useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const lastMousePos = React.useRef({ x: 0, y: 0 });

    const removeElement = useBannerStore((state) => state.removeElement);
    const selectedElementId = useBannerStore((state) => state.selectedElementId);
    const addElement = useBannerStore((state) => state.addElement);
    const setShowGallery = useBannerStore((state) => state.setShowGallery);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Arrow Keys for Moving Elements
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                // Check if we are inside an input/textarea
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

                const state = useBannerStore.getState();
                const selectedId = state.selectedElementId;

                if (selectedId) {
                    e.preventDefault(); // Prevent scrolling

                    const bannerId = state.selectedBannerId;
                    // If no banner is selected, maybe default to the first one or master?
                    // But typically if an element is selected, a banner might be 'active' visually.
                    // The store keeps track of selectedBannerId.

                    const banner = state.bannerSizes.find(b => b.id === bannerId);
                    const element = state.elements.find(el => el.id === selectedId);

                    if (banner && element) {
                        const stepPixels = e.shiftKey ? 10 : 1;

                        // Calculate current layout to get visual pixel position
                        const layout = calculateElementLayout(
                            element,
                            state.overrides[banner.id],
                            banner.width,
                            banner.height,
                            banner.category as 'square' | 'horizontal' | 'vertical'
                        );

                        let newPixelX = layout.pixelX;
                        let newPixelY = layout.pixelY;

                        switch (e.key) {
                            case 'ArrowUp': newPixelY -= stepPixels; break;
                            case 'ArrowDown': newPixelY += stepPixels; break;
                            case 'ArrowLeft': newPixelX -= stepPixels; break;
                            case 'ArrowRight': newPixelX += stepPixels; break;
                        }

                        // Convert back to percentages
                        const newXPercent = (newPixelX / banner.width) * 100;
                        const newYPercent = (newPixelY / banner.height) * 100;

                        state.setOverride(banner.id, selectedId, {
                            x: newXPercent,
                            y: newYPercent
                        });
                    }
                }
            }

            if (e.code === 'Space' && !e.repeat && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                e.preventDefault(); // Prevent scrolling with space
                setIsSpacePressed(true);
            }

            // Cmd/Ctrl + H to open Projects Dashboard
            if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
                const target = e.target as HTMLElement;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    setShowGallery(true);
                }
            }

            if ((e.key === 'Backspace' || e.key === 'Delete') && selectedElementId) {
                const target = e.target as HTMLElement;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    removeElement(selectedElementId);
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
                setIsPanning(false);
            }
        };

        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (!blob) continue;

                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const imageData = event.target?.result as string;
                        const img = new Image();
                        img.onload = () => {
                            addElement('image', imageData, undefined, {
                                width: img.naturalWidth,
                                height: img.naturalHeight
                            });
                        };
                        img.src = imageData;
                    };
                    reader.readAsDataURL(blob);
                }
            }

            // Handle Text Paste
            const text = e.clipboardData?.getData('text/plain');
            if (text && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
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
    }, [selectedElementId, removeElement, addElement, setShowGallery]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isSpacePressed) {
            setIsPanning(true);
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            // e.preventDefault(); // Don't prevent default here, might block other interactions if space released?
            // Actually, if space is pressed, we want to block other interactions (like selecting text)
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning && scrollRef.current) {
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;
            scrollRef.current.scrollLeft -= dx;
            scrollRef.current.scrollTop -= dy;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    return (
        <div
            ref={scrollRef}
            className={`flex-1 bg-gray-100 p-8 pt-0 overflow-auto ${isSpacePressed ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="sticky top-0 bg-gray-100 z-20 shadow-sm pb-2">
                <h2 className="text-2xl font-bold text-gray-800 py-6 mb-0 select-none">Canvas - IAB Standard Sizes</h2>
                {showIsolatedTip && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
                        <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <strong className="text-amber-900">New Feature:</strong>
                            <span className="text-amber-800"> Click any banner 3 times to enter <strong>Isolated Mode</strong> - edit that size independently without affecting others. Press ESC or click 3 times again to exit.</span>
                        </div>
                        <button 
                            onClick={() => setShowIsolatedTip(false)}
                            className="text-amber-600 hover:text-amber-800 font-bold text-lg leading-none"
                        >
                            ×
                        </button>
                    </div>
                )}
                {isolatedBannerId && (
                    <div className="mt-2 bg-amber-500 text-white px-4 py-2 rounded-md font-semibold text-sm flex items-center gap-2">
                        <span className="animate-pulse">●</span>
                        Isolated Mode Active - Editing {bannerSizes.find(b => b.id === isolatedBannerId)?.name || 'Banner'} only
                    </div>
                )}
            </div>
            <div className={`flex gap-12 ${isSpacePressed ? 'pointer-events-none' : ''}`}>
                {renderBannerColumn(squareBanners, 'Square Banners (1:1)')}
                {renderBannerColumn(horizontalBanners, 'Horizontal Banners')}
                {renderBannerColumn(verticalBanners, 'Vertical Banners (4:5)')}
            </div>
        </div>
    );
};
