import { v4 as uuidv4 } from 'uuid';
import type {
  BannerCategory,
  BannerPreset,
  BannerSize,
  ExportType,
  ExportValidationIssue,
  ExportValidationIssueCode,
} from '../../types/banner';

const GOOGLE_RESPONSIVE_REQUIRED_CATEGORIES: BannerCategory[] = ['horizontal', 'square'];

const createIssue = (
  level: ExportValidationIssue['level'],
  message: string,
  code?: ExportValidationIssueCode,
  bannerId?: string,
): ExportValidationIssue => ({
  id: uuidv4(),
  level,
  message,
  bannerId,
  code,
});

const getBannerDimensionsKey = (banner: BannerSize) => `${banner.width}x${banner.height}`;

const getPresetAllowedSizeSet = (preset: BannerPreset) =>
  new Set(preset.bannerSizes.map(getBannerDimensionsKey));

export const validateExportSelection = (
  preset: BannerPreset,
  banners: BannerSize[],
  type: ExportType,
): ExportValidationIssue[] => {
  const issues: ExportValidationIssue[] = [];

  if (!preset.supportedExportTypes.includes(type)) {
    issues.push(
      createIssue(
        'error',
        `${preset.name} only supports ${preset.supportedExportTypes.join(', ')} exports.`,
        'unsupported-export',
      ),
    );
  }

  if (preset.validationProfile === 'google-upload') {
    const allowedSizeSet = getPresetAllowedSizeSet(preset);

    for (const banner of banners) {
      if (!allowedSizeSet.has(getBannerDimensionsKey(banner))) {
        issues.push(
          createIssue(
            'error',
            `${banner.name} is not in the configured Google Ads export size set for this preset.`,
            'invalid-banner-size',
            banner.id,
          ),
        );
      }
    }

    if (type === 'html5' || type === 'amp') {
      issues.push(
        createIssue(
          'info',
          'Google Ads HTML5 upload access is account-gated. Validate account eligibility before relying on this export path.',
          'html5-account-gated',
        ),
      );
      issues.push(
        createIssue(
          'warning',
          'This exporter packages a flat rendered image inside an HTML/AMP wrapper. It is not a layered interactive creative workflow.',
          'flat-image-wrapper',
        ),
      );
    }
  }

  if (preset.validationProfile === 'google-responsive-display' && type !== 'png') {
    issues.push(
      createIssue(
        'error',
        'Responsive Display presets should export image assets, not HTML5 or AMP bundles.',
        'responsive-image-only',
      ),
    );
  }

  if (preset.validationProfile === 'google-responsive-display') {
    const allowedSizeSet = getPresetAllowedSizeSet(preset);
    const availableCategories = new Set(banners.map((banner) => banner.category));

    for (const banner of banners) {
      if (!allowedSizeSet.has(getBannerDimensionsKey(banner))) {
        issues.push(
          createIssue(
            'error',
            `${banner.name} is not in the current Google Responsive Display image size set.`,
            'invalid-banner-size',
            banner.id,
          ),
        );
      }
    }

    for (const category of GOOGLE_RESPONSIVE_REQUIRED_CATEGORIES) {
      if (!availableCategories.has(category)) {
        issues.push(
          createIssue(
            'warning',
            'Google Responsive Display exports should include at least one landscape and one square image.',
            'responsive-missing-category',
          ),
        );
        break;
      }
    }

    const hasRecommendedLandscape = banners.some(
      (banner) => getBannerDimensionsKey(banner) === '1200x628',
    );
    const hasRecommendedSquare = banners.some(
      (banner) => getBannerDimensionsKey(banner) === '1200x1200',
    );

    if (!hasRecommendedLandscape || !hasRecommendedSquare) {
      issues.push(
        createIssue(
          'warning',
          'Use 1200x628 landscape and 1200x1200 square assets when possible. Minimum sizes are valid but less flexible.',
          'responsive-recommended-size',
        ),
      );
    }
  }

  if (preset.validationProfile === 'meta-social' && type !== 'png') {
    issues.push(
      createIssue('error', 'Meta preset exports should stay image-only.', 'meta-image-only'),
    );
  }

  return issues;
};

export const validateGeneratedArtifact = (
  preset: BannerPreset,
  type: ExportType,
  banner: BannerSize,
  sizeInBytes: number,
): ExportValidationIssue[] => {
  const issues: ExportValidationIssue[] = [];

  if (preset.validationProfile === 'google-upload' && type === 'png' && sizeInBytes > 150 * 1024) {
    issues.push(
      createIssue(
        'error',
        `${banner.name} PNG is ${Math.round(sizeInBytes / 1024)}KB. Google image ads must stay at or below 150KB.`,
        'size-limit',
        banner.id,
      ),
    );
  }

  if (
    preset.validationProfile === 'google-responsive-display' &&
    type === 'png' &&
    sizeInBytes > 5 * 1024 * 1024
  ) {
    issues.push(
      createIssue(
        'error',
        `${banner.name} PNG is ${Math.round(sizeInBytes / 1024)}KB. Google Responsive Display images must stay at or below 5120KB.`,
        'size-limit',
        banner.id,
      ),
    );
  }

  if (
    preset.validationProfile === 'google-upload' &&
    (type === 'html5' || type === 'amp') &&
    sizeInBytes > 600 * 1024
  ) {
    issues.push(
      createIssue(
        'error',
        `${banner.name} ${type.toUpperCase()} ZIP is ${Math.round(sizeInBytes / 1024)}KB. Google uploaded display bundles must stay at or below 600KB.`,
        'size-limit',
        banner.id,
      ),
    );
  }

  return issues;
};

export const isSizeLimitIssue = (issue: ExportValidationIssue) => issue.code === 'size-limit';
