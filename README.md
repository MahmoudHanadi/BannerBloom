# BannerBloom

Create once. Deploy everywhere.

BannerBloom is a multi-format creative deployment tool that lets you build on source canvases and generate campaign-ready banner outputs for standard placements.

## Features 

- **Source Canvas System** - Build on category-based source canvases (Square, Horizontal, Vertical) that auto-propagate to output sizes
- **Override System** - Fine-tune individual banner sizes with per-placement overrides
- **Element Types** - Text, images, shapes (rectangle, circle, rounded rect), and CTA buttons
- **Smart Positioning** - Percentage-based layout for consistent scaling across banner sizes
- **Aspect Ratio Locking** - Maintain proportions across different banner dimensions
- **Background Options** - Solid color, gradient, or image backgrounds
- **Export Formats** - PNG, HTML5, and AMP HTML exports (single or batch ZIP)
- **Interactive Editing** - Drag, resize, rotate elements, nudge with arrow keys, and pan the canvas with Space+drag

## Tech Stack

- **React 19** +**TypeScript**
- **Vite** for dev server and bundling
- **Tailwind CSS 4** for styling
- **Zustand** for state management
- **html2canvas** for PNG export
- **JSZip** for batch export
- **Lucide React** for icons

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Banner Sizes

| Category   | Size              | Dimensions |
|------------|-------------------|------------|
| Horizontal | Source Landscape  | 1200x628   |
| Horizontal | Landscape Min     | 600x314    |
| Square     | Source Square     | 1200x1200  |
| Square     | Square Min        | 300x300    |
| Vertical   | Source Vertical   | 960x1200   |
| Vertical   | Vertical Min      | 480x600    |
| Vertical   | Vertical 9:16     | 900x1600   |
| Vertical   | AMP Portrait      | 320x480    |
| Horizontal | AMP Landscape     | 480x320    |

## License

MIT
