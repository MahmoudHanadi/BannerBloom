import type { BannerPreset, BannerPresetId, BannerSize, BannerCategory } from '../types/banner';

const getSizeKey = (size: Pick<BannerSize, 'width' | 'height'>) => `${size.width}x${size.height}`;

const CATEGORY_LABELS: Record<BannerCategory, string> = {
  square: 'Square',
  horizontal: 'Landscape',
  'wide-horizontal': 'Wide Landscape',
  vertical: 'Vertical',
};

const createMaster = (
  id: string,
  name: string,
  width: number,
  height: number,
  category: BannerCategory,
): BannerSize => ({
  id,
  name,
  width,
  height,
  category,
  isMaster: true,
  exportable: false,
  notes: 'Source creative',
});

const createVariant = (
  id: string,
  name: string,
  width: number,
  height: number,
  category: BannerCategory,
  notes?: string,
): BannerSize => ({
  id,
  name,
  width,
  height,
  category,
  exportable: true,
  notes,
});

const googleUploadedDisplayStandardSizes: BannerSize[] = [
  createVariant('google-upload-small-square', 'Small Square 200x200', 200, 200, 'square'),
  createVariant('google-upload-vertical-rectangle', 'Vertical Rectangle 240x400', 240, 400, 'vertical'),
  createVariant('google-upload-square-250', 'Square 250x250', 250, 250, 'square'),
  createVariant('google-upload-triple-widescreen', 'Triple Widescreen 250x360', 250, 360, 'vertical'),
  createVariant('google-upload-inline-rectangle', 'Inline Rectangle 300x250', 300, 250, 'horizontal'),
  createVariant('google-upload-large-rectangle', 'Large Rectangle 336x280', 336, 280, 'horizontal'),
  createVariant('google-upload-netboard', 'Netboard 580x400', 580, 400, 'horizontal'),
  createVariant('google-upload-skyscraper', 'Skyscraper 120x600', 120, 600, 'vertical'),
  createVariant('google-upload-wide-skyscraper', 'Wide Skyscraper 160x600', 160, 600, 'vertical'),
  createVariant('google-upload-half-page', 'Half Page 300x600', 300, 600, 'vertical'),
  createVariant('google-upload-portrait', 'Portrait 300x1050', 300, 1050, 'vertical'),
  createVariant('google-upload-banner', 'Banner 468x60', 468, 60, 'wide-horizontal'),
  createVariant('google-upload-leaderboard', 'Leaderboard 728x90', 728, 90, 'wide-horizontal'),
  createVariant('google-upload-top-banner', 'Top Banner 930x180', 930, 180, 'wide-horizontal'),
  createVariant('google-upload-large-leaderboard', 'Large Leaderboard 970x90', 970, 90, 'wide-horizontal'),
  createVariant('google-upload-billboard', 'Billboard 970x250', 970, 250, 'wide-horizontal'),
  createVariant('google-upload-panorama', 'Panorama 980x120', 980, 120, 'wide-horizontal'),
  createVariant('google-upload-mobile-banner-300', 'Mobile Banner 300x50', 300, 50, 'wide-horizontal'),
  createVariant('google-upload-mobile-banner-320', 'Mobile Banner 320x50', 320, 50, 'wide-horizontal'),
  createVariant('google-upload-large-mobile-banner', 'Large Mobile Banner 320x100', 320, 100, 'wide-horizontal'),
];

