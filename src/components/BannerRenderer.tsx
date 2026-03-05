import React, { useState, useRef, useEffect } from 'react';
import type { BannerElement, Override } from '../store/bannerStore';
import { useBannerStore } from '../store/bannerStore';
import { calculateElementLayout } from '../utils/layoutUtils';

interface BannerRendererProps {
  bannerId: string;
  width: number;
  height: number;
  elements: BannerElement[];
  overrides?: Record<string, Override>;
  isMaster?: boolean;
  category: 'square' | 'horizontal' | 'vertical';
  customScale?: number;
  isExport?: boolean;
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
  isExport,
}) => {
  const selectElement = useBannerStore((state) => state.selectElement);
  const selectBanner = useBannerStore((state) => state.selectBanner);
  const selectedElementId = useBannerStore((state) => state.selectedElementId);
  const setOverride = useBannerStore((state) => state.setOverride);
  const isolatedBannerId = useBannerStore((state) => state.isolatedBannerId);
  const setIsolatedBanner = useBannerStore((state) => state.setIsolatedBanner);

  const background = useBannerStore((state) => state.background);
  const logo = useBannerStore((state) => state.logo);
  const cta = useBannerStore((state) => state.cta);

  // Track clicks for triple-click detection
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; w: number; h: number; handle: string; initialX?: number; initialY?: number; initialFontSize?: number }>({ x: 0, y: 0, w: 0, h: 0, handle: '' });
  const [rotateStart, setRotateStart] = useState({ angle: 0, startAngle: 0 });
  const [logoAspectRatio, setLogoAspectRatio] = useState<number>(1);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load logo image to get actual aspect ratio
  useEffect(() => {
    if (logo?.image) {
      const img = new Image();
      img.onload = () => {
        setLogoAspectRatio(img.naturalWidth / img.naturalHeight);
      };
      img.src = logo.image;
    }
  }, [logo?.image]);

  // Scale factor for display
  const scale = customScale ?? Math.min(1, 400 / width);
  const displayWidth = width * scale;
  const displayHeight = height * scale;

  // Calculate logo position and size
  const getLogoLayout = () => {
    if (!logo) return null;

    // Calculate logo size (percentage of banner width)
    const logoWidthPercent = logo.size;
    const logoPixelWidth = (logoWidthPercent / 100) * displayWidth;

    // Use actual aspect ratio from loaded image
    const logoPixelHeight = logoPixelWidth / logoAspectRatio;

    // Calculate padding scaled to display
    const padding = logo.padding * scale;

    // Calculate position based on logo.position
    let left = 0;
    let top = 0;

    switch (logo.position) {
      case 'top-left':
        left = padding;
        top = padding;
        break;
      case 'top-center':
        left = (displayWidth - logoPixelWidth) / 2;
        top = padding;
        break;
      case 'top-right':
        left = displayWidth - logoPixelWidth - padding;
        top = padding;
        break;
      case 'center':
        left = (displayWidth - logoPixelWidth) / 2;
        top = (displayHeight - logoPixelHeight) / 2;
        break;
      case 'bottom-left':
        left = padding;
        top = displayHeight - logoPixelHeight - padding;
        break;
      case 'bottom-center':
        left = (displayWidth - logoPixelWidth) / 2;
        top = displayHeight - logoPixelHeight - padding;
        break;
      case 'bottom-right':
        left = displayWidth - logoPixelWidth - padding;
        top = displayHeight - logoPixelHeight - padding;
        break;
    }

    return {
      left,
      top,
      width: logoPixelWidth,
      height: logoPixelHeight,
    };
  };

  const logoLayout = getLogoLayout();

  // Calculate CTA position and size
  const getCTALayout = () => {
    if (!cta) return null;

    // Calculate CTA size
    const ctaWidthPercent = cta.width;
    const ctaPixelWidth = (ctaWidthPercent / 100) * displayWidth;
    const ctaPixelHeight = cta.height * scale;

    // Calculate padding scaled to display
    const padding = cta.padding * scale;

    // Calculate position based on cta.position
    let left = 0;
    let top = 0;

    switch (cta.position) {
      case 'top-left':
        left = padding;
        top = padding;
        break;
      case 'top-center':
        left = (displayWidth - ctaPixelWidth) / 2;
        top = padding;
        break;
      case 'top-right':
        left = displayWidth - ctaPixelWidth - padding;
        top = padding;
        break;
      case 'center':
        left = (displayWidth - ctaPixelWidth) / 2;
        top = (displayHeight - ctaPixelHeight) / 2;
        break;
      case 'bottom-left':
        left = padding;
        top = displayHeight - ctaPixelHeight - padding;
        break;
      case 'bottom-center':
        left = (displayWidth - ctaPixelWidth) / 2;
        top = displayHeight - ctaPixelHeight - padding;
        break;
      case 'bottom-right':
        left = displayWidth - ctaPixelWidth - padding;
        top = displayHeight - ctaPixelHeight - padding;
        break;
    }

    return {
      left,
      top,
      width: ctaPixelWidth,
      height: ctaPixelHeight,
    };
  };

  const ctaLayout = getCTALayout();

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    selectElement(elementId);
    selectBanner(bannerId);
    setIsDragging(true);

    const el = elements.find(e => e.id === elementId);
    if (el) {
      const layout = calculateElementLayout(el, overrides, width, height, category, scale);
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
    const layout = calculateElementLayout(el, overrides, width, height, category, scale);

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
    const layout = calculateElementLayout(el, overrides, width, height, category, scale);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + layout.pixelX + layout.pixelW / 2;
    const centerY = rect.top + layout.pixelY + layout.pixelH / 2;

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
      const currentLayout = calculateElementLayout(element, overrides, width, height, category, scale);

      if (isDragging) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        const deltaXPercent = (deltaX / displayWidth) * 100;
        const deltaYPercent = (deltaY / displayHeight) * 100;

        setOverride(bannerId, selectedElementId, {
          x: dragStart.initialX + deltaXPercent, // Use dragStart.initialX for base
          y: dragStart.initialY + deltaYPercent  // Use dragStart.initialY for base
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

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
            const totalDeltaY = e.clientY - resizeStart.y;

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

        const layout = calculateElementLayout(element, overrides, width, height, category, scale);
        const centerX = rect.left + layout.pixelX + layout.pixelW / 2;
        const centerY = rect.top + layout.pixelY + layout.pixelH / 2;

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
  }, [isDragging, isResizing, isRotating, dragStart, resizeStart, rotateStart, selectedElementId, bannerId, displayWidth, displayHeight, elements, overrides, setOverride, width, height, category, scale]);



  const getShapeStyle = (shapeType?: string) => {
    switch (shapeType) {
      case 'circle': return { borderRadius: '50%' };
      case 'rounded-rectangle': return { borderRadius: '8px' };
      default: return {};
    }
  };

  const selectedBannerId = useBannerStore((state) => state.selectedBannerId);
  const isSelected = selectedBannerId === bannerId;
  const isIsolated = isolatedBannerId === bannerId;

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
      style={{
        width: displayWidth,
        height: displayHeight,
        border: isExport ? 'none' : isIsolated ? '4px solid #f59e0b' : isMaster ? '3px solid #3b82f6' : isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
        backgroundColor: (background.type === 'solid' ? background.value : undefined) || '#ffffff',
        backgroundImage: background.type === 'gradient'
          ? `linear-gradient(${background.gradientDirection || '90deg'}, ${background.gradientColors?.[0] || '#ffffff'}, ${background.gradientColors?.[1] || '#000000'})`
          : background.type === 'image' ? `url(${background.value})` : undefined,
        backgroundSize: background.type === 'image' ? 'cover' : undefined,
        backgroundPosition: 'center',
        overflow: isSelected && !isExport ? 'visible' : 'hidden',
        zIndex: isSelected ? 50 : 1,
      }}
      className={`bg-white relative select-none ${!isExport ? 'shadow-sm' : ''} ${isIsolated && !isExport ? 'ring-4 ring-amber-500' : isSelected && !isExport ? 'ring-4 ring-blue-100' : ''}`}
      onClick={handleBannerClick}
    >
      {/* Isolated Mode Indicator */}
      {isIsolated && !isExport && (
        <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-bl-md z-[9999] shadow-md">
          ISOLATED MODE
        </div>
      )}

      {elements.map((el, index) => {
        const layout = calculateElementLayout(el, overrides, width, height, category, scale);
        const isElSelected = el.id === selectedElementId && !isExport;
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
                  backgroundColor: layout.mergedStyle.backgroundColor || '#3b82f6',
                  borderRadius: layout.mergedStyle.borderRadius || '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                } : {}),
                cursor: isDragging ? 'grabbing' : 'move',
                boxSizing: 'border-box',
                zIndex: zIndex,
                border: isElSelected && el.type === 'text' ? '1px solid #3b82f6' : '1px dashed transparent',
              }}
              className={isElSelected && el.type === 'text' ? 'group pointer-events-auto ring-4 ring-blue-100' : ''}
            >
              {/* Render Handles for Text if selected */}
              {isElSelected && el.type === 'text' && (
                <>
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-blue-500 cursor-nw-resize pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, 'nw', el.id)} />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-blue-500 cursor-ne-resize pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, 'ne', el.id)} />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-blue-500 cursor-sw-resize pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, 'sw', el.id)} />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-blue-500 cursor-se-resize pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, 'se', el.id)} />

                  {/* Rotation Handle */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-blue-500 pointer-events-auto"></div>
                  <div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border border-blue-500 rounded-full cursor-grab flex items-center justify-center pointer-events-auto"
                    onMouseDown={(e) => handleRotateStart(e, el.id)}
                  >
                    <span className="text-[8px]">↻</span>
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
              {el.type === 'image' && <img src={layout.content} alt="" className="w-full h-full pointer-events-none" style={{ objectFit: 'fill' }} />}
              {el.type === 'button' && (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: layout.mergedStyle.verticalAlign === 'top' ? 'flex-start' : layout.mergedStyle.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                  justifyContent: layout.mergedStyle.textAlign === 'left' ? 'flex-start' : layout.mergedStyle.textAlign === 'right' ? 'flex-end' : 'center',
                  fontSize: `${layout.displayFontSize}px`,
                  fontFamily: layout.mergedStyle.fontFamily,
                  fontWeight: layout.mergedStyle.fontWeight || 'bold',
                  color: layout.mergedStyle.color || '#ffffff',
                  textAlign: (layout.mergedStyle.textAlign as React.CSSProperties['textAlign']) || 'center',
                  padding: `${4 * scale}px ${8 * scale}px`,
                  pointerEvents: 'none',
                }}>
                  {layout.content}
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
                  border: '1px solid #3b82f6',
                  cursor: isDragging ? 'grabbing' : 'move',
                  boxSizing: 'border-box',
                  zIndex: 60, // Above content
                  pointerEvents: 'none',
                }}
                className="group pointer-events-auto"
              >
                {/* Resize Handles */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-blue-500 cursor-nw-resize pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, 'nw', el.id)} />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-blue-500 cursor-ne-resize pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, 'ne', el.id)} />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-blue-500 cursor-sw-resize pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, 'sw', el.id)} />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-blue-500 cursor-se-resize pointer-events-auto" onMouseDown={(e) => handleResizeStart(e, 'se', el.id)} />

                {/* Rotation Handle */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-blue-500 pointer-events-auto"></div>
                <div
                  className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border border-blue-500 rounded-full cursor-grab flex items-center justify-center pointer-events-auto"
                  onMouseDown={(e) => handleRotateStart(e, el.id)}
                >
                  <span className="text-[8px]">↻</span>
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Global Logo - Renders on top of all elements */}
      {logoLayout && logo && (
        <div
          style={{
            position: 'absolute',
            left: logoLayout.left,
            top: logoLayout.top,
            width: logoLayout.width,
            height: logoLayout.height,
            zIndex: 10000, // Always on top
            pointerEvents: 'none', // Don't interfere with element selection
          }}
        >
          <img
            src={logo.image}
            alt="Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      )}

      {/* Global CTA - Renders on top of all elements */}
      {ctaLayout && cta && (() => {
        // Determine background based on animation type
        let background = cta.backgroundColor;
        let backgroundSize = 'auto';

        if (cta.animation === 'colorwave' && cta.colorWaveColors) {
          // For color wave, use a special gradient that animates
          background = `linear-gradient(90deg, ${cta.colorWaveColors[0]}, ${cta.colorWaveColors[1]}, ${cta.colorWaveColors[0]})`;
          backgroundSize = '200% 100%';
        } else if (cta.backgroundType === 'gradient' && cta.gradientColors) {
          background = `linear-gradient(${cta.gradientDirection}, ${cta.gradientColors[0]}, ${cta.gradientColors[1]})`;
        }

        // Determine animation
        let animation = 'none';
        if (cta.animation === 'heartbeat') {
          animation = `cta-heartbeat ${cta.animationSpeed}s ease-in-out infinite`;
        } else if (cta.animation === 'shake') {
          animation = `cta-shake ${cta.animationSpeed}s ease-in-out infinite`;
        } else if (cta.animation === 'colorwave') {
          animation = `cta-colorwave ${cta.animationSpeed}s linear infinite`;
        }

        return (
          <div
            style={{
              position: 'absolute',
              left: ctaLayout.left,
              top: ctaLayout.top,
              width: ctaLayout.width,
              height: ctaLayout.height,
              zIndex: 10001, // On top of logo
              pointerEvents: 'none', // Don't interfere with element selection
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background,
              backgroundSize,
              color: cta.textColor,
              borderRadius: `${cta.borderRadius * scale}px`,
              fontWeight: cta.fontWeight,
              fontSize: `${(cta.fontSize / 100) * ctaLayout.height}px`,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              animation,
            }}
          >
            {cta.text}
          </div>
        );
      })()}
    </div>
  );
};
