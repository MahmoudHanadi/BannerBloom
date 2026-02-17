# Banner Spore 🌱

A multi-format banner design tool that lets you design on master canvases and automatically generates various standard web banner sizes.

## Features

- **Master Canvas System** — Design on category-based master canvases (Square, Horizontal, Vertical) that auto-propagate to sub-sizes
- **Override System** — Fine-tune individual banner sizes with per-banner overrides
- **Element Types** — Text, Images, Shapes (Rectangle, Circle, Rounded Rect), and Buttons
- **Smart Positioning** — Percentage-based layout for consistent scaling across banner sizes
- **Aspect Ratio Locking** — Maintain proportions across different banner dimensions
- **Background Options** — Solid color, gradient, or image backgrounds
- **Export Formats** — PNG, HTML5, and AMP HTML exports (single or batch ZIP)
- **Interactive Editing** — Drag, resize, rotate elements. Arrow key nudging. Space+drag canvas panning

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** (dev server & bundler)
- **Tailwind CSS 4** (styling)
- **Zustand** (state management)
- **html2canvas** (PNG export)
- **JSZip** (batch export)
- **Lucide React** (icons)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

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
| Horizontal | Master Landscape  | 1200×628   |
| Horizontal | Landscape Min     | 600×314    |
| Square     | Master Square     | 1200×1200  |
| Square     | Square Min        | 300×300    |
| Vertical   | Master Vertical   | 960×1200   |
| Vertical   | Vertical Min      | 480×600    |
| Vertical   | Vertical 9:16     | 900×1600   |
| Vertical   | AMP Portrait      | 320×480    |
| Horizontal | AMP Landscape     | 480×320    |

## License

MIT