const googleAdsUploadSizes: BannerSize[] = [
  createMaster('google-upload-master-horizontal', 'Source Landscape (1.91:1)', 1200, 628, 'horizontal'),
  createVariant('google-upload-horizontal-min', 'Landscape Min 600x314', 600, 314, 'horizontal', 'Minimum'),
  createMaster(
    'google-upload-master-wide-horizontal',
    'Source Wide Landscape (970x250)',
    970,
    250,
    'wide-horizontal',
  ),
  createMaster('google-upload-master-square', 'Source Square (1:1)', 1200, 1200, 'square'),
  createVariant('google-upload-square-min', 'Square Min 300x300', 300, 300, 'square', 'Minimum'),
  createMaster('google-upload-master-vertical', 'Source Vertical (4:5)', 960, 1200, 'vertical'),
  createVariant('google-upload-vertical-min', 'Vertical Min 480x600', 480, 600, 'vertical', 'Minimum'),
  createVariant('google-upload-vertical-9x16', 'Vertical 900x1600', 900, 1600, 'vertical', '9:16'),
  createVariant('google-upload-amp-portrait', 'AMP Size 320x480', 320, 480, 'vertical', 'AMP'),
  createVariant('google-upload-amp-landscape', 'AMP Size 480x320', 480, 320, 'horizontal', 'AMP'),
  ...googleUploadedDisplayStandardSizes,
];

const googleResponsiveDisplaySizes: BannerSize[] = [
  createMaster('google-rda-master-horizontal', 'Source Landscape 1.91:1', 1200, 628, 'horizontal'),
  createVariant(
    'google-rda-horizontal-recommended',
    'Landscape 1200x628',
    1200,
    628,
    'horizontal',
    'Recommended',
  ),
  createVariant(
    'google-rda-horizontal-min',
    'Landscape Min 600x314',
    600,
    314,
    'horizontal',
    'Minimum',
  ),
  createMaster('google-rda-master-square', 'Source Square 1:1', 1200, 1200, 'square'),
  createVariant(
    'google-rda-square-recommended',
    'Square 1200x1200',
    1200,
    1200,
    'square',
    'Recommended',
  ),
  createVariant('google-rda-square-min', 'Square Min 300x300', 300, 300, 'square', 'Minimum'),
  createMaster('google-rda-master-vertical', 'Source Vertical 9:16', 900, 1600, 'vertical'),
  createVariant(
    'google-rda-vertical-recommended',
    'Vertical 900x1600',
    900,
    1600,
    'vertical',
    'Optional',
  ),
  createVariant(
    'google-rda-vertical-min',
    'Vertical Min 600x1067',
    600,
    1067,
    'vertical',
    'Optional minimum',
  ),
];

const metaSocialSizes: BannerSize[] = [
  createMaster('meta-master-horizontal', 'Source Landscape', 1200, 628, 'horizontal'),
  createVariant('meta-landscape-feed', 'Landscape 1200x628', 1200, 628, 'horizontal'),
  createMaster('meta-master-square', 'Source Square', 1080, 1080, 'square'),
  createVariant('meta-square-feed', 'Square Feed 1080x1080', 1080, 1080, 'square'),
  createMaster('meta-master-vertical', 'Source Vertical', 1080, 1920, 'vertical'),
  createVariant('meta-feed-portrait', 'Feed Portrait 1080x1350', 1080, 1350, 'vertical'),
  createVariant('meta-story-reel', 'Story/Reel 1080x1920', 1080, 1920, 'vertical'),
];

const createGlobalPresetSizes = (...presetGroups: BannerSize[][]): BannerSize[] => {
  const flattened = presetGroups.flat();
  const firstMasterByCategory = new Map<BannerCategory, BannerSize>();

  for (const size of flattened) {
    if (size.isMaster && !firstMasterByCategory.has(size.category)) {
      firstMasterByCategory.set(size.category, size);
    }
  }

  const globalMasters = (
    ['square', 'horizontal', 'wide-horizontal', 'vertical'] as const
  ).map((category) => {
    const source = firstMasterByCategory.get(category);
    if (!source) {
      throw new Error(`Missing source size for ${category} global preset group.`);
    }

    return createMaster(
      `web-app-global-master-${category}`,
      `Global Source ${CATEGORY_LABELS[category]}`,
      source.width,
      source.height,
      category,
    );
  });

  const seenSizeKeys = new Set(globalMasters.map(getSizeKey));
  const variants: BannerSize[] = [];

  for (const size of flattened) {
    const key = getSizeKey(size);
    if (seenSizeKeys.has(key)) {
      continue;
    }

    seenSizeKeys.add(key);
    variants.push(
      createVariant(
        `web-app-global-${size.category}-${size.width}x${size.height}`,
        `${CATEGORY_LABELS[size.category]} ${size.width}x${size.height}`,
        size.width,
        size.height,
        size.category,
        size.notes ?? (size.isMaster ? 'Source size from another preset' : undefined),
      ),
    );
  }

  return [...globalMasters, ...variants];
};

