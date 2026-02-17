import type { BannerElement, Override } from '../store/bannerStore';

export interface CalculatedLayout {
    pixelX: number;
    pixelY: number;
    pixelW: number;
    pixelH: number;
    rotation: number;
    content: string;
    displayFontSize: number;
    mergedStyle: React.CSSProperties & { fontFamily?: string };
    x: number;
    y: number;
    w: number;
    h: number;
    aspectRatio?: number;
}

export const masterMetrics = {
    horizontal: { width: 1200, height: 628 },
    square: { width: 1200, height: 1200 },
    vertical: { width: 960, height: 1200 },
};

export const calculateElementLayout = (
    el: BannerElement,
    overrides: Record<string, Override> | undefined,
    bannerWidth: number,
    bannerHeight: number,
    category: 'square' | 'horizontal' | 'vertical',
    scale: number = 1
): CalculatedLayout => {
    const override = overrides?.[el.id];

    // Effective properties
    const props = {
        content: override?.content ?? el.content,
        x: override?.x ?? el.x,
        y: override?.y ?? el.y,
        w: override?.width ?? el.width,
        h: override?.height ?? el.height,
        r: override?.rotation ?? el.rotation ?? 0,
        aspectRatio: override?.aspectRatio ?? el.aspectRatio,
        style: { ...el.style, ...override?.style },
    };

    // Calculate base dimensions from percentages
    let pixelW = (props.w / 100) * bannerWidth;
    let pixelH = (props.h / 100) * bannerHeight;


    // Fix for thin banners: Enforce Master Aspect Ratio if locked
    if (el.aspectRatioLocked) {
        const ar = props.aspectRatio || (el.width / el.height);
        pixelH = pixelW / ar;

        // Check for clamp necessity
        const hasDimOverride = override && (override.width !== undefined || override.height !== undefined);
        const shouldClamp = (!override || override.isAutoPropagated) || !hasDimOverride;

        if (shouldClamp) {
            if (pixelH > bannerHeight) {
                pixelH = bannerHeight;
                pixelW = pixelH * ar;
            }
            if (pixelW > bannerWidth) {
                pixelW = bannerWidth;
                pixelH = pixelW / ar;
            }
        }
    }

    // Smart Anchoring Logic
    const centerXPercent = props.x + props.w / 2;
    const centerYPercent = props.y + props.h / 2;

    let pixelX = 0;
    let pixelY = 0;

    // Horizontal Anchoring
    if (centerXPercent < 33) {
        pixelX = (props.x / 100) * bannerWidth;
    } else if (centerXPercent > 66) {
        const rightGapPercent = 100 - (props.x + props.w);
        const rightGapPixel = (rightGapPercent / 100) * bannerWidth;
        pixelX = bannerWidth - rightGapPixel - pixelW;
    } else {
        const centerOffsetPercent = centerXPercent - 50;
        const centerOffsetPixel = (centerOffsetPercent / 100) * bannerWidth;
        pixelX = (bannerWidth / 2 + centerOffsetPixel) - (pixelW / 2);
    }

    // Vertical Anchoring
    if (centerYPercent < 33) {
        pixelY = (props.y / 100) * bannerHeight;
    } else if (centerYPercent > 66) {
        const bottomGapPercent = 100 - (props.y + props.h);
        const bottomGapPixel = (bottomGapPercent / 100) * bannerHeight;
        pixelY = bannerHeight - bottomGapPixel - pixelH;
    } else {
        const middleOffsetPercent = centerYPercent - 50;
        const middleOffsetPixel = (middleOffsetPercent / 100) * bannerHeight;
        pixelY = (bannerHeight / 2 + middleOffsetPixel) - (pixelH / 2);
    }

    // Font Scaling Logic
    const masterH = masterMetrics[category].height;
    const baseFontSize = parseInt((props.style?.fontSize as string) || '32');
    const responsiveFontSize = (baseFontSize / masterH) * bannerHeight;
    const displayFontSize = responsiveFontSize * scale;

    return {
        pixelX: pixelX * scale,
        pixelY: pixelY * scale,
        pixelW: pixelW * scale,
        pixelH: pixelH * scale,
        rotation: props.r,
        content: props.content,
        displayFontSize,
        mergedStyle: props.style,
        x: props.x,
        y: props.y,
        w: props.w,
        h: props.h,
        aspectRatio: props.aspectRatio,
    };
};
