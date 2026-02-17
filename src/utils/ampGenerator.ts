import type { BannerSize } from '../store/bannerStore';

export const generateHTML5 = (
  banner: BannerSize
): string => {
  const orientation = banner.width >= banner.height ? 'landscape' : 'portrait';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="ad.size" content="width=${banner.width},height=${banner.height}">
  <meta name="ad.orientation" content="${orientation}">
  <title>Banner</title>
  <style>
    body { margin: 0; padding: 0; overflow: hidden; }
    .ad-wrap { width: ${banner.width}px; height: ${banner.height}px; position: relative; overflow: hidden; }
  </style>
</head>
<body>
  <div class="ad-wrap" id="ad-container">
    <img src="bg.png" width="${banner.width}" height="${banner.height}" loading="lazy" style="display:block; width:100%; height:100%; object-fit: cover;" alt="Advertisement">
  </div>
</body>
</html>`;
};

export const generateAMP = (
  banner: BannerSize
): string => {
  return `<!doctype html>
<html amp4ads>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta name="ad.size" content="width=${banner.width},height=${banner.height}">
  <title>Banner</title>
  
  <script async src="https://cdn.ampproject.org/amp4ads-v0.js"></script>

  <style amp4ads-boilerplate>body{visibility:hidden}</style>

  <style amp-custom>
    body { margin: 0; padding: 0; overflow: hidden; }
    .ad-wrap { width: ${banner.width}px; height: ${banner.height}px; position: relative; overflow: hidden; }
  </style>
</head>
<body>
  <div class="ad-wrap" id="ad-container">
    <amp-img 
      src="bg.png" 
      width="${banner.width}" 
      height="${banner.height}" 
      layout="responsive"
      alt="Advertisement">
    </amp-img>
  </div>
</body>
</html>`;
};
