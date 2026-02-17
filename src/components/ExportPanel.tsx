import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import type { BannerSize } from '../store/bannerStore';
import { useBannerStore } from '../store/bannerStore';
import { Download, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { generateHTML5, generateAMP } from '../utils/ampGenerator';
import { createRoot } from 'react-dom/client';
import { BannerRenderer } from './BannerRenderer';

export const ExportPanel: React.FC = () => {
    const bannerSizes = useBannerStore((state) => state.bannerSizes);
    const elements = useBannerStore((state) => state.elements);
    const overrides = useBannerStore((state) => state.overrides);
    const selectElement = useBannerStore((state) => state.selectElement);

    const [selectedBanners, setSelectedBanners] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);
    const [exportType, setExportType] = useState<'png' | 'html5' | 'amp' | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(true);

    const toggleBannerSelection = (bannerId: string) => {
        const newSelection = new Set(selectedBanners);
        if (newSelection.has(bannerId)) {
            newSelection.delete(bannerId);
        } else {
            newSelection.add(bannerId);
        }
        setSelectedBanners(newSelection);
    };

    const selectAll = () => {
        setSelectedBanners(new Set(bannerSizes.map(b => b.id)));
    };

    const deselectAll = () => {
        setSelectedBanners(new Set());
    };

    const downloadBlob = (blob: Blob, filename: string) => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = URL.createObjectURL(blob);
        link.style.display = 'none';

        document.body.appendChild(link);

        // Use setTimeout to ensure the link is in the DOM
        setTimeout(() => {
            link.click();

            // Cleanup after a delay
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            }, 100);
        }, 0);
    };

    const generateBannerBlob = async (banner: BannerSize) => {
        // Create an off-screen container
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-10000px';
        container.style.top = '-10000px';
        container.style.width = `${banner.width}px`;
        container.style.height = `${banner.height}px`;
        container.style.backgroundColor = '#ffffff';
        document.body.appendChild(container);

        try {
            const root = createRoot(container);

            // Render at full scale (1:1)
            root.render(
                <BannerRenderer
                    bannerId={banner.id}
                    width={banner.width}
                    height={banner.height}
                    elements={elements}
                    overrides={overrides[banner.id]}
                    isMaster={banner.isMaster}
                    category={banner.category}
                    customScale={1}
                    isExport={true}
                />
            );

            // Wait for React to mount, images to load, and fonts to be ready
            // Increase timeout for reliability
            await new Promise(resolve => setTimeout(resolve, 1000));
            if ('fonts' in document) {
                await (document as Document & { fonts: FontFaceSet }).fonts.ready;
            }

            const canvas = await html2canvas(container, {
                backgroundColor: '#ffffff',
                scale: 1,
                useCORS: true,
                logging: false,
                allowTaint: true,
                width: banner.width,
                height: banner.height,
            });

            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                }, 'image/png');
            });

            // Cleanup
            root.unmount();
            document.body.removeChild(container);

            const filename = `${banner.name.replace(/\s+/g, '_')}_${banner.width}x${banner.height}.png`;
            return { blob, filename };
        } catch (error) {
            console.error(`Failed to generate blob for ${banner.name}:`, error);
            if (document.body.contains(container)) {
                document.body.removeChild(container);
            }
            return null;
        }
    };

    const exportBanners = async (type: 'png' | 'html5' | 'amp') => {
        setIsExporting(true);
        setExportType(type);
        selectElement(null);

        // Wait for selection to clear
        await new Promise(resolve => setTimeout(resolve, 100));

        const bannersToExport = selectedBanners.size > 0
            ? bannerSizes.filter(b => selectedBanners.has(b.id))
            : bannerSizes;

        try {
            if (type === 'png') {
                if (bannersToExport.length === 1) {
                    const result = await generateBannerBlob(bannersToExport[0]);
                    if (result) {
                        downloadBlob(result.blob, result.filename);
                    } else {
                        alert('Failed to export banner.');
                    }
                } else {
                    const zip = new JSZip();
                    for (const banner of bannersToExport) {
                        const result = await generateBannerBlob(banner);
                        if (result) {
                            zip.file(result.filename, result.blob);
                        }
                    }
                    if (Object.keys(zip.files).length > 0) {
                        const content = await zip.generateAsync({ type: 'blob' });
                        downloadBlob(content, 'banners_images.zip');
                    } else {
                        alert('No banners were successfully exported.');
                    }
                }
            } else if (type === 'html5' || type === 'amp') {
                const generateZip = async (banner: BannerSize) => {
                    // 1. Generate Image Blob
                    const imageResult = await generateBannerBlob(banner);
                    if (!imageResult || imageResult.blob.size === 0) {
                        console.error('Failed to generate image blob or blob is empty');
                        return null;
                    }

                    // 2. Generate HTML
                    const html = type === 'html5'
                        ? generateHTML5(banner)
                        : generateAMP(banner);

                    // 3. Create ZIP
                    const zip = new JSZip();
                    zip.file("index.html", html);
                    zip.file("bg.png", imageResult.blob);

                    const content = await zip.generateAsync({ type: 'blob' });

                    // 4. Check Size (150KB limit)
                    if (content.size > 150 * 1024) {
                        console.warn(`Warning: Zip for ${banner.name} is ${Math.round(content.size / 1024)}KB, exceeding the 150KB limit.`);
                    }

                    return {
                        blob: content,
                        filename: `${banner.name.replace(/\s+/g, '_')}_${banner.width}x${banner.height}_${type}.zip`
                    };
                };

                if (bannersToExport.length === 1) {
                    const result = await generateZip(bannersToExport[0]);
                    if (result) {
                        downloadBlob(result.blob, result.filename);
                    } else {
                        alert('Failed to export banner.');
                    }
                } else {
                    const masterZip = new JSZip();
                    let count = 0;

                    for (const banner of bannersToExport) {
                        const result = await generateZip(banner);
                        if (result) {
                            masterZip.file(result.filename, result.blob);
                            count++;
                        }
                    }

                    if (count > 0) {
                        const content = await masterZip.generateAsync({ type: 'blob' });
                        downloadBlob(content, `banners_${type}_batch.zip`);
                    } else {
                        alert('No banners were successfully exported.');
                    }
                }
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export banners.');
        } finally {
            setIsExporting(false);
            setExportType(null);
        }
    };

    return (
        <div className="bg-white border-t border-gray-200 shadow-lg transition-all duration-300">
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        Export Banners
                        <span className={`transform transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                            ▼
                        </span>
                    </h3>
                    {!isCollapsed && <p className="text-sm text-gray-500 mt-1">Select sizes to export</p>}
                </div>
                {!isCollapsed && (
                    <div className="flex gap-3" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={selectAll}
                            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-md transition-colors"
                        >
                            Select All
                        </button>
                        <button
                            onClick={deselectAll}
                            className="text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors"
                        >
                            Deselect All
                        </button>
                    </div>
                )}
            </div>

            {!isCollapsed && (
                <div className="p-6 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {bannerSizes.map((banner) => (
                            <label
                                key={banner.id}
                                className={`
                                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200
                                    ${selectedBanners.has(banner.id)
                                        ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                                        : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                                    }
                                `}
                            >
                                <div className={`
                                    w-5 h-5 rounded border flex items-center justify-center transition-colors
                                    ${selectedBanners.has(banner.id)
                                        ? 'bg-emerald-600 border-emerald-600'
                                        : 'bg-white border-gray-300'
                                    }
                                `}>
                                    {selectedBanners.has(banner.id) && (
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={selectedBanners.has(banner.id)}
                                    onChange={() => toggleBannerSelection(banner.id)}
                                    className="hidden"
                                />
                                <div className="flex flex-col min-w-0">
                                    <span className={`text-sm font-medium truncate ${selectedBanners.has(banner.id) ? 'text-emerald-900' : 'text-gray-700'}`}>
                                        {banner.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {banner.width} × {banner.height}
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => exportBanners('png')}
                            disabled={isExporting}
                            className={`
                                flex-1 py-3 px-4 rounded-xl font-semibold text-white shadow-md transition-all duration-200
                                flex items-center justify-center gap-2
                                ${isExporting && exportType === 'png'
                                    ? 'bg-emerald-400 cursor-wait'
                                    : isExporting
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-lg transform hover:-translate-y-0.5'
                                }
                            `}
                        >
                            {isExporting && exportType === 'png' ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Exporting...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={18} />
                                    <span>Download Images</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => exportBanners('html5')}
                            disabled={isExporting}
                            className={`
                                flex-1 py-3 px-4 rounded-xl font-semibold text-white shadow-md transition-all duration-200
                                flex items-center justify-center gap-2
                                ${isExporting && exportType === 'html5'
                                    ? 'bg-teal-400 cursor-wait'
                                    : isExporting
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 hover:shadow-lg transform hover:-translate-y-0.5'
                                }
                            `}
                        >
                            {isExporting && exportType === 'html5' ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Exporting...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={18} />
                                    <span>Download HTML5</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => exportBanners('amp')}
                            disabled={isExporting}
                            className={`
                                flex-1 py-3 px-4 rounded-xl font-semibold text-white shadow-md transition-all duration-200
                                flex items-center justify-center gap-2
                                ${isExporting && exportType === 'amp'
                                    ? 'bg-amber-400 cursor-wait'
                                    : isExporting
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 hover:shadow-lg transform hover:-translate-y-0.5'
                                }
                            `}
                        >
                            {isExporting && exportType === 'amp' ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Exporting...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={18} />
                                    <span>Download AMP</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
