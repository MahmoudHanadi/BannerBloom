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

export const calculateElementLayout = (
    el: BannerElement,
    overrides: Record<string, Override> | undefined,
    bannerWidth: number,
    bannerHeight: number,
    _category: 'square' | 'horizontal' | 'vertical',
    scale: number = 1,
    masterHeight: number = bannerHeight,
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

    // Continuous Smart Anchoring Logic
    // Eliminates the 33% / 66% threshold jumps by interpolating the anchor factor
    const centerXPercent = props.x + props.w / 2;
    const centerYPercent = props.y + props.h / 2;

    const baseX = (props.x / 100) * bannerWidth;
    const baseY = (props.y / 100) * bannerHeight;

    const baseW = (props.w / 100) * bannerWidth;
    const baseH = (props.h / 100) * bannerHeight;

    const deltaW = baseW - pixelW;
    const deltaH = baseH - pixelH;

    const anchorFactorX = Math.max(0, Math.min(1, centerXPercent / 100));
    const anchorFactorY = Math.max(0, Math.min(1, centerYPercent / 100));

    const pixelX = baseX + anchorFactorX * deltaW;
    const pixelY = baseY + anchorFactorY * deltaH;

    // Font Scaling Logic
    const baseFontSize = parseInt((props.style?.fontSize as string) || '32');
    const responsiveFontSize = (baseFontSize / masterHeight) * bannerHeight;
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
