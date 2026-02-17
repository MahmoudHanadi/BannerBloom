import React from 'react';
import { useBannerStore } from '../store/bannerStore';
import { Type, Image, Square, MousePointer, Eye, EyeOff, Trash2, MoveUp, MoveDown, ChevronsUp, ChevronsDown } from 'lucide-react';
import type { BannerElement } from '../store/bannerStore';

export const LayersPanel: React.FC = () => {
  const elements = useBannerStore((state) => state.elements);
  const selectedElementId = useBannerStore((state) => state.selectedElementId);
  const selectElement = useBannerStore((state) => state.selectElement);
  const removeElement = useBannerStore((state) => state.removeElement);
  const reorderElement = useBannerStore((state) => state.reorderElement);

  const getElementIcon = (type: BannerElement['type']) => {
    switch (type) {
      case 'text':
        return <Type className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'shape':
        return <Square className="w-4 h-4" />;
      case 'button':
        return <MousePointer className="w-4 h-4" />;
      default:
        return <Square className="w-4 h-4" />;
    }
  };

  const getElementLabel = (element: BannerElement) => {
    const typeLabel = element.type.charAt(0).toUpperCase() + element.type.slice(1);
    
    if (element.type === 'text') {
      const preview = element.content.length > 20 
        ? element.content.substring(0, 20) + '...' 
        : element.content;
      return `${typeLabel}: "${preview}"`;
    } else if (element.type === 'shape') {
      return `${typeLabel} (${element.shapeType})`;
    } else if (element.type === 'button') {
      return `${typeLabel}: "${element.content}"`;
    } else {
      return typeLabel;
    }
  };

  // Elements are rendered from index 0 (bottom) to end (top)
  // So we reverse the array for display so top items appear first in the list
  const displayElements = [...elements].reverse();

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-sm font-bold text-black uppercase tracking-wide">
          Layers
        </h3>
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {elements.length}
        </span>
      </div>
      
      <div className="space-y-1 overflow-y-auto flex-1 pr-1 -mr-1 min-h-0 scrollbar-thin">
        {displayElements.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <div className="text-2xl mb-2">📄</div>
            No layers yet.<br />
            <span className="text-xs">Add unlimited elements to get started!</span>
          </div>
        ) : (
          displayElements.map((element, displayIndex) => {
            const isSelected = element.id === selectedElementId;
            const actualIndex = elements.length - 1 - displayIndex;
            const isTop = actualIndex === elements.length - 1;
            const isBottom = actualIndex === 0;

            return (
              <div
                key={element.id}
                className={`
                  group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all
                  ${isSelected 
                    ? 'bg-blue-100 border-2 border-blue-500 shadow-sm' 
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  }
                `}
                onClick={() => selectElement(element.id)}
              >
                {/* Icon */}
                <div className={`
                  flex-shrink-0 p-1.5 rounded
                  ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {getElementIcon(element.type)}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <div className={`
                    text-xs font-medium truncate
                    ${isSelected ? 'text-blue-900' : 'text-gray-700'}
                  `}>
                    {getElementLabel(element)}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Layer {actualIndex + 1}
                  </div>
                </div>

                {/* Controls - Show on hover or when selected */}
                <div className={`
                  flex items-center gap-1 flex-shrink-0
                  ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                  transition-opacity
                `}>
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderElement(element.id, 'up');
                      }}
                      disabled={isTop}
                      className={`
                        p-0.5 rounded transition-colors
                        ${isTop 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                        }
                      `}
                      title="Move layer up (forward)"
                    >
                      <MoveUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderElement(element.id, 'down');
                      }}
                      disabled={isBottom}
                      className={`
                        p-0.5 rounded transition-colors
                        ${isBottom 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                        }
                      `}
                      title="Move layer down (backward)"
                    >
                      <MoveDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* To Top/Bottom buttons */}
                  <div className="flex flex-col gap-0.5 border-l border-gray-300 pl-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderElement(element.id, 'top');
                      }}
                      disabled={isTop}
                      className={`
                        p-0.5 rounded transition-colors
                        ${isTop 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                        }
                      `}
                      title="Bring to front"
                    >
                      <ChevronsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderElement(element.id, 'bottom');
                      }}
                      disabled={isBottom}
                      className={`
                        p-0.5 rounded transition-colors
                        ${isBottom 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                        }
                      `}
                      title="Send to back"
                    >
                      <ChevronsDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete layer "${getElementLabel(element)}"?`)) {
                        removeElement(element.id);
                      }
                    }}
                    className="p-1 rounded text-red-600 hover:bg-red-100 transition-colors ml-1"
                    title="Delete layer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {elements.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-[10px] text-gray-500 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span>💡 Top layers = frontmost</span>
            {elements.length > 5 && (
              <span className="text-blue-600 font-semibold">↕ Scroll for more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
