import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';
import type { BannerElement, BannerSize, Override } from '../../types/banner';
import { BannerRenderer } from '../../components/BannerRenderer';
import { getCategoryMasterSize } from '../../config/bannerPresets';
import { getBannerImageFilename } from '../fileNaming';
import { useBannerStore } from '../../store/bannerStore';
import { calculateElementLayout } from '../../utils/layoutUtils';
import type { RenderedBannerAsset } from './types';

const EXPORT_FONT_IMPORT =
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap';

const EXPORT_FRAME_STYLE = `
  @import url('${EXPORT_FONT_IMPORT}');

  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
  }

  body {
    font-family: Manrope, "Segoe UI", sans-serif;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }
`;

const extractBackgroundImageUrls = (value: string) =>
  [...value.matchAll(/url\((['"]?)(.*?)\1\)/g)].map((match) => match[2]).filter(Boolean);

const waitForImages = async (container: HTMLElement) => {
  const ownerWindow = container.ownerDocument.defaultView ?? window;
  const imageElements = [...container.querySelectorAll<HTMLImageElement>('img')];
  const backgroundImageUrls = [container, ...container.querySelectorAll<HTMLElement>('*')]
    .flatMap((element) =>
      extractBackgroundImageUrls(ownerWindow.getComputedStyle(element).backgroundImage),
    )
    .filter((url, index, urls) => urls.indexOf(url) === index);

  await Promise.all(
    imageElements.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete && image.naturalWidth > 0) {
            resolve();
            return;
          }

          const cleanup = () => {
            image.removeEventListener('load', handleLoad);
            image.removeEventListener('error', handleLoad);
          };
          const handleLoad = () => {
            cleanup();
            resolve();
          };

          image.addEventListener('load', handleLoad, { once: true });
          image.addEventListener('error', handleLoad, { once: true });
          image.decode().then(handleLoad).catch(() => undefined);
        }),
    ),
  );

  await Promise.all(
    backgroundImageUrls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const image = new ownerWindow.Image();
          image.crossOrigin = 'anonymous';
          image.onload = () => resolve();
          image.onerror = () => resolve();
          image.src = url;

          if (image.complete) {
            resolve();
          }
        }),
    ),
  );
};

const nextFrame = (targetWindow: Window = window) =>
  new Promise<void>((resolve) => {
    targetWindow.requestAnimationFrame(() => resolve());
  });

const getButtonTextFont = (
  style: BannerElement['style'],
  fontSize: number,
) => {
  const fontStyle = style?.fontStyle ? `${style.fontStyle} ` : '';
  const fontWeight = style?.fontWeight ? `${style.fontWeight} ` : 'bold ';
  const fontFamily = style?.fontFamily || 'Inter';
  return `${fontStyle}${fontWeight}${fontSize}px ${fontFamily}`;
};

const wrapButtonText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) => {
  const lines: string[] = [];
  const segments = text.split(/\r?\n/);

  for (const segment of segments) {
    const trimmedSegment = segment.trim();
    if (!trimmedSegment) {
      lines.push('');
      continue;
    }

    const words = trimmedSegment.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (!currentLine || context.measureText(candidate).width <= maxWidth) {
        currentLine = candidate;
        continue;
      }

      lines.push(currentLine);
      currentLine = word;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines.length > 0 ? lines : [''];
};

const drawButtonTextOverlay = ({
  canvas,
  banner,
  elements,
  overrides,
}: {
  canvas: HTMLCanvasElement;
  banner: BannerSize;
  elements: BannerElement[];
  overrides?: Record<string, Override>;
}) => {
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  const bannerSizes = useBannerStore.getState().bannerSizes;
  const masterHeight = getCategoryMasterSize(bannerSizes, banner.category)?.height ?? banner.height;
  const buttonElements = elements.filter((element) => element.type === 'button');

  for (const element of buttonElements) {
    const layout = calculateElementLayout(
      element,
      overrides,
      banner.width,
      banner.height,
      banner.category,
      1,
      masterHeight,
    );
    const fontSize = layout.displayFontSize;
    const paddingX = 8;
    const paddingY = 4;
    const textBoxX = layout.pixelX + paddingX;
    const textBoxWidth = Math.max(0, layout.pixelW - paddingX * 2);
    const textBoxHeight = layout.pixelH;
    const textAlign = (layout.mergedStyle.textAlign as CanvasTextAlign | undefined) || 'center';
    const verticalAlign = (layout.mergedStyle.verticalAlign as string | undefined) || 'middle';

    if (textBoxWidth <= 0 || textBoxHeight <= 0) {
      continue;
    }

    context.save();
    context.translate(layout.pixelX + layout.pixelW / 2, layout.pixelY + layout.pixelH / 2);
    context.rotate((layout.rotation * Math.PI) / 180);
    context.translate(-(layout.pixelX + layout.pixelW / 2), -(layout.pixelY + layout.pixelH / 2));
    context.beginPath();
    context.rect(layout.pixelX, layout.pixelY, layout.pixelW, layout.pixelH);
    context.clip();
    context.font = getButtonTextFont(layout.mergedStyle, fontSize);
    context.fillStyle = String(layout.mergedStyle.color || '#ffffff');
    context.textAlign = textAlign;
    context.textBaseline = 'top';
    context.direction = (layout.mergedStyle.direction as CanvasDirection | undefined) || 'ltr';

    const lines = wrapButtonText(context, layout.content, textBoxWidth);
    const lineHeight = Math.max(fontSize, fontSize * 1.05);
    const textBlockHeight = lines.length * lineHeight;
    const startY =
      verticalAlign === 'top'
        ? layout.pixelY + paddingY
        : verticalAlign === 'bottom'
          ? layout.pixelY + layout.pixelH - paddingY - textBlockHeight
          : layout.pixelY + (layout.pixelH - textBlockHeight) / 2;
    const x =
      textAlign === 'left'
        ? textBoxX
        : textAlign === 'right'
          ? layout.pixelX + layout.pixelW - paddingX
          : layout.pixelX + layout.pixelW / 2;

    lines.forEach((line, index) => {
      context.fillText(line, x, startY + index * lineHeight);
    });
    context.restore();
  }
};

const canvasToBlob = (canvas: HTMLCanvasElement, bannerName: string) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) {
        resolve(value);
      } else {
        reject(new Error(`Failed to convert ${bannerName} canvas to PNG.`));
      }
      }, 'image/png');
  });

