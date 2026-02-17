import React, { useState } from 'react';
import { useBannerStore } from '../store/bannerStore';
import { MousePointer, X, ChevronDown, ChevronUp, Plus, Sparkles, Type, Palette, Maximize2 } from 'lucide-react';
import type { CTAPosition, CTAAnimation } from '../store/bannerStore';

export const CTAPanel: React.FC = () => {
  const cta = useBannerStore((state) => state.cta);
  const setCTA = useBannerStore((state) => state.setCTA);
  const updateCTA = useBannerStore((state) => state.updateCTA);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [textSectionOpen, setTextSectionOpen] = useState(true);
  const [colorsSectionOpen, setColorsSectionOpen] = useState(false);
  const [sizeSectionOpen, setSizeSectionOpen] = useState(false);
  const [animationSectionOpen, setAnimationSectionOpen] = useState(false);

  const positions: { value: CTAPosition; label: string; icon: string }[] = [
    { value: 'top-left', label: 'Top Left', icon: '↖️' },
    { value: 'top-center', label: 'Top Center', icon: '⬆️' },
    { value: 'top-right', label: 'Top Right', icon: '↗️' },
    { value: 'center', label: 'Center', icon: '⏺️' },
    { value: 'bottom-left', label: 'Bottom Left', icon: '↙️' },
    { value: 'bottom-center', label: 'Bottom Center', icon: '⬇️' },
    { value: 'bottom-right', label: 'Bottom Right', icon: '↘️' },
  ];

  const handleAddCTA = () => {
    setCTA({
      text: 'Click Here',
      position: 'bottom-center',
      width: 25,
      height: 50,
      borderRadius: 8,
      backgroundColor: '#3b82f6',
      backgroundType: 'solid',
      gradientColors: ['#3b82f6', '#8b5cf6'],
      gradientDirection: 'to right',
      textColor: '#ffffff',
      fontSize: 40,
      fontWeight: 'bold',
      padding: 20,
      animation: 'none',
      animationSpeed: 1.5,
      colorWaveColors: ['#3b82f6', '#8b5cf6'],
    });
    setIsExpanded(true);
  };

  const handleRemoveCTA = () => {
    if (confirm('Remove CTA from all banners?')) {
      setCTA(null);
      setIsExpanded(false);
    }
  };

  const getBackgroundStyle = () => {
    if (!cta) return {};
    if (cta.backgroundType === 'gradient' && cta.gradientColors) {
      return {
        background: `linear-gradient(${cta.gradientDirection || 'to right'}, ${cta.gradientColors[0]}, ${cta.gradientColors[1]})`,
      };
    }
    return { backgroundColor: cta.backgroundColor };
  };

  const CollapsibleSection = ({ 
    title, 
    icon, 
    isOpen, 
    onToggle, 
    children,
    badge 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    isOpen: boolean; 
    onToggle: () => void; 
    children: React.ReactNode;
    badge?: string;
  }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold text-gray-700">{title}</span>
          {badge && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
      </button>
      {isOpen && (
        <div className="p-3 bg-white space-y-3">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-shrink-0 border-t border-gray-200 pt-4 mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full flex items-center justify-between p-3 rounded-lg transition-all
          ${cta 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-300' 
            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
          }
        `}
      >
        <div className="flex items-center gap-2">
          <MousePointer className={`w-4 h-4 ${cta ? 'text-green-600' : 'text-gray-600'}`} />
          <span className={`text-sm font-bold uppercase tracking-wide ${cta ? 'text-green-900' : 'text-gray-700'}`}>
            Global CTA
            {cta && <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Active</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {cta && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveCTA();
              }}
              className="text-red-600 hover:text-red-800 p-1 hover:bg-red-100 rounded transition-colors"
              title="Remove CTA"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {!cta ? (
            <div>
              <button
                onClick={handleAddCTA}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-md font-medium transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Call-to-Action Button
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                CTA appears on all banners automatically
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* CTA Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 flex items-center justify-center mb-3">
                <button
                  style={{
                    ...getBackgroundStyle(),
                    color: cta.textColor,
                    borderRadius: `${cta.borderRadius}px`,
                    padding: '12px 24px',
                    fontWeight: cta.fontWeight,
                    fontSize: '14px',
                  }}
                  className="shadow-md transition-transform hover:scale-105"
                >
                  {cta.text || 'CTA Button'}
                </button>
              </div>

              {/* Text & Content Section */}
              <CollapsibleSection
                title="Text & Content"
                icon={<Type className="w-4 h-4 text-blue-600" />}
                isOpen={textSectionOpen}
                onToggle={() => setTextSectionOpen(!textSectionOpen)}
              >
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={cta.text}
                    onChange={(e) => updateCTA({ text: e.target.value })}
                    placeholder="Enter CTA text..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">
                    Font Weight
                  </label>
                  <div className="flex gap-2">
                    {(['normal', 'bold', 'bolder'] as const).map((weight) => (
                      <button
                        key={weight}
                        onClick={() => updateCTA({ fontWeight: weight })}
                        className={`
                          flex-1 px-3 py-2 rounded-md border transition-all text-sm capitalize
                          ${cta.fontWeight === weight
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                          }
                        `}
                      >
                        {weight}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">
                    Position
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {positions.map((pos) => (
                      <button
                        key={pos.value}
                        onClick={() => updateCTA({ position: pos.value })}
                        className={`
                          p-2 text-xs font-medium rounded border transition-all
                          ${cta.position === pos.value
                            ? 'bg-green-600 text-white border-green-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                          }
                        `}
                        title={pos.label}
                      >
                        <div className="text-base mb-0.5">{pos.icon}</div>
                        <div className="text-[9px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                          {pos.label.split(' ')[0]}<br/>{pos.label.split(' ')[1] || ''}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CollapsibleSection>

              {/* Colors & Background Section */}
              <CollapsibleSection
                title="Colors & Background"
                icon={<Palette className="w-4 h-4 text-purple-600" />}
                isOpen={colorsSectionOpen}
                onToggle={() => setColorsSectionOpen(!colorsSectionOpen)}
                badge={cta.backgroundType === 'gradient' ? 'Gradient' : 'Solid'}
              >
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">
                    Background Style
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateCTA({ backgroundType: 'solid' })}
                      className={`
                        flex-1 px-3 py-2 rounded-md border-2 transition-all text-sm font-medium
                        ${cta.backgroundType === 'solid'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                        }
                      `}
                    >
                      Solid Color
                    </button>
                    <button
                      onClick={() => updateCTA({ backgroundType: 'gradient' })}
                      className={`
                        flex-1 px-3 py-2 rounded-md border-2 transition-all text-sm font-medium
                        ${cta.backgroundType === 'gradient'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                        }
                      `}
                    >
                      Gradient
                    </button>
                  </div>
                </div>

                {cta.backgroundType === 'solid' ? (
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-2">
                      Background Color
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={cta.backgroundColor}
                        onChange={(e) => updateCTA({ backgroundColor: e.target.value })}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cta.backgroundColor}
                        onChange={(e) => updateCTA({ backgroundColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-2">
                        Gradient Color 1
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={cta.gradientColors?.[0] || '#3b82f6'}
                          onChange={(e) => updateCTA({ 
                            gradientColors: [e.target.value, cta.gradientColors?.[1] || '#8b5cf6'] 
                          })}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={cta.gradientColors?.[0] || '#3b82f6'}
                          onChange={(e) => updateCTA({ 
                            gradientColors: [e.target.value, cta.gradientColors?.[1] || '#8b5cf6'] 
                          })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-2">
                        Gradient Color 2
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={cta.gradientColors?.[1] || '#8b5cf6'}
                          onChange={(e) => updateCTA({ 
                            gradientColors: [cta.gradientColors?.[0] || '#3b82f6', e.target.value] 
                          })}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={cta.gradientColors?.[1] || '#8b5cf6'}
                          onChange={(e) => updateCTA({ 
                            gradientColors: [cta.gradientColors?.[0] || '#3b82f6', e.target.value] 
                          })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-2">
                        Gradient Direction
                      </label>
                      <select
                        value={cta.gradientDirection}
                        onChange={(e) => updateCTA({ gradientDirection: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="to right">Left to Right →</option>
                        <option value="to left">Right to Left ←</option>
                        <option value="to bottom">Top to Bottom ↓</option>
                        <option value="to top">Bottom to Top ↑</option>
                        <option value="135deg">Diagonal ↘</option>
                        <option value="45deg">Diagonal ↗</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">
                    Text Color
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={cta.textColor}
                      onChange={(e) => updateCTA({ textColor: e.target.value })}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={cta.textColor}
                      onChange={(e) => updateCTA({ textColor: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                    />
                  </div>
                </div>
              </CollapsibleSection>

              {/* Size & Shape Section */}
              <CollapsibleSection
                title="Size & Shape"
                icon={<Maximize2 className="w-4 h-4 text-orange-600" />}
                isOpen={sizeSectionOpen}
                onToggle={() => setSizeSectionOpen(!sizeSectionOpen)}
              >
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">
                    Button Width: {cta.width}% of banner
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={cta.width}
                    onChange={(e) => updateCTA({ width: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">
                    Button Height: {cta.height}px
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    step="5"
                    value={cta.height}
                    onChange={(e) => updateCTA({ height: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">
                    Corner Rounding: {cta.borderRadius}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="2"
                    value={cta.borderRadius}
                    onChange={(e) => updateCTA({ borderRadius: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>Sharp (0px)</span>
                    <span>Rounded (50px)</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">
                    Padding: {cta.padding}px from edges
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={cta.padding}
                    onChange={(e) => updateCTA({ padding: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </CollapsibleSection>

              {/* Animations Section */}
              <CollapsibleSection
                title="Animations"
                icon={<Sparkles className="w-4 h-4 text-purple-600" />}
                isOpen={animationSectionOpen}
                onToggle={() => setAnimationSectionOpen(!animationSectionOpen)}
                badge={cta.animation !== 'none' ? cta.animation : undefined}
              >
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">
                    Animation Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateCTA({ animation: 'none' })}
                      className={`
                        px-3 py-2 rounded-md border-2 transition-all text-xs font-medium
                        ${cta.animation === 'none'
                          ? 'bg-gray-600 text-white border-gray-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }
                      `}
                    >
                      None
                    </button>
                    <button
                      onClick={() => updateCTA({ animation: 'heartbeat' })}
                      className={`
                        px-3 py-2 rounded-md border-2 transition-all text-xs font-medium flex items-center justify-center gap-1
                        ${cta.animation === 'heartbeat'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-red-300'
                        }
                      `}
                    >
                      💗 Heartbeat
                    </button>
                    <button
                      onClick={() => updateCTA({ animation: 'shake' })}
                      className={`
                        px-3 py-2 rounded-md border-2 transition-all text-xs font-medium flex items-center justify-center gap-1
                        ${cta.animation === 'shake'
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-orange-300'
                        }
                      `}
                    >
                      ⚡ Shake
                    </button>
                    <button
                      onClick={() => updateCTA({ animation: 'colorwave' })}
                      className={`
                        px-3 py-2 rounded-md border-2 transition-all text-xs font-medium flex items-center justify-center gap-1
                        ${cta.animation === 'colorwave'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                        }
                      `}
                    >
                      🌈 Color Wave
                    </button>
                  </div>
                </div>

                {cta.animation !== 'none' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-2">
                      Animation Speed: {cta.animationSpeed}s
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.1"
                      value={cta.animationSpeed}
                      onChange={(e) => updateCTA({ animationSpeed: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                      <span>Fast (0.5s)</span>
                      <span>Slow (5s)</span>
                    </div>
                  </div>
                )}

                {cta.animation === 'colorwave' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-2">
                        Wave Color 1
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={cta.colorWaveColors?.[0] || '#3b82f6'}
                          onChange={(e) => updateCTA({ 
                            colorWaveColors: [e.target.value, cta.colorWaveColors?.[1] || '#8b5cf6'] 
                          })}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={cta.colorWaveColors?.[0] || '#3b82f6'}
                          onChange={(e) => updateCTA({ 
                            colorWaveColors: [e.target.value, cta.colorWaveColors?.[1] || '#8b5cf6'] 
                          })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-2">
                        Wave Color 2
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={cta.colorWaveColors?.[1] || '#8b5cf6'}
                          onChange={(e) => updateCTA({ 
                            colorWaveColors: [cta.colorWaveColors?.[0] || '#3b82f6', e.target.value] 
                          })}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={cta.colorWaveColors?.[1] || '#8b5cf6'}
                          onChange={(e) => updateCTA({ 
                            colorWaveColors: [cta.colorWaveColors?.[0] || '#3b82f6', e.target.value] 
                          })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CollapsibleSection>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
