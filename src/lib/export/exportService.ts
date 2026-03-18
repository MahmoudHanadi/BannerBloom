import { generateAMP, generateHTML5 } from '../../utils/ampGenerator';
import type { BannerElement, BannerPreset, BannerSize, ExportType, Override } from '../../types/banner';
import { enqueueZipCreation } from './exportQueue';
import { renderBannerToBlob } from './renderBanner';
import type { ExportFile, RenderedBannerAsset } from './types';

const createHtmlBundleFiles = (
  type: 'html5' | 'amp',
  renderedBanner: RenderedBannerAsset,
): ExportFile[] => {
  const html =
    type === 'html5'
      ? generateHTML5(renderedBanner.banner)
      : generateAMP(renderedBanner.banner);

  return [
    { name: 'index.html', content: html },
    { name: 'bg.png', content: renderedBanner.blob },
  ];
};

export const renderSelectedBanners = async ({
  banners,
  elements,
  overrideMap,
}: {
  banners: BannerSize[];
  elements: BannerElement[];
  overrideMap: Record<string, Record<string, Override>>;
}) => {
  const results: RenderedBannerAsset[] = [];

  for (const banner of banners) {
    results.push(
      await renderBannerToBlob({
        banner,
        elements,
        overrides: overrideMap[banner.id],
      }),
    );
  }

  return results;
};

export const packageRenderedBanners = async ({
  preset,
  type,
  renderedBanners,
}: {
  preset: BannerPreset;
  type: ExportType;
  renderedBanners: RenderedBannerAsset[];
}) => {
  if (type === 'png') {
    if (renderedBanners.length === 1) {
      return {
        blob: renderedBanners[0].blob,
        filename: renderedBanners[0].filename,
        perBannerSizes: [{ banner: renderedBanners[0].banner, size: renderedBanners[0].blob.size }],
      };
    }

    const files = renderedBanners.map((renderedBanner) => ({
      name: renderedBanner.filename,
      content: renderedBanner.blob,
    }));
    const blob = await enqueueZipCreation(files);
    return {
      blob,
      filename: `${preset.id}-images.zip`,
      perBannerSizes: renderedBanners.map((renderedBanner) => ({
        banner: renderedBanner.banner,
        size: renderedBanner.blob.size,
      })),
    };
  }

  if (renderedBanners.length === 1) {
    const files = createHtmlBundleFiles(type, renderedBanners[0]);
    const blob = await enqueueZipCreation(files);
    return {
      blob,
      filename: `${renderedBanners[0].banner.name.replace(/\s+/g, '_')}_${type}.zip`,
      perBannerSizes: [{ banner: renderedBanners[0].banner, size: blob.size }],
    };
  }

  const batchFiles: ExportFile[] = [];
  const perBannerSizes: Array<{ banner: BannerSize; size: number }> = [];

  for (const renderedBanner of renderedBanners) {
    const bundleFiles = createHtmlBundleFiles(type, renderedBanner);
    const bundleBlob = await enqueueZipCreation(bundleFiles);
    batchFiles.push({
      name: `${renderedBanner.banner.name.replace(/\s+/g, '_')}_${type}.zip`,
      content: bundleBlob,
    });
    perBannerSizes.push({ banner: renderedBanner.banner, size: bundleBlob.size });
  }

  const blob = await enqueueZipCreation(batchFiles);
  return {
    blob,
    filename: `${preset.id}-${type}-batch.zip`,
    perBannerSizes,
  };
};