const createExportFrame = (banner: BannerSize) => {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.tabIndex = -1;
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = `${banner.width}px`;
  iframe.style.height = `${banner.height}px`;
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDocument = frameWindow?.document;

  if (!frameWindow || !frameDocument) {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
    throw new Error(`Failed to initialize export frame for ${banner.name}.`);
  }

  frameDocument.open();
  frameDocument.write(`<!DOCTYPE html><html><head><meta charset="utf-8" /><style>${EXPORT_FRAME_STYLE}</style></head><body></body></html>`);
  frameDocument.close();

  frameDocument.body.style.width = `${banner.width}px`;
  frameDocument.body.style.height = `${banner.height}px`;

  const mountElement = frameDocument.createElement('div');
  mountElement.style.width = `${banner.width}px`;
  mountElement.style.height = `${banner.height}px`;
  mountElement.style.backgroundColor = '#ffffff';
  mountElement.style.overflow = 'hidden';
  frameDocument.body.appendChild(mountElement);

  return {
    iframe,
    frameDocument,
    frameWindow,
    mountElement,
  };
};

const captureOffscreenBanner = async ({
  banner,
  elements,
  overrides,
  projectName,
}: {
  banner: BannerSize;
  elements: BannerElement[];
  overrides?: Record<string, Override>;
  projectName: string;
}): Promise<RenderedBannerAsset> => {
  const { iframe, frameDocument, frameWindow, mountElement } = createExportFrame(banner);
  const root = createRoot(mountElement);

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
        suppressButtonText={true}
      />,
    );

    await nextFrame(frameWindow);
    await nextFrame(frameWindow);

    if ('fonts' in frameDocument) {
      await (frameDocument as Document & { fonts: FontFaceSet }).fonts.ready;
    }

    await waitForImages(mountElement);

    const canvas = await html2canvas(mountElement, {
      backgroundColor: '#ffffff',
      scale: 1,
      useCORS: true,
      logging: false,
      allowTaint: true,
      width: banner.width,
      height: banner.height,
      windowWidth: banner.width,
      windowHeight: banner.height,
    });
    drawButtonTextOverlay({ canvas, banner, elements, overrides });

    const blob = await canvasToBlob(canvas, banner.name);
    return {
      banner,
      blob,
      filename: getBannerImageFilename(projectName, banner),
    };
  } finally {
    root.unmount();
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
};

export const renderBannerToBlob = async ({
  banner,
  elements,
  overrides,
  projectName,
}: {
  banner: BannerSize;
  elements: BannerElement[];
  overrides?: Record<string, Override>;
  projectName: string;
}): Promise<RenderedBannerAsset> => {
  if ('fonts' in document) {
    await (document as Document & { fonts: FontFaceSet }).fonts.ready;
  }

  await nextFrame();

  // Export from a controlled off-screen render to avoid editor UI styles and Tailwind OKLCH colors.
  return captureOffscreenBanner({ banner, elements, overrides, projectName });
};
