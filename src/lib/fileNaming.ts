import type { BannerSize, ExportType } from '../types/banner';

const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;
const EDGE_TRIM_PATTERN = /^[.\s_]+|[.\s_]+$/g;
const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const DEFAULT_CAMPAIGN_FILE_BASENAME = 'Untitled_Campaign';

export const sanitizeFilenameSegment = (
  value: string,
  fallback = DEFAULT_CAMPAIGN_FILE_BASENAME,
) => {
  const sanitized = value
    .trim()
    .replace(INVALID_FILENAME_CHARS, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(EDGE_TRIM_PATTERN, '');

  if (!sanitized || WINDOWS_RESERVED_NAME.test(sanitized)) {
    return fallback;
  }

  return sanitized;
};

export const getCampaignFilenameBase = (projectName: string) =>
  sanitizeFilenameSegment(projectName);

export const getBannerExportStem = (
  projectName: string,
  banner: Pick<BannerSize, 'width' | 'height'>,
) => `${getCampaignFilenameBase(projectName)}_${banner.width}x${banner.height}`;

export const getBannerImageFilename = (
  projectName: string,
  banner: Pick<BannerSize, 'width' | 'height'>,
) => `${getBannerExportStem(projectName, banner)}.png`;

export const getBundleExportFilename = (
  projectName: string,
  banner: Pick<BannerSize, 'width' | 'height'>,
  type: Extract<ExportType, 'html5' | 'amp'>,
) => `${getBannerExportStem(projectName, banner)}_${type}.zip`;

export const getBatchExportFilename = (projectName: string, type: ExportType) =>
  `${getCampaignFilenameBase(projectName)}_${type}_batch.zip`;

export const getBackupFilename = (projectName: string, date = new Date()) =>
  `${getCampaignFilenameBase(projectName)}_backup_${date.toISOString().slice(0, 10)}.bsp`;
