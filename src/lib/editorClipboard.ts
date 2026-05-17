import type { BannerElement } from '../types/banner';

const BANNERBLOOM_CLIPBOARD_STORAGE_KEY = 'bannerbloom-editor-clipboard-v1';

export const BANNERBLOOM_CLIPBOARD_TEXT_MARKER = '[[BANNERBLOOM_ELEMENT_CLIPBOARD]]';

export interface BannerElementClipboardAsset {
  dataUrl: string;
  mimeType?: string;
  name?: string;
  width?: number;
  height?: number;
}

export interface BannerElementClipboardPayload {
  version: '1.0';
  copiedAt: number;
  sourceProjectName?: string;
  element: Omit<BannerElement, 'id'>;
  asset?: BannerElementClipboardAsset;
}

export const storeBannerElementClipboardPayload = (payload: BannerElementClipboardPayload) => {
  try {
    localStorage.setItem(BANNERBLOOM_CLIPBOARD_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to store BannerBloom clipboard payload.', error);
  }
};

export const readBannerElementClipboardPayload = (): BannerElementClipboardPayload | null => {
  try {
    const rawValue = localStorage.getItem(BANNERBLOOM_CLIPBOARD_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<BannerElementClipboardPayload>;
    if (
      parsedValue.version !== '1.0' ||
      !parsedValue.element ||
      typeof parsedValue.element !== 'object' ||
      typeof parsedValue.copiedAt !== 'number'
    ) {
      return null;
    }

    return parsedValue as BannerElementClipboardPayload;
  } catch (error) {
    console.warn('Failed to read BannerBloom clipboard payload.', error);
    return null;
  }
};

export const isBannerBloomClipboardMarker = (value: string) =>
  value.trim() === BANNERBLOOM_CLIPBOARD_TEXT_MARKER;
