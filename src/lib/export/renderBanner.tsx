import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';
import type { BannerElement, BannerSize, Override } from '../../types/banner';
import { BannerRenderer } from '../../components/BannerRenderer';
import type { RenderedBannerAsset } from './types';

const waitForImages = async (container: HTMLElement) => {
  const imageElements = [...container.querySelectorAll<HTMLImageElement>('img')];
  await Promise.all(
    imageElements.map(async (image) => {
      if (image.complete) return;
      await image.decode().catch(() => undefined);
    }),
  );
};

const nextFrame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

export const renderBannerToBlob = async ({
  banner,
  elements,
  overrides,
}: {
  banner: BannerSize;
  elements: BannerElement[];
  overrides?: Record<string, Override>;
}): Promise<RenderedBannerAsset> => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '-10000px';
  container.style.width = `${banner.width}px`;
  container.style.height = `${banner.height}px`;
  container.style.backgroundColor = '#ffffff';
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    root.render(
      <BannerRenderer
        bannerId={banner.id}
        width={banner.width}
        height={banner.height}
        elements={elements}
        overrides={overrides}
        isMaster={banner.isMaster}
        category={banner.category}
        customScale={1}
        isExport={true}
      />,
    );

    await nextFrame();
    await nextFrame();

    if ('fonts' in document) {
      await (document as Document & { fonts: FontFaceSet }).fonts.ready;
    }

    await waitForImages(container);

    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 1,
      useCORS: true,
      logging: false,
      allowTaint: true,
      width: banner.width,
      height: banner.height,
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) {
          resolve(value);
        } else {
          reject(new Error(`Failed to convert ${banner.name} canvas to PNG.`));
        }
      }, 'image/png');
    });

    return {
      banner,
      blob,
      filename: `${banner.name.replace(/\s+/g, '_')}_${banner.width}x${banner.height}.png`,
    };
  } finally {
    root.unmount();
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};
