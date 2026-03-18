import type {
  BannerPreset,
  BannerSize,
  ExportType,
  ExportValidationIssue,
} from '../../types/banner';

export interface ExportFile {
  name: string;
  content: Blob | string;
}

export interface RenderedBannerAsset {
  banner: BannerSize;
  blob: Blob;
  filename: string;
}

export interface ExportContext {
  preset: BannerPreset;
  banners: BannerSize[];
  type: ExportType;
}

export interface ExportPreflightResult {
  issues: ExportValidationIssue[];
  canExport: boolean;
}
