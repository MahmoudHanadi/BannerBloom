import React from 'react';
import type { BackgroundConfig } from '../store/bannerStore';
import { useBannerStore } from '../store/bannerStore';
import { getCategoryMasterSize } from '../config/bannerPresets';
import { calculateElementLayout } from '../utils/layoutUtils';
import {
  ChevronDown,
  ChevronRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  PanelRightClose,
  PanelRightOpen,
  Upload,
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
  'Georgia',
];

const slotSuggestions = [
  { key: 'headline', label: 'Headline' },
  { key: 'hero', label: 'Hero Image' },
  { key: 'logo', label: 'Logo' },
  { key: 'cta', label: 'CTA' },
];

const toSlotKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

interface PropertiesPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const InspectorSection: React.FC<{
  title: string;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ title, defaultOpen = true, className = '', children }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-0.5 py-0.5 text-left"
      >
        <span className="text-xs font-bold uppercase tracking-wide text-slate-700">{title}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {isOpen && <div className="mt-2.5">{children}</div>}
    </div>
  );
};

const AlignMiddlePlacementIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 3.25h10" opacity="0.55" />
    <path d="M3 12.75h10" opacity="0.55" />
    <path d="M2.5 8h11" />
    <rect x="5.25" y="5" width="5.5" height="6" rx="1.25" fill="currentColor" stroke="none" />
  </svg>
);

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const selectedElementId = useBannerStore((state) => state.selectedElementId);
  const selectedBannerId = useBannerStore((state) => state.selectedBannerId);
  const elements = useBannerStore((state) => state.elements);
  const overrides = useBannerStore((state) => state.overrides);
  const bannerSizes = useBannerStore((state) => state.bannerSizes);
  const updateElement = useBannerStore((state) => state.updateElement);
  const setOverride = useBannerStore((state) => state.setOverride);
  const removeElement = useBannerStore((state) => state.removeElement);
  const reorderElement = useBannerStore((state) => state.reorderElement);
  const replaceImageElementFromBlob = useBannerStore((state) => state.replaceImageElementFromBlob);

  const selectedElement = elements.find((element) => element.id === selectedElementId) ?? null;

  const background = useBannerStore((state) => state.background);
  const setBackground = useBannerStore((state) => state.setBackground);
  const setBackgroundImageFromBlob = useBannerStore((state) => state.setBackgroundImageFromBlob);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const imageReplaceInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (selectedElement?.type !== 'text' && selectedElement?.type !== 'button') {
      return;
    }

    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedElement?.id, selectedElement?.type]);

  if (isCollapsed) {
    return (
      <div className="studio-properties-panel studio-properties-panel-collapsed z-10 flex h-full min-h-0 flex-col items-center justify-start gap-4 overflow-hidden rounded-[1.35rem] border px-2 py-3 shadow-sm">
        <button
          onClick={onToggleCollapse}
          className="studio-panel-toggle"
          title="Expand inspector"
        >
          <PanelRightOpen className="h-4 w-4" />
        </button>
        <div className="studio-collapsed-rail-label">Inspector</div>
      </div>
    );
  }

  const renderBackgroundEditor = () => (
    <div className="studio-properties-panel z-10 h-full space-y-4 overflow-y-auto rounded-[1.35rem] border p-3.5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div>
          <div className="studio-section-label">Canvas</div>
          <h3 className="text-lg font-bold text-slate-900">Canvas background</h3>
        </div>
        <button
          onClick={onToggleCollapse}
          className="studio-panel-toggle"
          title="Collapse inspector"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>

      <InspectorSection title="Background">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['solid', 'gradient', 'image'].map((type) => (
              <button
                key={type}
                onClick={() => setBackground({ ...background, type: type as BackgroundConfig['type'] })}
                className={`flex-1 rounded border py-2 text-xs font-bold uppercase ${
                  background.type === type
                    ? 'border-emerald-500 bg-emerald-100 text-emerald-700'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {background.type === 'solid' && (
            <div>
              <label className="mb-1.5 block text-xs font-bold text-black">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={background.value}
                  onChange={(event) => setBackground({ ...background, value: event.target.value })}
                  className="h-10 w-10 cursor-pointer rounded border border-gray-300 p-1"
                />
                <input
                  type="text"
                  value={background.value}
                  onChange={(event) => setBackground({ ...background, value: event.target.value })}
                  className="flex-1 rounded border border-gray-300 p-2 text-sm uppercase text-black"
                />
              </div>
            </div>
          )}

          {background.type === 'gradient' && (
            <div className="space-y-3">
              {[0, 1].map((index) => (
                <div key={index}>
                  <label className="mb-1.5 block text-xs font-bold text-black">
                    {index === 0 ? 'Start color' : 'End color'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={background.gradientColors?.[index] || (index === 0 ? '#ffffff' : '#000000')}
                      onChange={(event) => {
                        const colors = background.gradientColors
                          ? [...background.gradientColors]
                          : ['#ffffff', '#000000'];
                        colors[index] = event.target.value;
                        setBackground({ ...background, gradientColors: colors });
                      }}
                      className="h-10 w-10 cursor-pointer rounded border border-gray-300 p-1"
                    />
                    <input
                      type="text"
                      value={background.gradientColors?.[index] || (index === 0 ? '#ffffff' : '#000000')}
                      onChange={(event) => {
                        const colors = background.gradientColors
                          ? [...background.gradientColors]
                          : ['#ffffff', '#000000'];
                        colors[index] = event.target.value;
                        setBackground({ ...background, gradientColors: colors });
                      }}
                      className="flex-1 rounded border border-gray-300 p-2 text-sm uppercase text-black"
                    />
                  </div>
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-black">Direction (deg)</label>
                <input
                  type="number"
                  value={parseInt(background.gradientDirection || '90', 10)}
                  onChange={(event) =>
                    setBackground({ ...background, gradientDirection: `${event.target.value}deg` })
                  }
                  className="w-full rounded border border-gray-300 p-2 text-sm text-black"
                />
              </div>
            </div>
          )}

          {background.type === 'image' && (
            <div>
              <label className="mb-1.5 block text-xs font-bold text-black">Image upload</label>
              <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-gray-500 transition-colors hover:bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void setBackgroundImageFromBlob(file, file.name);
                    }
                    event.target.value = '';
                  }}
                />
                <Upload className="mb-2 h-5 w-5" />
                <div className="mb-1">Click to upload</div>
                <span className="text-xs">Supports JPG, PNG, WEBP</span>
              </label>
              {background.value && (
                <div className="relative mt-2 h-24 overflow-hidden rounded border border-gray-200 bg-gray-100">
                  <img
                    src={background.value}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </InspectorSection>
    </div>
  );

  if (!selectedElement) {
    return renderBackgroundEditor();
  }

  const selectedOverride = selectedBannerId ? overrides[selectedBannerId]?.[selectedElement.id] : undefined;
  const effectiveElement = {
    ...selectedElement,
    ...selectedOverride,
    style: { ...selectedElement.style, ...selectedOverride?.style },
  };

  const selectedBanner = selectedBannerId
    ? bannerSizes.find((banner) => banner.id === selectedBannerId)
    : undefined;
  const isMaster = selectedBanner ? selectedBanner.isMaster : true;
  const hasPlacementOverride = Boolean(
    selectedOverride &&
      Object.keys(selectedOverride).length > 0 &&
      !selectedOverride.isAutoPropagated,
  );

  const handleChange = (field: string, value: string | number | boolean) => {
    if (field === 'aspectRatioLocked') {
      updateElement(selectedElement.id, { aspectRatioLocked: value as boolean });
      return;
    }

    if (field === 'content' || field === 'slotLabel' || field === 'slotKey') {
      updateElement(selectedElement.id, { [field]: value } as Partial<typeof selectedElement>);
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
        style: { ...selectedElement.style, [field]: value },
      });
    }
  };

  const alignElementToBanner = (axis: 'x' | 'y', mode: 'start' | 'center' | 'end') => {
    const fallbackValue =
      axis === 'x'
        ? mode === 'start'
          ? 0
          : mode === 'center'
            ? 50 - effectiveElement.width / 2
            : 100 - effectiveElement.width
        : mode === 'start'
          ? 0
          : mode === 'center'
            ? 50 - effectiveElement.height / 2
            : 100 - effectiveElement.height;

    if (!selectedBannerId || !selectedBanner) {
      handleChange(axis, fallbackValue);
      return;
    }

    const masterHeight =
      getCategoryMasterSize(bannerSizes, selectedBanner.category)?.height ?? selectedBanner.height;
    const layout = calculateElementLayout(
      selectedElement,
      overrides[selectedBannerId],
      selectedBanner.width,
      selectedBanner.height,
      selectedBanner.category,
      1,
      masterHeight,
    );

    const bannerSize = axis === 'x' ? selectedBanner.width : selectedBanner.height;
    const storedSizePercent = axis === 'x' ? layout.w : layout.h;
    const basePixelSize = (storedSizePercent / 100) * bannerSize;
    const renderedPixelSize = axis === 'x' ? layout.pixelW : layout.pixelH;
    const delta = basePixelSize - renderedPixelSize;
    const desiredPixelPosition =
      mode === 'start'
        ? 0
        : mode === 'center'
          ? (bannerSize - renderedPixelSize) / 2
          : bannerSize - renderedPixelSize;

    const denominator = bannerSize + delta;
    const computedValue =
      Math.abs(denominator) < 0.0001
        ? fallbackValue
        : (100 * desiredPixelPosition - (storedSizePercent * delta) / 2) / denominator;

    handleChange(
      axis,
      Number.isFinite(computedValue) ? Math.round(computedValue * 1000) / 1000 : fallbackValue,
    );
  };

  const handleReplaceImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || selectedElement.type !== 'image') {
      event.target.value = '';
      return;
    }

    void replaceImageElementFromBlob(selectedElement.id, file, file.name);
    event.target.value = '';
  };

  return (
    <div className="studio-properties-panel z-10 h-full space-y-4 overflow-y-auto rounded-[1.35rem] border p-3.5 shadow-sm">
      <input
        ref={imageReplaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleReplaceImage}
      />

      <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-3.5">
        <div>
          <div className="studio-section-label">Inspector</div>
          <h3 className="text-lg font-bold text-slate-900">
            {selectedElement.slotLabel || 'Element inspector'}
          </h3>
          {selectedBanner && (
            <p className="mt-1 text-sm text-slate-500">
              {selectedBanner.name} / {selectedBanner.width} x {selectedBanner.height}
            </p>
          )}
        </div>
        <div className="studio-inspector-header-actions flex flex-wrap items-center justify-end">
          {isMaster ? (
            <span className="studio-pill studio-pill-success px-2.5 py-1 text-[0.68rem]">
              Source size
            </span>
          ) : hasPlacementOverride ? (
            <span className="studio-pill studio-pill-warning px-2.5 py-1 text-[0.68rem]">
              Individual tweak
            </span>
          ) : (
            <span className="studio-pill px-2.5 py-1 text-[0.68rem] text-slate-500">
              Inherited size
            </span>
          )}
          <button
            onClick={() => removeElement(selectedElement.id)}
            className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
            title="Delete Element"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={onToggleCollapse}
            className="studio-panel-toggle"
            title="Collapse inspector"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      <InspectorSection title="Placement">
        <div className="studio-inspector-stack">
          <div className="studio-inspector-field">
            <label className="studio-inspector-field-label">Alignment</label>
            <div className="studio-inspector-alignment-grid studio-inspector-icon-grid">
              <button
                onClick={() => alignElementToBanner('x', 'start')}
                className="studio-inspector-action-button"
                title="Align Left"
              >
                <AlignLeft size={16} />
              </button>
              <button
                onClick={() => alignElementToBanner('x', 'center')}
                className="studio-inspector-action-button"
                title="Align Center"
              >
                <AlignCenter size={16} />
              </button>
              <button
                onClick={() => alignElementToBanner('x', 'end')}
                className="studio-inspector-action-button"
                title="Align Right"
              >
                <AlignRight size={16} />
              </button>
              <button
                onClick={() => alignElementToBanner('y', 'start')}
                className="studio-inspector-action-button"
                title="Align Top"
              >
                <ArrowUp size={16} />
              </button>
              <button
                onClick={() => alignElementToBanner('y', 'center')}
                className="studio-inspector-action-button"
                title="Align Middle"
              >
                <AlignMiddlePlacementIcon />
              </button>
              <button
                onClick={() => alignElementToBanner('y', 'end')}
                className="studio-inspector-action-button"
                title="Align Bottom"
              >
                <ArrowDown size={16} />
              </button>
            </div>
          </div>

          <div className="studio-inspector-layer-order">
            <button
              onClick={() => reorderElement(selectedElement.id, 'up')}
              className="studio-inspector-action-button"
              title="Move Up"
            >
              <ArrowUp size={16} />
            </button>
            <button
              onClick={() => reorderElement(selectedElement.id, 'down')}
              className="studio-inspector-action-button"
              title="Move Down"
            >
              <ArrowDown size={16} />
            </button>
            <button
              onClick={() => reorderElement(selectedElement.id, 'top')}
              className="studio-inspector-action-button"
              title="Bring to Front"
            >
              <ChevronsUp size={16} />
            </button>
            <button
              onClick={() => reorderElement(selectedElement.id, 'bottom')}
              className="studio-inspector-action-button"
              title="Send to Back"
            >
              <ChevronsDown size={16} />
            </button>
          </div>

          <div className="studio-inspector-metrics-grid">
            <div className="studio-inspector-field">
              <label className="studio-inspector-field-label">X Position (%)</label>
              <input
                type="number"
                value={Math.round(effectiveElement.x)}
                onChange={(event) => handleChange('x', Number(event.target.value))}
                className="studio-input px-3 py-2 text-sm"
              />
            </div>
            <div className="studio-inspector-field">
              <label className="studio-inspector-field-label">Y Position (%)</label>
              <input
                type="number"
                value={Math.round(effectiveElement.y)}
                onChange={(event) => handleChange('y', Number(event.target.value))}
                className="studio-input px-3 py-2 text-sm"
              />
            </div>
            <div className="studio-inspector-field">
              <label className="studio-inspector-field-label">Width (%)</label>
              <input
                type="number"
                value={Math.round(effectiveElement.width)}
                onChange={(event) => handleChange('width', Number(event.target.value))}
                className="studio-input px-3 py-2 text-sm"
              />
            </div>
            <div className="studio-inspector-field">
              <label className="studio-inspector-field-label">Height (%)</label>
              <input
                type="number"
                value={Math.round(effectiveElement.height)}
                onChange={(event) => handleChange('height', Number(event.target.value))}
                className="studio-input px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="studio-inspector-field">
            <label className="studio-inspector-field-label">
              Rotation ({Math.round(effectiveElement.rotation || 0)} deg)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="360"
                value={effectiveElement.rotation || 0}
                onChange={(event) => handleChange('rotation', Number(event.target.value))}
                className="flex-1 accent-emerald-600"
              />
              <input
                type="number"
                value={Math.round(effectiveElement.rotation || 0)}
                onChange={(event) => handleChange('rotation', Number(event.target.value))}
                className="studio-input w-14 px-2.5 py-2 text-center text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="aspectRatioLock"
              checked={effectiveElement.aspectRatioLocked}
              onChange={(event) => handleChange('aspectRatioLocked', event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label
              htmlFor="aspectRatioLock"
              className="cursor-pointer text-sm font-medium text-slate-700"
            >
              Lock Aspect Ratio
            </label>
          </div>
        </div>
      </InspectorSection>

      <InspectorSection title="Template Slot" className="border-t border-gray-200 pt-4">
        <div className="space-y-3">
          <div className="studio-inspector-field">
            <label className="studio-inspector-field-label">Slot label</label>
            <input
              type="text"
              value={selectedElement.slotLabel || ''}
              onChange={(event) => {
                const nextLabel = event.target.value;
                updateElement(selectedElement.id, {
                  slotLabel: nextLabel,
                  slotKey: selectedElement.slotKey || toSlotKey(nextLabel),
                });
              }}
              placeholder="Logo, Hero, Headline..."
              className="studio-input px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {slotSuggestions.map((slot) => (
              <button
                key={slot.key}
                type="button"
                onClick={() =>
                  updateElement(selectedElement.id, {
                    slotKey: slot.key,
                    slotLabel: slot.label,
                  })
                }
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedElement.slotKey === slot.key
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>

          {selectedElement.type === 'image' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <div className="text-sm font-semibold text-slate-900">Replace image asset</div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Swapping the image here keeps the saved position and size in every banner.
              </p>
              <button
                type="button"
                onClick={() => imageReplaceInputRef.current?.click()}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                <Upload className="h-4 w-4" />
                Replace image
              </button>
            </div>
          )}
        </div>
      </InspectorSection>

      {(selectedElement.type === 'text' || selectedElement.type === 'button') && (
        <InspectorSection title="Copy Settings" className="border-t border-gray-200 pt-4">
          <div className="studio-inspector-stack">
            <div className="studio-inspector-field">
              <label className="studio-inspector-field-label">Content</label>
              <textarea
                ref={textareaRef}
                autoFocus
                value={effectiveElement.content}
                onChange={(event) => handleChange('content', event.target.value)}
                className="studio-textarea px-3 py-2 text-sm text-black outline-none"
                rows={2}
              />
              <p className="mt-1 text-xs text-slate-500">
                Text changes here update the whole campaign while each size keeps its layout.
              </p>
            </div>

            <div className="studio-inspector-field">
              <label className="studio-inspector-field-label">Font Family</label>
              <select
                value={(effectiveElement.style?.fontFamily as string) || 'Inter'}
                onChange={(event) => handleStyleChange('fontFamily', event.target.value)}
                className="studio-select bg-white px-3 py-2 text-sm text-black"
              >
                {fonts.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div className="studio-inspector-font-grid">
              <div className="studio-inspector-field">
                <label className="studio-inspector-field-label">Font Size (px)</label>
                <input
                  type="number"
                  value={(() => {
                    const baseSize = parseInt((effectiveElement.style?.fontSize as string) || '32', 10);
                    const banner = bannerSizes.find((bannerItem) => bannerItem.id === selectedBannerId);
                    if (!banner) return baseSize;
                    const masterHeight =
                      getCategoryMasterSize(bannerSizes, banner.category)?.height ?? banner.height;
                    return Math.round((baseSize / masterHeight) * banner.height);
                  })()}
                  onChange={(event) => {
                    const newSize = Number(event.target.value);
                    const banner = bannerSizes.find((bannerItem) => bannerItem.id === selectedBannerId);
                    const height = banner ? banner.height : 1200;
                    const masterHeight = banner
                      ? getCategoryMasterSize(bannerSizes, banner.category)?.height ?? banner.height
                      : 1200;
                    const newBaseSize = Math.round((newSize / height) * masterHeight);
                    handleStyleChange('fontSize', `${newBaseSize}px`);
                  }}
                  className="studio-input px-3 py-2 text-sm text-black"
                />
              </div>
              <div className="studio-inspector-field">
                <label className="studio-inspector-field-label">Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={(effectiveElement.style?.color as string) || '#000000'}
                    onChange={(event) => handleStyleChange('color', event.target.value)}
                    className="h-9 w-9 cursor-pointer rounded-lg border border-gray-300 p-1"
                  />
                  <input
                    type="text"
                    value={(effectiveElement.style?.color as string) || '#000000'}
                    onChange={(event) => handleStyleChange('color', event.target.value)}
                    className="studio-input flex-1 px-3 py-2 text-sm uppercase text-black"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">
                Text Alignment
              </h5>
              <div className="grid grid-cols-1 gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] font-bold uppercase text-gray-400">
                      Horizontal
                    </label>
                    <div className="studio-inspector-segmented">
                      <button
                        onClick={() => handleStyleChange('textAlign', 'left')}
                        className={`studio-inspector-segmented-button flex-1 justify-center ${
                          effectiveElement.style?.textAlign === 'left'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <AlignLeft size={16} />
                      </button>
                      <button
                        onClick={() => handleStyleChange('textAlign', 'center')}
                        className={`studio-inspector-segmented-button flex-1 justify-center ${
                          effectiveElement.style?.textAlign === 'center' ||
                          !effectiveElement.style?.textAlign
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <AlignCenter size={16} />
                      </button>
                      <button
                        onClick={() => handleStyleChange('textAlign', 'right')}
                        className={`studio-inspector-segmented-button flex-1 justify-center ${
                          effectiveElement.style?.textAlign === 'right'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <AlignRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-gray-400">
                    Styling
                  </label>
                  <div className="studio-inspector-segmented">
                    <button
                      onClick={() =>
                        handleStyleChange(
                          'fontWeight',
                          effectiveElement.style?.fontWeight === 'bold' ? 'normal' : 'bold',
                        )
                      }
                      className={`studio-inspector-segmented-button flex-1 justify-center ${
                        effectiveElement.style?.fontWeight === 'bold'
                          ? 'bg-teal-100 text-teal-800'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      onClick={() =>
                        handleStyleChange(
                          'fontStyle',
                          effectiveElement.style?.fontStyle === 'italic' ? 'normal' : 'italic',
                        )
                      }
                      className={`studio-inspector-segmented-button flex-1 justify-center ${
                        effectiveElement.style?.fontStyle === 'italic'
                          ? 'bg-teal-100 text-teal-800'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      onClick={() =>
                        handleStyleChange(
                          'textDecoration',
                          effectiveElement.style?.textDecoration === 'underline' ? 'none' : 'underline',
                        )
                      }
                      className={`studio-inspector-segmented-button flex-1 justify-center ${
                        effectiveElement.style?.textDecoration === 'underline'
                          ? 'bg-teal-100 text-teal-800'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Underline size={16} />
                    </button>
                    <button
                      onClick={() =>
                        handleStyleChange(
                          'textDecoration',
                          effectiveElement.style?.textDecoration === 'line-through'
                            ? 'none'
                            : 'line-through',
                        )
                      }
                      className={`studio-inspector-segmented-button flex-1 justify-center ${
                        effectiveElement.style?.textDecoration === 'line-through'
                          ? 'bg-teal-100 text-teal-800'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Strikethrough size={16} />
                    </button>
                  </div>
                </div>

                {selectedElement.type === 'button' && (
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-gray-400">
                      Vertical
                    </label>
                    <div className="studio-inspector-segmented">
                      <button
                        onClick={() => handleStyleChange('verticalAlign', 'top')}
                        className={`studio-inspector-segmented-button flex-1 justify-center ${
                          effectiveElement.style?.verticalAlign === 'top'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <AlignStartVertical size={16} />
                      </button>
                      <button
                        onClick={() => handleStyleChange('verticalAlign', 'middle')}
                        className={`studio-inspector-segmented-button flex-1 justify-center ${
                          effectiveElement.style?.verticalAlign === 'middle' ||
                          !effectiveElement.style?.verticalAlign
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <AlignCenterVertical size={16} />
                      </button>
                      <button
                        onClick={() => handleStyleChange('verticalAlign', 'bottom')}
                        className={`studio-inspector-segmented-button flex-1 justify-center ${
                          effectiveElement.style?.verticalAlign === 'bottom'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <AlignEndVertical size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </InspectorSection>
      )}

      {(selectedElement.type === 'shape' || selectedElement.type === 'button') && (
        <InspectorSection title="Shape Settings" className="border-t border-gray-200 pt-4">
          <div className="studio-inspector-field">
            <label className="studio-inspector-field-label">Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={
                  selectedElement.type === 'button'
                    ? ((effectiveElement.style?.backgroundColor as string) || '#19C37D')
                    : effectiveElement.content
                }
                onChange={(event) =>
                  selectedElement.type === 'button'
                    ? handleStyleChange('backgroundColor', event.target.value)
                    : handleChange('content', event.target.value)
                }
                className="h-9 w-9 cursor-pointer rounded-lg border border-gray-300 p-1"
              />
              <input
                type="text"
                value={
                  selectedElement.type === 'button'
                    ? ((effectiveElement.style?.backgroundColor as string) || '#19C37D')
                    : effectiveElement.content
                }
                onChange={(event) =>
                  selectedElement.type === 'button'
                    ? handleStyleChange('backgroundColor', event.target.value)
                    : handleChange('content', event.target.value)
                }
                className="studio-input flex-1 px-3 py-2 text-sm uppercase text-black"
              />
            </div>
          </div>
        </InspectorSection>
      )}
    </div>
  );
};
