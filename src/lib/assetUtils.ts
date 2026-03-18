import { v4 as uuidv4 } from 'uuid';
import type { EditorAsset } from '../types/banner';

const loadImageDimensions = (src: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error('Failed to read image dimensions.'));
    image.src = src;
  });

export const createEditorAssetFromBlob = async (
  blob: Blob,
  options?: { id?: string; name?: string },
): Promise<EditorAsset> => {
  const src = URL.createObjectURL(blob);
  let dimensions: { width?: number; height?: number } = {};

  if (blob.type.startsWith('image/')) {
    try {
      dimensions = await loadImageDimensions(src);
    } catch {
      dimensions = {};
    }
  }

  return {
    id: options?.id ?? uuidv4(),
    src,
    blob,
    name: options?.name,
    mimeType: blob.type || undefined,
    width: dimensions.width,
    height: dimensions.height,
  };
};

export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return response.blob();
};

export const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to convert blob to data URL.'));
    reader.readAsDataURL(blob);
  });

export const revokeEditorAsset = (asset: EditorAsset) => {
  URL.revokeObjectURL(asset.src);
};

export const isObjectUrl = (value: string) => value.startsWith('blob:');
export const isDataUrl = (value: string) => value.startsWith('data:');
