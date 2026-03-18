import type React from 'react';

export type ElementType = 'text' | 'image' | 'shape' | 'button';
export type BannerCategory = 'square' | 'horizontal' | 'vertical';
export type ExportType = 'png' | 'html5' | 'amp';
export type BannerPresetId =
  | 'google-ads-upload'
  | 'google-responsive-display'
  | 'meta-social';

export interface BannerElement {
  id: string;
  type: ElementType;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  aspectRatioLocked: boolean;
  aspectRatio?: number;
  shapeType?: 'rectangle' | 'circle' | 'rounded-rectangle';
  style?: React.CSSProperties & { fontFamily?: string };
}

export interface Override {
  content?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  scale?: number;
  aspectRatio?: number;
  style?: React.CSSProperties & { fontFamily?: string };
  isAutoPropagated?: boolean;
}

export interface BannerSize {
  id: string;
  name: string;
  width: number;
  height: number;
  category: BannerCategory;
  isMaster?: boolean;
  exportable?: boolean;
  notes?: string;
}

export interface BackgroundConfig {
  type: 'solid' | 'gradient' | 'image';
  value: string;
  gradientType?: 'linear' | 'radial';
  gradientColors?: string[];
  gradientDirection?: string;
}

export type LogoPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface LogoConfig {
  image: string;
  position: LogoPosition;
  size: number;
  padding: number;
}

export type CTAPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'free-form';

export type CTAAnimation = 'none' | 'heartbeat' | 'shake' | 'colorwave';

export interface CTAConfig {
  text: string;
  position: CTAPosition;
  x?: number;
  y?: number;
  width: number;
  height: number;
  borderRadius: number;
  backgroundColor: string;
  backgroundType: 'solid' | 'gradient';
  gradientColors?: [string, string];
  gradientDirection?: string;
  textColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'bolder';
  padding: number;
  animation: CTAAnimation;
  animationSpeed: number;
  colorWaveColors?: [string, string];
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  lastModified: number;
  folderId?: string | null;
  thumbnail?: string;
  bannerPresetId: BannerPresetId;
  elementCount?: number;
}

export interface SavedProject extends ProjectSummary {
  elements: BannerElement[];
  overrides: Record<string, Record<string, Override>>;
  bannerSizes: BannerSize[];
  background: BackgroundConfig;
  logo: LogoConfig | null;
  cta: CTAConfig | null;
}

export interface EditorAsset {
  id: string;
  src: string;
  blob: Blob;
  name?: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface BannerPreset {
  id: BannerPresetId;
  name: string;
  description: string;
  bannerSizes: BannerSize[];
  supportedExportTypes: ExportType[];
  validationProfile: 'google-upload' | 'google-responsive-display' | 'meta-social';
}

export type ExportValidationIssueCode =
  | 'unsupported-export'
  | 'design-master'
  | 'invalid-banner-size'
  | 'html5-account-gated'
  | 'flat-image-wrapper'
  | 'responsive-image-only'
  | 'responsive-missing-category'
  | 'responsive-recommended-size'
  | 'meta-image-only'
  | 'size-limit'
  | 'runtime-error';

export interface ExportValidationIssue {
  id: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  bannerId?: string;
  code?: ExportValidationIssueCode;
}
