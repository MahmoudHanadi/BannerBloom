import React from 'react';
import { useBannerStore } from '../store/bannerStore';
import {
  Type,
  Image,
  Square,
  MousePointer,
  Trash2,
  MoveUp,
  MoveDown,
  ChevronsUp,
  ChevronsDown,
} from 'lucide-react';
import type { BannerElement } from '../store/bannerStore';

interface LayersPanelProps {
  showHeader?: boolean;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({ showHeader = true }) => {
  const elements = useBannerStore((state) => state.elements);
  const selectedElementId = useBannerStore((state) => state.selectedElementId);
  const selectElement = useBannerStore((state) => state.selectElement);
  const removeElement = useBannerStore((state) => state.removeElement);
  const reorderElement = useBannerStore((state) => state.reorderElement);

  const getElementIcon = (type: BannerElement['type']) => {
    switch (type) {
      case 'text':
        return <Type className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'shape':
        return <Square className="h-4 w-4" />;
      case 'button':
        return <MousePointer className="h-4 w-4" />;
      default:
        return <Square className="h-4 w-4" />;
    }
  };

  const getElementLabel = (element: BannerElement) => {
    const typeLabel = element.type.charAt(0).toUpperCase() + element.type.slice(1);

    if (element.type === 'text') {
      const preview = element.content.length > 20 ? `${element.content.substring(0, 20)}...` : element.content;
      return `${typeLabel}: "${preview}"`;
    }

    if (element.type === 'shape') {
      return `${typeLabel} (${element.shapeType})`;
    }

    if (element.type === 'button') {
      return `${typeLabel}: "${element.content}"`;
    }

    return typeLabel;
  };

  const getElementDisplay = (element: BannerElement) => {
    if (element.type === 'text') {
      const preview = element.content.trim();

      return {
        title: 'Text',
        subtitle: preview.length > 48 ? `${preview.substring(0, 45)}...` : preview || 'Headline or supporting copy.',
      };
    }

    if (element.type === 'image') {
      return {
        title: 'Image',
        subtitle: 'Uploaded asset.',
      };
    }

    if (element.type === 'shape') {
      const shapeLabels: Record<NonNullable<BannerElement['shapeType']>, string> = {
        rectangle: 'Rectangle',
        circle: 'Circle',
        'rounded-rectangle': 'Rounded card',
      };

      return {
        title: shapeLabels[element.shapeType ?? 'rectangle'],
        subtitle: 'Shape layer.',
      };
    }

    if (element.type === 'button') {
      const preview = element.content.trim();

      return {
        title: 'CTA button',
        subtitle: preview.length > 40 ? `${preview.substring(0, 37)}...` : preview || 'Call to action.',
      };
    }

    return {
      title: 'Layer',
      subtitle: '',
    };
  };

  const displayElements = [...elements].reverse();

  return (
    <div className="studio-layers-panel flex h-full min-h-0 flex-col">
      {showHeader && (
        <div className="mb-4 flex flex-shrink-0 items-center justify-between">
          <div>
            <div className="studio-section-label !mb-1">Layers</div>
            <h3 className="text-base font-bold text-slate-900">Layer stack</h3>
          </div>
          <span className="studio-pill studio-pill-neutral">{elements.length}</span>
        </div>
      )}

      <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {displayElements.length === 0 ? (
          <div className="studio-empty-state flex flex-col items-center justify-center px-4 py-8 text-center">
            <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Empty canvas
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">No layers yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Add text, shapes, or images to start building your creative composition.
            </p>
          </div>
        ) : (
          displayElements.map((element, displayIndex) => {
            const isSelected = element.id === selectedElementId;
            const actualIndex = elements.length - 1 - displayIndex;
            const isTop = actualIndex === elements.length - 1;
            const isBottom = actualIndex === 0;
            const { title, subtitle } = getElementDisplay(element);

            return (
              <div
                key={element.id}
                className={`group cursor-pointer rounded-[1.05rem] border px-3 py-2.5 transition-all ${
                  isSelected
                    ? 'border-emerald-300 bg-emerald-50/90 shadow-[0_14px_28px_rgba(16,185,129,0.14)] ring-1 ring-emerald-100'
                    : 'border-slate-200/80 bg-white/90 hover:-translate-y-[1px] hover:border-slate-300 hover:bg-white hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]'
                }`}
                onClick={() => selectElement(element.id)}
                onKeyDown={(event) => {
                  if (event.currentTarget !== event.target) {
                    return;
                  }

                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectElement(element.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[0.85rem] ${
                      isSelected ? 'bg-emerald-600 text-white shadow-[0_12px_20px_rgba(16,185,129,0.24)]' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {getElementIcon(element.type)}
                  </div>

                  <div className="min-w-0 flex-1" title={getElementLabel(element)}>
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`break-words text-sm font-semibold leading-5 ${
                          isSelected ? 'text-emerald-950' : 'text-slate-700'
                        }`}
                      >
                        {title}
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                          isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        L{actualIndex + 1}
                      </span>
                    </div>
                    {subtitle && (
                      <div className="mt-1 break-words text-xs leading-4 text-slate-500">{subtitle}</div>
                    )}
                    <div className="mt-2 text-[11px] uppercase tracking-[0.08em] text-slate-400">
                      {element.type}
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-2.5 grid grid-cols-5 gap-1.5 border-t border-slate-200/70 pt-2 transition-all ${
                    isSelected
                      ? 'max-h-20 opacity-100'
                      : 'max-h-0 overflow-hidden border-t-transparent pt-0 opacity-0 group-hover:max-h-20 group-hover:border-slate-200/70 group-hover:pt-2 group-hover:opacity-100'
                  }`}
                >
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      reorderElement(element.id, 'up');
                    }}
                    disabled={isTop}
                    className={`rounded-xl p-2 ${
                      isTop
                        ? 'cursor-not-allowed text-slate-300'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                    title="Move layer up"
                  >
                    <MoveUp className="mx-auto h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      reorderElement(element.id, 'down');
                    }}
                    disabled={isBottom}
                    className={`rounded-xl p-2 ${
                      isBottom
                        ? 'cursor-not-allowed text-slate-300'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                    title="Move layer down"
                  >
                    <MoveDown className="mx-auto h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      reorderElement(element.id, 'top');
                    }}
                    disabled={isTop}
                    className={`rounded-xl p-2 ${
                      isTop
                        ? 'cursor-not-allowed text-slate-300'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                    title="Bring to front"
                  >
                    <ChevronsUp className="mx-auto h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      reorderElement(element.id, 'bottom');
                    }}
                    disabled={isBottom}
                    className={`rounded-xl p-2 ${
                      isBottom
                        ? 'cursor-not-allowed text-slate-300'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                    title="Send to back"
                  >
                    <ChevronsDown className="mx-auto h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      if (confirm(`Delete layer "${getElementLabel(element)}"?`)) {
                        removeElement(element.id);
                      }
                    }}
                    className="rounded-xl p-2 text-red-600 transition-colors hover:bg-red-50"
                    title="Delete layer"
                  >
                    <Trash2 className="mx-auto h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {elements.length > 0 && (
        <div className="mt-3 flex-shrink-0 rounded-2xl bg-slate-50 px-2.5 py-2 text-[10px] text-slate-500">
          Top entries render in front. Use the controls to reorder the creative.
        </div>
      )}
    </div>
  );
};
