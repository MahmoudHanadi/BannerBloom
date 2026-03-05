import React from 'react';
import type { BackgroundConfig } from '../store/bannerStore';
import { useBannerStore } from '../store/bannerStore';
import {
    AlignLeft, AlignCenter, AlignRight, Trash2,
    ArrowUp, ArrowDown, ChevronsUp, ChevronsDown,
    AlignStartVertical, AlignCenterVertical, AlignEndVertical,
    Bold, Italic, Underline, Strikethrough
} from 'lucide-react';

const fonts = [
    'Inter',
    'Roboto',
    'Poppins',
    'Montserrat',
    'Open Sans',
    'Lato',
    'Oswald',
    'Roboto Mono',
    'Raleway',
    'Playfair Display',
    'Ubuntu',
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Georgia'
];

export const PropertiesPanel: React.FC = () => {
    const selectedElementId = useBannerStore((state) => state.selectedElementId);
    const selectedBannerId = useBannerStore((state) => state.selectedBannerId);
    const elements = useBannerStore((state) => state.elements);
    const overrides = useBannerStore((state) => state.overrides);
    const bannerSizes = useBannerStore((state) => state.bannerSizes);
    const updateElement = useBannerStore((state) => state.updateElement);
    const setOverride = useBannerStore((state) => state.setOverride);
    const removeElement = useBannerStore((state) => state.removeElement);
    const reorderElement = useBannerStore((state) => state.reorderElement);

    const selectedElement = elements.find((el) => el.id === selectedElementId);

    const background = useBannerStore((state) => state.background);
    const setBackground = useBannerStore((state) => state.setBackground);

    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    React.useEffect(() => {
        if (selectedElement && (selectedElement.type === 'text' || selectedElement.type === 'button')) {
            // Give a small delay to ensure the DOM is ready if it just appeared
            const timer = setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.select();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [selectedElement?.id, selectedElement]);

    if (!selectedElement) {
        return (
            <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto p-4 space-y-6 shadow-sm z-10">
                <h3 className="font-bold text-black text-lg border-b border-gray-200 pb-4">Banner Settings</h3>

                <div className="space-y-4">
                    <h4 className="font-bold text-sm text-black uppercase tracking-wide">Background</h4>

                    <div className="flex gap-2">
                        {['solid', 'gradient', 'image'].map(t => (
                            <button
                                key={t}
                                onClick={() => setBackground({ ...background, type: t as BackgroundConfig['type'] })}
                                className={`flex-1 py-2 text-xs font-bold uppercase rounded border ${background.type === t ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {background.type === 'solid' && (
                        <div>
                            <label className="block text-xs font-bold text-black mb-1.5">Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={background.value}
                                    onChange={(e) => setBackground({ ...background, value: e.target.value })}
                                    className="h-10 w-10 p-1 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={background.value}
                                    onChange={(e) => setBackground({ ...background, value: e.target.value })}
                                    className="flex-1 p-2 border border-gray-300 rounded text-sm uppercase text-black"
                                />
                            </div>
                        </div>
                    )}

                    {background.type === 'gradient' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-black mb-1.5">Start Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={background.gradientColors?.[0] || '#ffffff'}
                                        onChange={(e) => {
                                            const colors = background.gradientColors ? [...background.gradientColors] : ['#ffffff', '#000000'];
                                            colors[0] = e.target.value;
                                            setBackground({ ...background, gradientColors: colors });
                                        }}
                                        className="h-10 w-10 p-1 border border-gray-300 rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={background.gradientColors?.[0] || '#ffffff'}
                                        onChange={(e) => {
                                            const colors = background.gradientColors ? [...background.gradientColors] : ['#ffffff', '#000000'];
                                            colors[0] = e.target.value;
                                            setBackground({ ...background, gradientColors: colors });
                                        }}
                                        className="flex-1 p-2 border border-gray-300 rounded text-sm uppercase text-black"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-black mb-1.5">End Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={background.gradientColors?.[1] || '#000000'}
                                        onChange={(e) => {
                                            const colors = background.gradientColors ? [...background.gradientColors] : ['#ffffff', '#000000'];
                                            colors[1] = e.target.value;
                                            setBackground({ ...background, gradientColors: colors });
                                        }}
                                        className="h-10 w-10 p-1 border border-gray-300 rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={background.gradientColors?.[1] || '#000000'}
                                        onChange={(e) => {
                                            const colors = background.gradientColors ? [...background.gradientColors] : ['#ffffff', '#000000'];
                                            colors[1] = e.target.value;
                                            setBackground({ ...background, gradientColors: colors });
                                        }}
                                        className="flex-1 p-2 border border-gray-300 rounded text-sm uppercase text-black"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-black mb-1.5">Direction (deg)</label>
                                <input
                                    type="number"
                                    value={parseInt(background.gradientDirection || '90')}
                                    onChange={(e) => setBackground({ ...background, gradientDirection: `${e.target.value}deg` })}
                                    className="w-full p-2 border border-gray-300 rounded text-sm text-black"
                                />
                            </div>
                        </div>
                    )}

                    {background.type === 'image' && (
                        <div>
                            <label className="block text-xs font-bold text-black mb-1.5">Image Upload</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer relative transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (ev) => {
                                                setBackground({ ...background, value: ev.target?.result as string });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <div className="mb-2">Click to upload</div>
                                <span className="text-xs">Supports JPG, PNG, WEBP</span>
                            </div>
                            {background.value && (
                                <div className="mt-2 h-24 w-full bg-gray-100 rounded overflow-hidden border border-gray-200 relative">
                                    <img src={background.value} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Calculate effective properties based on selection context
    const override = selectedBannerId ? overrides[selectedBannerId]?.[selectedElement.id] : undefined;
    const effectiveElement = {
        ...selectedElement,
        ...override,
        style: { ...selectedElement.style, ...override?.style }
    };

    const isMaster = selectedBannerId ? bannerSizes.find(b => b.id === selectedBannerId)?.isMaster : true;

    const handleChange = (field: string, value: string | number | boolean) => {
        // Special case for properties that should always be global
        if (field === 'aspectRatioLocked') {
            updateElement(selectedElement.id, { aspectRatioLocked: value as boolean });
            return;
        }

        if (selectedBannerId) {
            setOverride(selectedBannerId, selectedElement.id, { [field]: value });
        } else {
            updateElement(selectedElement.id, { [field]: value } as Partial<typeof selectedElement>);
        }
    };

    const handleStyleChange = (field: string, value: string | number | boolean) => {
        if (selectedBannerId) {
            setOverride(selectedBannerId, selectedElement.id, { style: { [field]: value } });
        } else {
            updateElement(selectedElement.id, {
                style: { ...selectedElement.style, [field]: value }
            });
        }
    };

    return (
        <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto p-4 space-y-6 shadow-sm z-10">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <h3 className="font-bold text-black text-lg">Properties</h3>
                <div className="flex items-center gap-2">
                    {!isMaster && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-medium">
                            Override Mode
                        </span>
                    )}
                    <button
                        onClick={() => removeElement(selectedElement.id)}
                        className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50 transition-colors"
                        title="Delete Element"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Common Properties */}
            <div className="space-y-5">
                {/* Alignment */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-black uppercase tracking-wide">Alignment</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => handleChange('x', 0)}
                            className="bg-gray-100 hover:bg-gray-200 p-2 rounded flex justify-center border border-gray-300 text-gray-800"
                            title="Align Left"
                        >
                            <AlignLeft size={18} />
                        </button>
                        <button
                            onClick={() => handleChange('x', 50 - effectiveElement.width / 2)}
                            className="bg-gray-100 hover:bg-gray-200 p-2 rounded flex justify-center border border-gray-300 text-gray-800"
                            title="Align Center"
                        >
                            <AlignCenter size={18} />
                        </button>
                        <button
                            onClick={() => handleChange('x', 100 - effectiveElement.width)}
                            className="bg-gray-100 hover:bg-gray-200 p-2 rounded flex justify-center border border-gray-300 text-gray-800"
                            title="Align Right"
                        >
                            <AlignRight size={18} />
                        </button>
                        <button
                            onClick={() => handleChange('y', 0)}
                            className="bg-gray-100 hover:bg-gray-200 p-2 rounded flex justify-center border border-gray-300 text-gray-800"
                            title="Align Top"
                        >
                            <ArrowUp size={18} className="rotate-0" />
                        </button>
                        <button
                            onClick={() => handleChange('y', 50 - effectiveElement.height / 2)}
                            className="bg-gray-100 hover:bg-gray-200 p-2 rounded flex justify-center border border-gray-300 text-gray-800"
                            title="Align Middle"
                        >
                            <div className="flex flex-col items-center gap-0.5">
                                <div className="w-4 h-0.5 bg-current"></div>
                                <div className="w-4 h-0.5 bg-current"></div>
                            </div>
                        </button>
                        <button
                            onClick={() => handleChange('y', 100 - effectiveElement.height)}
                            className="bg-gray-100 hover:bg-gray-200 p-2 rounded flex justify-center border border-gray-300 text-gray-800"
                            title="Align Bottom"
                        >
                            <ArrowDown size={18} />
                        </button>
                    </div>
                </div>

                {/* Layering */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-black uppercase tracking-wide">Layer Order</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => reorderElement(selectedElement.id, 'top')}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 p-2 rounded flex justify-center border border-gray-300 text-gray-800"
                            title="Bring to Front"
                        >
                            <ChevronsUp size={18} />
                        </button>
                        <button
                            onClick={() => reorderElement(selectedElement.id, 'up')}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 p-2 rounded flex justify-center border border-gray-300 text-gray-800"
                            title="Bring Forward"
                        >
                            <ArrowUp size={18} />
                        </button>
                        <button
                            onClick={() => reorderElement(selectedElement.id, 'down')}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 p-2 rounded flex justify-center border border-gray-300 text-gray-800"
                            title="Send Backward"
                        >
                            <ArrowDown size={18} />
                        </button>
                        <button
                            onClick={() => reorderElement(selectedElement.id, 'bottom')}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 p-2 rounded flex justify-center border border-gray-300 text-gray-800"
                            title="Send to Back"
                        >
                            <ChevronsDown size={18} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-black mb-1.5">X Position (%)</label>
                        <input
                            type="number"
                            value={Math.round(effectiveElement.x)}
                            onChange={(e) => handleChange('x', Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded text-sm text-black focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-black mb-1.5">Y Position (%)</label>
                        <input
                            type="number"
                            value={Math.round(effectiveElement.y)}
                            onChange={(e) => handleChange('y', Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded text-sm text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-black mb-1.5">Width (%)</label>
                        <input
                            type="number"
                            value={Math.round(effectiveElement.width)}
                            onChange={(e) => handleChange('width', Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded text-sm text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-black mb-1.5">Height (%)</label>
                        <input
                            type="number"
                            value={Math.round(effectiveElement.height)}
                            onChange={(e) => handleChange('height', Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded text-sm text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Rotation */}
                <div>
                    <label className="block text-xs font-bold text-black mb-1.5">Rotation ({Math.round(effectiveElement.rotation || 0)}°)</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="0"
                            max="360"
                            value={effectiveElement.rotation || 0}
                            onChange={(e) => handleChange('rotation', Number(e.target.value))}
                            className="flex-1 accent-blue-600"
                        />
                        <input
                            type="number"
                            value={Math.round(effectiveElement.rotation || 0)}
                            onChange={(e) => handleChange('rotation', Number(e.target.value))}
                            className="w-16 p-2 border border-gray-300 rounded text-sm text-center text-black"
                        />
                    </div>
                </div>

                {/* Aspect Ratio Lock */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="aspectRatioLock"
                        checked={effectiveElement.aspectRatioLocked}
                        onChange={(e) => handleChange('aspectRatioLocked', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="aspectRatioLock" className="text-sm font-medium text-black cursor-pointer">Lock Aspect Ratio</label>
                </div>
            </div>

            {/* Type Specific Properties */}
            {(selectedElement.type === 'text' || selectedElement.type === 'button') && (
                <div className="space-y-5 border-t border-gray-200 pt-5">
                    <h4 className="font-bold text-sm text-black uppercase tracking-wide">Text Properties</h4>

                    <div>
                        <label className="block text-xs font-bold text-black mb-1.5">Content</label>
                        <textarea
                            ref={textareaRef}
                            autoFocus
                            value={effectiveElement.content}
                            onChange={(e) => handleChange('content', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm text-black focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-black mb-1.5">Font Family</label>
                        <select
                            value={effectiveElement.style?.fontFamily || 'Inter'}
                            onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm text-black bg-white"
                        >
                            {fonts.map(font => (
                                <option key={font} value={font}>{font}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-black mb-1.5">Font Size (px)</label>
                            <input
                                type="number"
                                value={(() => {
                                    const baseSize = parseInt(effectiveElement.style?.fontSize as string || '32');
                                    const banner = bannerSizes.find(b => b.id === selectedBannerId);
                                    if (!banner) return baseSize;
                                    return Math.round((baseSize / 1080) * banner.height);
                                })()}
                                onChange={(e) => {
                                    const newSize = Number(e.target.value);
                                    const banner = bannerSizes.find(b => b.id === selectedBannerId);
                                    const height = banner ? banner.height : 1080;
                                    const newBaseSize = Math.round((newSize / height) * 1080);
                                    handleStyleChange('fontSize', `${newBaseSize}px`);
                                }}
                                className="w-full p-2 border border-gray-300 rounded text-sm text-black"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-black mb-1.5">Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={effectiveElement.style?.color || '#000000'}
                                    onChange={(e) => handleStyleChange('color', e.target.value)}
                                    className="h-10 w-10 p-1 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={effectiveElement.style?.color || '#000000'}
                                    onChange={(e) => handleStyleChange('color', e.target.value)}
                                    className="flex-1 p-2 border border-gray-300 rounded text-sm uppercase text-black"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h5 className="text-xs font-bold text-gray-500 uppercase">Text Alignment</h5>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Horizontal</label>
                                    <div className="flex border border-gray-300 rounded overflow-hidden bg-white">
                                        <button
                                            onClick={() => handleStyleChange('textAlign', 'left')}
                                            className={`flex-1 p-2 flex justify-center ${effectiveElement.style?.textAlign === 'left' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-gray-100 text-gray-700'}`}
                                            title="Align Left"
                                        >
                                            <AlignLeft size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleStyleChange('textAlign', 'center')}
                                            className={`flex-1 p-2 flex justify-center ${effectiveElement.style?.textAlign === 'center' || !effectiveElement.style?.textAlign ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-gray-100 text-gray-700'}`}
                                            title="Align Center"
                                        >
                                            <AlignCenter size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleStyleChange('textAlign', 'right')}
                                            className={`flex-1 p-2 flex justify-center ${effectiveElement.style?.textAlign === 'right' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-gray-100 text-gray-700'}`}
                                            title="Align Right"
                                        >
                                            <AlignRight size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="w-24">
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Direction</label>
                                    <div className="flex border border-gray-300 rounded overflow-hidden bg-white">
                                        <button
                                            onClick={() => handleStyleChange('direction', 'ltr')}
                                            className={`flex-1 p-2 flex justify-center text-xs font-bold ${effectiveElement.style?.direction === 'ltr' || !effectiveElement.style?.direction ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-gray-100 text-gray-700'}`}
                                            title="Left-to-Right"
                                        >
                                            LTR
                                        </button>
                                        <button
                                            onClick={() => handleStyleChange('direction', 'rtl')}
                                            className={`flex-1 p-2 flex justify-center text-xs font-bold ${effectiveElement.style?.direction === 'rtl' ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-gray-100 text-gray-700'}`}
                                            title="Right-to-Left"
                                        >
                                            RTL
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Styling</label>
                                <div className="flex border border-gray-300 rounded overflow-hidden bg-white">
                                    <button
                                        onClick={() => handleStyleChange('fontWeight', effectiveElement.style?.fontWeight === 'bold' ? 'normal' : 'bold')}
                                        className={`flex-1 p-2 flex justify-center ${effectiveElement.style?.fontWeight === 'bold' ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-gray-100 text-gray-700'}`}
                                        title="Bold"
                                    >
                                        <Bold size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleStyleChange('fontStyle', effectiveElement.style?.fontStyle === 'italic' ? 'normal' : 'italic')}
                                        className={`flex-1 p-2 flex justify-center ${effectiveElement.style?.fontStyle === 'italic' ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-gray-100 text-gray-700'}`}
                                        title="Italic"
                                    >
                                        <Italic size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleStyleChange('textDecoration', effectiveElement.style?.textDecoration === 'underline' ? 'none' : 'underline')}
                                        className={`flex-1 p-2 flex justify-center ${effectiveElement.style?.textDecoration === 'underline' ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-gray-100 text-gray-700'}`}
                                        title="Underline"
                                    >
                                        <Underline size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleStyleChange('textDecoration', effectiveElement.style?.textDecoration === 'line-through' ? 'none' : 'line-through')}
                                        className={`flex-1 p-2 flex justify-center ${effectiveElement.style?.textDecoration === 'line-through' ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-gray-100 text-gray-700'}`}
                                        title="Strikethrough"
                                    >
                                        <Strikethrough size={18} />
                                    </button>
                                </div>
                            </div>

                            {selectedElement.type === 'button' && (
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Vertical</label>
                                    <div className="flex border border-gray-300 rounded overflow-hidden bg-white">
                                        <button
                                            onClick={() => handleStyleChange('verticalAlign', 'top')}
                                            className={`flex-1 p-2 flex justify-center ${effectiveElement.style?.verticalAlign === 'top' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 text-gray-700'}`}
                                            title="Align Top"
                                        >
                                            <AlignStartVertical size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleStyleChange('verticalAlign', 'middle')}
                                            className={`flex-1 p-2 flex justify-center ${effectiveElement.style?.verticalAlign === 'middle' || !effectiveElement.style?.verticalAlign ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 text-gray-700'}`}
                                            title="Align Middle"
                                        >
                                            <AlignCenterVertical size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleStyleChange('verticalAlign', 'bottom')}
                                            className={`flex-1 p-2 flex justify-center ${effectiveElement.style?.verticalAlign === 'bottom' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 text-gray-700'}`}
                                            title="Align Bottom"
                                        >
                                            <AlignEndVertical size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {(selectedElement.type === 'shape' || selectedElement.type === 'button') && (
                <div className="space-y-5 border-t border-gray-200 pt-5">
                    <h4 className="font-bold text-sm text-black uppercase tracking-wide">Shape Properties</h4>
                    <div>
                        <label className="block text-xs font-bold text-black mb-1.5">Background Color</label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={selectedElement.type === 'button' ? (effectiveElement.style?.backgroundColor as string || '#3b82f6') : effectiveElement.content}
                                onChange={(e) => selectedElement.type === 'button' ? handleStyleChange('backgroundColor', e.target.value) : handleChange('content', e.target.value)}
                                className="h-10 w-10 p-1 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={selectedElement.type === 'button' ? (effectiveElement.style?.backgroundColor as string || '#3b82f6') : effectiveElement.content}
                                onChange={(e) => selectedElement.type === 'button' ? handleStyleChange('backgroundColor', e.target.value) : handleChange('content', e.target.value)}
                                className="flex-1 p-2 border border-gray-300 rounded text-sm uppercase text-black"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
