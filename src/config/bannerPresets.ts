import type { BannerPreset, BannerPresetId, BannerSize, BannerCategory } from '../types/banner';

const getSizeKey = (size: Pick<BannerSize, 'width' | 'height'>) => `${size.width}x${size.height}`;

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

export const bannerPresets: Record<BannerPresetId, BannerPreset> = {
  'google-ads-upload': {
    id: 'google-ads-upload',
    name: 'Google Ads Upload',
    description: 'Current Google Ads source, minimum, and AMP export sizes with non-exported source canvases.',
    supportedExportTypes: ['png', 'html5', 'amp'],
    validationProfile: 'google-upload',
    bannerSizes: [
      createMaster('google-upload-master-horizontal', 'Source Landscape (1.91:1)', 1200, 628, 'horizontal'),
      createVariant('google-upload-horizontal-min', 'Landscape Min 600x314', 600, 314, 'horizontal', 'Minimum'),
      createMaster('google-upload-master-square', 'Source Square (1:1)', 1200, 1200, 'square'),
      createVariant('google-upload-square-min', 'Square Min 300x300', 300, 300, 'square', 'Minimum'),
      createMaster('google-upload-master-vertical', 'Source Vertical (4:5)', 960, 1200, 'vertical'),
      createVariant('google-upload-vertical-min', 'Vertical Min 480x600', 480, 600, 'vertical', 'Minimum'),
      createVariant('google-upload-vertical-9x16', 'Vertical 900x1600', 900, 1600, 'vertical', '9:16'),
      createVariant('google-upload-amp-portrait', 'AMP Size 320x480', 320, 480, 'vertical', 'AMP'),
      createVariant('google-upload-amp-landscape', 'AMP Size 480x320', 480, 320, 'horizontal', 'AMP'),
    ],
  },
  'google-responsive-display': {
    id: 'google-responsive-display',
    name: 'Google Responsive Display',
    description: 'Responsive display image assets with source canvases for landscape, square, and optional vertical placements.',
    supportedExportTypes: ['png'],
    validationProfile: 'google-responsive-display',
    bannerSizes: [
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
      createVariant(
        'google-rda-square-min',
        'Square Min 300x300',
        300,
        300,
        'square',
        'Minimum',
      ),
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
    ],
  },
  'meta-social': {
    id: 'meta-social',
    name: 'Meta Social',
    description: 'Common feed, story, and landscape placements with reusable source canvases for Meta campaigns.',
    supportedExportTypes: ['png'],
    validationProfile: 'meta-social',
    bannerSizes: [
      createMaster('meta-master-horizontal', 'Source Landscape', 1200, 628, 'horizontal'),
      createVariant('meta-landscape-feed', 'Landscape 1200x628', 1200, 628, 'horizontal'),
      createMaster('meta-master-square', 'Source Square', 1080, 1080, 'square'),
      createVariant('meta-square-feed', 'Square Feed 1080x1080', 1080, 1080, 'square'),
      createMaster('meta-master-vertical', 'Source Vertical', 1080, 1920, 'vertical'),
      createVariant('meta-feed-portrait', 'Feed Portrait 1080x1350', 1080, 1350, 'vertical'),
      createVariant('meta-story-reel', 'Story/Reel 1080x1920', 1080, 1920, 'vertical'),
    ],
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