const webAppGlobalSizes = createGlobalPresetSizes(
  googleAdsUploadSizes,
  googleResponsiveDisplaySizes,
  metaSocialSizes,
);

export const bannerPresets: Record<BannerPresetId, BannerPreset> = {
  'google-ads-upload': {
    id: 'google-ads-upload',
    name: 'Google Ads Upload',
    description:
      'Google uploaded-display source canvases plus approved standard display, mobile, and AMP-friendly sizes.',
    supportedExportTypes: ['png', 'html5', 'amp'],
    validationProfile: 'google-upload',
    bannerSizes: googleAdsUploadSizes,
  },
  'google-responsive-display': {
    id: 'google-responsive-display',
    name: 'Google Responsive Display',
    description:
      'Responsive display image assets with source canvases for landscape, square, and optional vertical placements.',
    supportedExportTypes: ['png'],
    validationProfile: 'google-responsive-display',
    bannerSizes: googleResponsiveDisplaySizes,
  },
  'meta-social': {
    id: 'meta-social',
    name: 'Meta Social',
    description:
      'Common feed, story, and landscape placements with reusable source canvases for Meta campaigns.',
    supportedExportTypes: ['png'],
    validationProfile: 'meta-social',
    bannerSizes: metaSocialSizes,
  },
  'web-app-global': {
    id: 'web-app-global',
    name: 'Web App Global',
    description:
      'A global library of every unique size currently available across the app, grouped under shared source canvases.',
    supportedExportTypes: ['png'],
    validationProfile: 'web-app-global',
    bannerSizes: webAppGlobalSizes,
  },
};

export const defaultBannerPresetId: BannerPresetId = 'google-ads-upload';

export const getBannerPreset = (presetId: BannerPresetId) => bannerPresets[presetId];

export const getBannerSizesForPreset = (presetId: BannerPresetId) =>
  getBannerPreset(presetId).bannerSizes.map((size) => ({ ...size }));

export const normalizeBannerSizesForPreset = (
  presetId: BannerPresetId,
  bannerSizes: BannerSize[],
): BannerSize[] => {
  if (!bannerSizes.length) {
    return getBannerSizesForPreset(presetId);
  }

  const presetSizes = getBannerPreset(presetId).bannerSizes;
  const presetSizeByName = new Map(presetSizes.map((size) => [size.name, size]));
  const presetSizeByDimensions = new Map(presetSizes.map((size) => [getSizeKey(size), size]));

  return bannerSizes.map((size) => {
    const normalizedName = size.name.toLowerCase();
    const inferredIsMaster =
      size.isMaster ?? (normalizedName.includes('master') || normalizedName.includes('source'));
    const matchedSize =
      presetSizeByName.get(size.name) ??
      presetSizeByDimensions.get(getSizeKey(size)) ??
      (inferredIsMaster
        ? presetSizes.find((candidate) => candidate.isMaster && candidate.category === size.category)
        : undefined);

    if (!matchedSize) {
      return {
        ...size,
        exportable: size.exportable ?? !inferredIsMaster,
        isMaster: inferredIsMaster,
      };
    }

    return {
      ...size,
      name: matchedSize.name,
      category: matchedSize.category,
      isMaster: matchedSize.isMaster,
      exportable: matchedSize.exportable,
      notes: matchedSize.notes,
    };
  });
};

export const getCategoryMasterSize = (
  bannerSizes: BannerSize[],
  category: BannerCategory,
): BannerSize | undefined =>
  bannerSizes.find((size) => size.category === category && size.isMaster);
