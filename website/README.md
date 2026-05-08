# Awesome Open Source Games - Frontend Architecture

This directory houses the source code for the interactive, highly-performant frontend of **Awesome Open Source Games**. It transforms the static Markdown list into a searchable, filterable, and visually striking single-page application (SPA), prioritizing rendering speed and fluid animations.

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Language**: TypeScript (`.tsx`, `.ts`)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Graphics**: Native WebGL2 for procedural shaders and 8x8 Bayer matrix dithering
- **Animations**: High-performance CSS-native transitions (zero JS overhead)
- **Data Pipeline**: Custom Node.js markdown parser (`src/scripts/parse-readme.js`)

## Architecture & Data Pipeline

The core architecture follows a **Static Site Generation (SSG)** paradigm backed by a single source of truth, ensuring an optimal Lighthouse score and instantaneous Time to Interactive (TTI).

1. **The Root `README.md`**: The user-facing markdown file at the repository root acts as the absolute source of truth.
2. **Parser Script (`parse-readme.js`)**: During the build step, the parser reads the `README.md` file utilizing robust regex evaluation to extract the list items. It autonomously infers categories and subcategories based on `##` and `###` markdown headers.
3. **Data Hydration**: The script outputs a structured `games.json` array containing standardized metadata: `id`, `name`, `description`, `link`, `category`, and `tags`.
4. **React Client**: The Vite bundle statically imports the JSON payload, building a local indexing table powered by `fuse.js` to provide real-time, zero-latency fuzzy search.

## Getting Started

To initialize the development environment:

```bash
# 1. Install project dependencies
pnpm install

# 2. (Optional) Rebuild the JSON payload if the root README changed
node src/scripts/parse-readme.js

# 3. Start the hot-reloading Vite dev server
pnpm run dev
```

Build for production:

```bash
pnpm run build
# Executes tsc && vite build to generate the optimized /dist artifact.
```

## Key Systems & Components

- **`<Dither />`**: A bespoke WebGL2 shader implementation running natively within a canvas context. It computes a procedural noise wave (fBm/Perlin noise) in the fragment shader. It applies an authentic 8x8 Bayer Matrix Dither to quantize the gradient noise down to explicitly distinct colors, creating a classic retro aesthetic without the overhead of heavy 3D libraries.
- **`<HeroSection />`**: Utilizes modern, pure CSS animations for sequenced typography effects and floating elements, ensuring 60fps performance without relying on heavy third-party motion libraries.
- **`<GameExplorer />`**: Consumes `games.json` and manages complex derived states for fuzzy search (`fuse.js`) and tag-based categorization. Employs DOM optimization techniques to maintain flawless scroll performance across hundreds of entries.

## ⚠️ Development Guidelines

- **WebGL Performance**: The `<Dither />` component initializes WebGL2 contexts directly. Avoid triggering unnecessary re-renders of this component. The component accepts an `icons` array; ensure these assets are optimized to prevent layout shifts or memory spikes during texture allocation.
- **Path Aliasing**: The application configures `tsconfigPaths` natively via Vite. All absolute imports must utilize the standard `@/components/...` alias format.
- **Artifacts**: The `/dist` directory contains the compiled production bundle and should not be committed to version control. Deployment pipelines should generate this artifact dynamically.
