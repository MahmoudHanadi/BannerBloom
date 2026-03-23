import React, { useState, useRef, useEffect } from 'react';
import type { BannerElement, Override } from '../store/bannerStore';
import { useBannerStore } from '../store/bannerStore';
import { calculateElementLayout } from '../utils/layoutUtils';
import { getCategoryMasterSize } from '../config/bannerPresets';

interface BannerRendererProps {
  bannerId: string;
  width: number;
  height: number;
  elements: BannerElement[];
  overrides?: Record<string, Override>;
  isMaster?: boolean;
  category: 'square' | 'horizontal' | 'vertical';
  customScale?: number;
  interactionScale?: number;
  isExport?: boolean;
  suppressButtonText?: boolean;
}

export const BannerRenderer: React.FC<BannerRendererProps> = ({
  bannerId,
  width,
  height,
  elements,
  overrides,
  isMaster,
  category,
  customScale,
  interactionScale = 1,
  isExport,
  suppressButtonText,
}) => {
  const selectElement = useBannerStore((state) => state.selectElement);
  const selectBanner = useBannerStore((state) => state.selectBanner);
  const selectedElementId = useBannerStore((state) => state.selectedElementId);
  const setOverride = useBannerStore((state) => state.setOverride);
  const isolatedBannerId = useBannerStore((state) => state.isolatedBannerId);
  const setIsolatedBanner = useBannerStore((state) => state.setIsolatedBanner);

  const background = useBannerStore((state) => state.background);
  const bannerSizes = useBannerStore((state) => state.bannerSizes);

  // Track clicks for triple-click detection
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; w: number; h: number; handle: string; initialX?: number; initialY?: number; initialFontSize?: number }>({ x: 0, y: 0, w: 0, h: 0, handle: '' });
  const [rotateStart, setRotateStart] = useState({ angle: 0, startAngle: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Scale factor for display
  const scale = customScale ?? Math.min(1, 360 / width, 520 / height);
  const displayWidth = width * scale;
  const displayHeight = height * scale;
  const masterHeight = getCategoryMasterSize(bannerSizes, category)?.height ?? height;

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    selectElement(elementId);
    selectBanner(bannerId);
    setIsDragging(true);

    const el = elements.find(e => e.id === elementId);
    if (el) {
      const layout = calculateElementLayout(el, overrides, width, height, category, scale, masterHeight);
      setDragStart({ x: e.clientX, y: e.clientY, initialX: layout.x, initialY: layout.y });
    } else {
      setDragStart({ x: e.clientX, y: e.clientY, initialX: 0, initialY: 0 });
    }
  };

  const handleResizeStart = (e: React.MouseEvent, handle: string, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    const el = elements.find(e => e.id === elementId);
    if (!el) return;

    // Use the calculated layout to get the ACTUAL visual size (which might be clamped)
    // This prevents jumping when resizing a clamped element
    const layout = calculateElementLayout(el, overrides, width, height, category, scale, masterHeight);

    // Convert visual pixels back to percentages for the resize operation base
    const visualWPercent = (layout.pixelW / displayWidth) * 100;
    const visualHPercent = (layout.pixelH / displayHeight) * 100;
    const visualXPercent = (layout.pixelX / displayWidth) * 100; // Top-left relative to screen
    const visualYPercent = (layout.pixelY / displayHeight) * 100;

    // We need to store the "effective" props that match the visual state
    // Note: props.x/y are center-based in our store? No, store is top-left.
    // But calculateElementLayout returns pixelX (top-left).
    // So visualXPercent is correct.

    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      w: visualWPercent,
      h: visualHPercent,
      handle,
      // Store initial position to handle top/left resizing correctly relative to visual start
      initialX: visualXPercent,
      initialY: visualYPercent,
      initialFontSize: parseInt(el.style?.fontSize as string || '32')
    });
  };

  const handleRotateStart = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRotating(true);
    const el = elements.find(e => e.id === elementId);
    if (!el) return;

    // Calculate center of element in screen coordinates
    const layout = calculateElementLayout(el, overrides, width, height, category, scale, masterHeight);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + (layout.pixelX + layout.pixelW / 2) * interactionScale;
    const centerY = rect.top + (layout.pixelY + layout.pixelH / 2) * interactionScale;

    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    setRotateStart({ angle: layout.rotation, startAngle });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!selectedElementId) return;
      const element = elements.find(el => el.id === selectedElementId);
      if (!element) return;
      // const props = getElementProps(element); // This is no longer needed as layout provides merged props

      // We need to get the current effective properties for the element, considering overrides
      const currentLayout = calculateElementLayout(element, overrides, width, height, category, scale, masterHeight);

      if (isDragging) {
        const deltaX = (e.clientX - dragStart.x) / interactionScale;
        const deltaY = (e.clientY - dragStart.y) / interactionScale;

        const deltaXPercent = (deltaX / displayWidth) * 100;
        const deltaYPercent = (deltaY / displayHeight) * 100;

        setOverride(bannerId, selectedElementId, {
          x: dragStart.initialX + deltaXPercent, // Use dragStart.initialX for base
          y: dragStart.initialY + deltaYPercent  // Use dragStart.initialY for base
        });
      } else if (isResizing) {
        const deltaX = (e.clientX - resizeStart.x) / interactionScale;
        const deltaY = (e.clientY - resizeStart.y) / interactionScale;

        const deltaXPercent = (deltaX / displayWidth) * 100;
        const deltaYPercent = (deltaY / displayHeight) * 100;

        // Use the CAPTURED visual dimensions from resizeStart, not the store props
        // This ensures we resize from the clamped state smoothly
        let newW = resizeStart.w;
        let newH = resizeStart.h;

        let newX = resizeStart.initialX !== undefined ? resizeStart.initialX : (currentLayout.x);
        let newY = resizeStart.initialY !== undefined ? resizeStart.initialY : (currentLayout.y);

        // Calculate new Width first
        if (resizeStart.handle.includes('e')) {
          newW += deltaXPercent;
        } else if (resizeStart.handle.includes('w')) {
          newW -= deltaXPercent;
          newX += deltaXPercent;
        }

        // Calculate new Height

        // Determine effective lock state
        // If it's a shape, it's unlocked by default, but Shift locks it (to 1:1)
        // If it's others (image/text), it's locked by default (usually), but maybe we want shift to unlock?
        // User request: "freely resize ... when holding shift and free form ... when not holdong shift"
        // Actually user said: "resize rectangle to square when holding shift and free form ... when not holdong shift"

        const isShape = element.type === 'shape';
        const shiftPressed = e.shiftKey;

        // For shapes: Locked (Square) IF Shift is pressed. Unlocked otherwise.
        // For others: Use existing property.
        // Note: We might want to support shift-to-unlock for images too, but let's stick to the specific request for now.
        // Actually, let's make it consistent: Shift INVERTS the lock state?
        // No, user specifically asked for "hold shift -> square".

        const effectivelyLocked = isShape ? shiftPressed : element.aspectRatioLocked;

        if (effectivelyLocked) {
          // Maintain aspect ratio
          // Use stored aspect ratio if available, otherwise calculate from current dimensions
          let aspect = currentLayout.aspectRatio;

          if (isShape && shiftPressed) {
            aspect = 1; // Force 1:1 for shapes when holding shift
          } else if (!aspect) {
            // Fallback: Calculate from current pixel dimensions
            const pixelW = (currentLayout.w / 100) * displayWidth;
            const pixelH = (currentLayout.h / 100) * displayHeight;
            aspect = pixelW / pixelH;
          }

          if (element.type === 'text') {
            // For text, resizing the box scales the font size and updates width
            // We primarily drive this by height change to keep it simple, or width if dragging side?
            // Let's use the larger delta to drive scale

            // Simple approach: Calculate new height, determine scale ratio, apply to font size


            // Calculate absolute total delta from start
            const totalDeltaY = (e.clientY - resizeStart.y) / interactionScale;

            // Calculate initial pixel height based on the font size relation
            // We know: currentH ~ currentFontSize. layout.pixelH is current visual height.
            // But we want to scale based on INITIAL state to avoid drift.

            // Let's use the initial frame of reference.
            // We don't have initialPixelH stored, but we can infer it or just use the delta ratio on the font size directly?
            // Actually, we can use the ratio of (newHeight / oldHeight) * oldFontSize.
            // But we need oldHeight (at start of drag).

            // Let's rely on the fact that for text, height is roughly proportional to font size.
            // So we can say: newFontSize = initialFontSize * (1 + deltaY / initialHeight)
            // But getting initialHeight is tricky without storing it.
            // However, resizeStart.h is the initial height in PERCENT.
            // So initialPixelH = (resizeStart.h / 100) * displayHeight.

            const initialPixelH = (resizeStart.h / 100) * displayHeight;
            let targetPixelH = initialPixelH;

            if (resizeStart.handle.includes('s')) {
              targetPixelH += totalDeltaY;
            } else if (resizeStart.handle.includes('n')) {
              targetPixelH -= totalDeltaY;
            }

            if (targetPixelH < 10) targetPixelH = 10;

            const scaleRatio = targetPixelH / initialPixelH;
            const newFontSize = Math.round((resizeStart.initialFontSize || 32) * scaleRatio);

            setOverride(bannerId, selectedElementId, {
              style: { fontSize: `${newFontSize}px` }
            });
          } else {
            // Calculate new height based on new width
            // newPixelH = newPixelW / aspect

            // Avoid division by zero
            if (aspect && aspect !== 0) {
              newH = newW * (displayWidth / displayHeight) / aspect;
            }

            // Adjust Y if resizing from top
            if (resizeStart.handle.includes('n')) {
              // We need to adjust Y based on the height change
              // The height change is (newH - oldH)
              // But oldH is resizeStart.h
              newY = (resizeStart.initialY || 0) + (resizeStart.h - newH);
            }
          }
        } else {
          // Free resize
          if (resizeStart.handle.includes('s')) {
            newH += deltaYPercent;
          } else if (resizeStart.handle.includes('n')) {
            newH -= deltaYPercent;
            newY += deltaYPercent;
          }
        }

        setOverride(bannerId, selectedElementId, {
          width: Math.max(1, newW),
          height: Math.max(1, newH),
          x: newX,
          y: newY
        });

        // We DO NOT reset resizeStart here because we are calculating absolute deltas from the start
        // Wait, the original code reset it: setResizeStart({ ...resizeStart, x: e.clientX, y: e.clientY });
        // And added delta to props.w.
        // My new logic adds delta to resizeStart.w (initial).
        // So I should NOT reset resizeStart.x/y. I should calculate delta from the ORIGINAL click.
        // But e.clientX is current. resizeStart.x is original.
        // So deltaX is total delta.
        // So newW = resizeStart.w + deltaXPercent.
        // This is correct.

        // So I should remove the "Reset start position" line.

      } else if (isRotating) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const layout = calculateElementLayout(element, overrides, width, height, category, scale, masterHeight);
        const centerX = rect.left + (layout.pixelX + layout.pixelW / 2) * interactionScale;
        const centerY = rect.top + (layout.pixelY + layout.pixelH / 2) * interactionScale;

        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        const angleDiff = currentAngle - rotateStart.startAngle;

        setOverride(bannerId, selectedElementId, { rotation: rotateStart.angle + angleDiff });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
    };

    if (isDragging || isResizing || isRotating) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isRotating, dragStart, resizeStart, rotateStart, selectedElementId, bannerId, displayWidth, displayHeight, elements, overrides, setOverride, width, height, category, scale, masterHeight, interactionScale]);



  const getShapeStyle = (shapeType?: string) => {
    switch (shapeType) {
      case 'circle': return { borderRadius: '50%' };
      case 'rounded-rectangle': return { borderRadius: '8px' };
      default: return {};
    }
  };

  const getButtonHorizontalAlign = (align?: React.CSSProperties['textAlign']) => {
    switch (align) {
      case 'left':
        return 'left';
      case 'right':
        return 'right';
      default:
        return 'center';
    }
  };

  const getButtonTextPosition = (align: string | undefined, buffer: number): React.CSSProperties => {
    switch (align) {
      case 'top':
        return { top: buffer };
      case 'bottom':
        return { bottom: buffer };
      default:
        return {
          top: '50%',
          transform: 'translateY(-50%)',
        };
    }
  };

  const selectedBannerId = useBannerStore((state) => state.selectedBannerId);
  const isSelected = selectedBannerId === bannerId;
  const isIsolated = isolatedBannerId === bannerId;
  const containerClassName =
    !isExport && isIsolated
      ? 'ring-4 ring-emerald-200'
      : !isExport && isSelected
        ? 'ring-4 ring-teal-100'
        : '';

  // Handle triple-click to toggle isolated mode
  const handleBannerClick = () => {
    selectElement(null);
    selectBanner(bannerId);

    // Don't track clicks for export mode
    if (isExport) return;

    // Increment click count
    clickCountRef.current += 1;

    // Clear existing timer
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    // Check if we hit 3 clicks
    if (clickCountRef.current >= 3) {
      // Toggle isolated mode
      if (isIsolated) {
        setIsolatedBanner(null);
      } else {
        setIsolatedBanner(bannerId);
      }
      clickCountRef.current = 0;
    } else {
      // Reset counter after 1 second
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1000);
    }
  };

  // Add ESC key listener to exit isolated mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isIsolated) {
        setIsolatedBanner(null);
      }
    };

    if (isIsolated) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isIsolated, setIsolatedBanner]);

  return (
    <div
      ref={containerRef}
      data-banner-renderer-id={bannerId}
      style={{
        position: 'relative',
        userSelect: 'none',
        width: displayWidth,
        height: displayHeight,
        border: isExport ? 'none' : isIsolated ? '3px solid #19C37D' : isMaster ? '2px solid #19C37D' : isSelected ? '2px solid #0EA5A4' : '1px solid rgba(148, 163, 184, 0.32)',
        backgroundColor: (background.type === 'solid' ? background.value : undefined) || '#ffffff',
        backgroundImage: background.type === 'gradient'
          ? `linear-gradient(${background.gradientDirection || '90deg'}, ${background.gradientColors?.[0] || '#ffffff'}, ${background.gradientColors?.[1] || '#000000'})`
          : background.type === 'image' ? `url(${background.value})` : undefined,
        backgroundSize: background.type === 'image' ? 'cover' : undefined,
        backgroundPosition: 'center',
        overflow: isSelected && !isExport ? 'visible' : 'hidden',
        zIndex: isSelected ? 50 : 1,
        borderRadius: isExport ? 0 : 20,
        boxShadow: !isExport ? '0 14px 30px rgba(15, 23, 42, 0.12)' : undefined,
      }}
      className={containerClassName}
      onClick={handleBannerClick}
    >
      {/* Isolated Mode Indicator */}
      {isIsolated && !isExport && (
        <div
          data-banner-editor-only="true"
          className="absolute right-0 top-0 z-[9999] rounded-bl-xl bg-emerald-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-md"
        >
          PLACEMENT FOCUS
        </div>
      )}

      {elements.map((el, index) => {
        const layout = calculateElementLayout(el, overrides, width, height, category, scale, masterHeight);
        const isElSelected = el.id === selectedElementId && !isExport;
        const buttonPaddingY = Math.max(2, 4 * scale);
        const buttonPaddingX = Math.max(4, 8 * scale);
        // Fix Layer Order: Use array index for z-index when not selected, so DOM order (layer order) is respected.
        // Selected element gets promoted to 1000 to be on top of handles, but efficient lookups needed?
        // Actually, just index + 1 is fine for base. Selected can be index + 1000 or just 1000.
        const zIndex = isElSelected ? 1000 : (index + 1);

        return (
          <React.Fragment key={el.id}>
            {/* Content Layer */}
            <div
              onMouseDown={(e) => handleMouseDown(e, el.id)}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                left: layout.pixelX,
                top: layout.pixelY,
                // For text, we use the calculated width so alignment works, but keep height auto to hug content
                width: el.type === 'text' ? layout.pixelW : layout.pixelW,
                height: el.type === 'text' ? 'max-content' : layout.pixelH,
                transform: `rotate(${layout.rotation}deg)`,
                ...layout.mergedStyle,
                ...(el.type === 'shape' ? {
                  backgroundColor: layout.content,
                  ...getShapeStyle(el.shapeType)
                } : {}),
                ...(el.type === 'button' ? {
                  display: 'block',
                  alignItems: undefined,
                  justifyContent: undefined,
                  verticalAlign: undefined,
                  textAlign: undefined,
                  fontSize: undefined,
                  fontFamily: undefined,
                  fontWeight: undefined,
                  color: undefined,
                  lineHeight: undefined,
                  backgroundColor: layout.mergedStyle.backgroundColor || '#19C37D',
                  borderRadius: layout.mergedStyle.borderRadius || '8px',
                  overflow: 'hidden',
                  padding: 0,
                } : {}),
                cursor: isDragging ? 'grabbing' : 'move',
                boxSizing: 'border-box',
                zIndex: zIndex,
                border: isElSelected && el.type === 'text' ? '1px solid #19C37D' : '1px dashed transparent',
              }}
              className={isElSelected && el.type === 'text' ? 'group pointer-events-auto ring-4 ring-emerald-100' : ''}
            >
              {/* Render Handles for Text if selected */}
              {isElSelected && el.type === 'text' && (
                <>
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-emerald-500 cursor-nw-resize pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, 'nw', el.id)} />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-emerald-500 cursor-ne-resize pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, 'ne', el.id)} />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-emerald-500 cursor-sw-resize pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, 'sw', el.id)} />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-emerald-500 cursor-se-resize pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, 'se', el.id)} />

                  {/* Rotation Handle */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-emerald-500 pointer-events-auto"></div>
                  <div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border border-emerald-500 rounded-full cursor-grab flex items-center justify-center pointer-events-auto"
                    onMouseDown={(e) => handleRotateStart(e, el.id)}
                  >
                    <span className="text-[8px] font-bold">R</span>
                  </div>
                </>
              )}

              {el.type === 'text' && (
                <div style={{
                  fontSize: `${layout.displayFontSize}px`,
                  color: layout.mergedStyle.color,
                  fontWeight: layout.mergedStyle.fontWeight,
                  fontFamily: layout.mergedStyle.fontFamily,
                  fontStyle: layout.mergedStyle.fontStyle as React.CSSProperties['fontStyle'],
                  textDecoration: layout.mergedStyle.textDecoration as React.CSSProperties['textDecoration'],
                  textAlign: layout.mergedStyle.textAlign as React.CSSProperties['textAlign'],
                  direction: layout.mergedStyle.direction as React.CSSProperties['direction'],
                  display: 'block',
                  whiteSpace: 'pre-wrap',
                  pointerEvents: 'none',
                  minWidth: '20px',
                  minHeight: '20px'
                }}>
                  {layout.content}
                </div>
              )}
              {el.type === 'image' && (
                <img
                  src={layout.content}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    objectFit: 'fill',
                    pointerEvents: 'none',
                  }}
                />
              )}
              {el.type === 'button' && !suppressButtonText && (
                <div style={{
                  position: 'absolute',
                  left: buttonPaddingX,
                  right: buttonPaddingX,
                  ...getButtonTextPosition(layout.mergedStyle.verticalAlign as string | undefined, buttonPaddingY),
                  display: 'block',
                  fontSize: `${layout.displayFontSize}px`,
                  fontFamily: layout.mergedStyle.fontFamily,
                  fontWeight: layout.mergedStyle.fontWeight || 'bold',
                  color: layout.mergedStyle.color || '#ffffff',
                  textAlign: getButtonHorizontalAlign(
                    layout.mergedStyle.textAlign as React.CSSProperties['textAlign'] | undefined,
                  ),
                  lineHeight: 1,
                  whiteSpace: 'pre-wrap',
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}>
                  <span style={{ display: 'block', maxWidth: '100%' }}>{layout.content}</span>
                </div>
              )}
            </div>

            {/* Selection Overlay (Shape/Image/Button only - Unclipped) */}
            {isElSelected && el.type !== 'text' && (
              <div
                onMouseDown={(e) => handleMouseDown(e, el.id)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  left: layout.pixelX,
                  top: layout.pixelY,
                  width: layout.pixelW,
                  height: layout.pixelH,
                  transform: `rotate(${layout.rotation}deg)`,
                  border: '1px solid #19C37D',
                  cursor: isDragging ? 'grabbing' : 'move',
                  boxSizing: 'border-box',
                  zIndex: 60, // Above content
                  pointerEvents: 'none',
                }}
                className="group pointer-events-auto"
              >
                {/* Resize Handles */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-emerald-500 cursor-nw-resize pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, 'nw', el.id)} />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-emerald-500 cursor-ne-resize pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, 'ne', el.id)} />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-emerald-500 cursor-sw-resize pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, 'sw', el.id)} />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-emerald-500 cursor-se-resize pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, 'se', el.id)} />

                {/* Rotation Handle */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-emerald-500 pointer-events-auto"></div>
                <div
                  className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border border-emerald-500 rounded-full cursor-grab flex items-center justify-center pointer-events-auto"
                  onMouseDown={(e) => handleRotateStart(e, el.id)}
                >
                  <span className="text-[8px] font-bold">R</span>
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}

    </div>
  );
};
