# Tools Architecture

The `tools` directory powers the offline media pipeline for the **Awesome Open Source Games** project. It automates high-resolution asset scraping, manual multi-select curation, and atomic exporting without bloating the production web application.

## Directory Tree

```text
tools/
└── media-scraper/
    ├── index.js                       # Primary Network-Intercepting HD Scraper
    ├── review-server.js               # Curation Dashboard (UI + Local Atomic Storage)
    ├── apply-review.js                # Build Exporter (Moves selections to /website/public)
    ├── github-stars.js                # GitHub API Data Enrichment (Stars, relevance, language)
    ├── stats.js                       # Payload Auditing & File Metrics
    ├── test-ddg.js                    # Lab: Puppeteer DOM Evaluator bypass test
    ├── test-intercept.js              # Lab: Network `i.js` API proxy sniffer test
    ├── upgrade-resolutions.js         # HD Asset Upgrader (Bypasses search engine caching)
    ├── package.json                   # Pipeline dependencies (Puppeteer, Sharp, Axios)
    ├── reviewed_selections_multi.json # Curated ranks storage (Atomic writes)
    └── out/                           # Ephemeral workspace
        ├── progress.json              # Resumption states
        └── candidates/<game-id>/      # Raw scraped WEBP buffers & sources.json
```

## Core Pipeline

### 1. Ingestion (`index.js`)
Uses `puppeteer-extra-plugin-stealth` coupled with active network interceptors to extract uncompressed, native-origin HD links directly from DuckDuckGo's background WebSocket/JSON API, bypassing Bing grid thumbnails entirely. Output buffers are aggressively scaled and compressed down to `85% WebP at max 1280px` via `sharp`.

**Execution:**
```bash
node tools/media-scraper/index.js
```

### 2. Curation (`review-server.js`)
Locally hosted manual auditing dashboard (`localhost:8080`). Provides ranked image selection and floating manual save capabilities.
*   **Safety Layer:** Implements explicit User-Action saves mapped to asynchronous Atomic File Swaps (`.tmp.json` -> `.json`), preventing byte truncation.
*   **Analytics Overlay:** Automatically scans buffer byte sizes natively, appending conditional UI diagnostic badges (Green >1000px, Yellow >600px, Red <600px).
*   **Modifications:** Features integrated `Clipboard Paste (Ctrl+V)` / Drag-and-Drop native Node.js upload routes for custom fallbacks.

**Execution:**
```bash
node tools/media-scraper/review-server.js
```

### 3. Build Extractor (`apply-review.js`)
Cross-references the finalized selections metadata payload into absolute static directories for the final web client. Preserves array structures dictating the primary frontend grid layout asset (`<gameId>.webp`), alongside supporting gallery variations.

**Execution:**
```bash
node tools/media-scraper/apply-review.js
```

### 4. GitHub Enrichment (`github-stars.js`)
Enriches `games.json` with repository metrics from GitHub API (stars, approximate commits, and recency scoring) to generate `final_games.json` used by the production frontend.

*   **Default Behavior:** Only fetches stats for games currently at `0` (vazios), preventing redundant API hits.
*   **Update All:** To force-refresh the entire database, use the `--all` flag.
*   **Rate Limits:** Use a `GITHUB_TOKEN` environment variable to bypass the default 60 requests/hour limit.

**Execution:**
```bash
# Standard incremental update (recommended)
GITHUB_TOKEN=your_token node tools/media-scraper/github-stars.js

# Force update all entries
GITHUB_TOKEN=your_token node tools/media-scraper/github-stars.js --all
```

## Frontend Dashboard Features

The curation UI (`frontend.html`, served at `localhost:8080`) includes:

### Data Source Chain
```
README.md → parse-readme.js → website/src/data/games.json
                                       ↓
                            review-server.js (/api/db)
                                       ↓
                            frontend.html (localhost:8080)
```
No manual copy needed — the review-server always reads the live `games.json` on every `/api/db` request.

### Category Filter Chips
The controls bar shows one chip per category. Clicking a chip **hides** all games in that category. By default the following non-game categories are hidden at startup:
- `Major Companies`
- `Frameworks/Engines/Libraries`
- `Maps/Hacks/Plugins/Utilities/All of the Things™`
- `Just The Source`
- `Chat bots`

Click any chip to toggle it. The status bar updates to reflect only visible games.

### Data Breakdown Panel
A collapsible panel at the top shows every **category** with its total count and all **subcategories** with individual counts. Expands/collapses with a click — gives full data visibility without scrolling.

### Status Bar
Displays live pipeline metrics (relative to visible categories):
- **Visible** — total games in currently-shown categories
- **Reviewed** — games with ≥1 selected image (within visible set)
- **Pending** — remaining visible games needing curation
- **% Complete** — progress bar + full-db total in label

### Filter Toggle (Only Unreviewed)
Hides all already-reviewed game sections so curators can focus on pending work.

### Live Reviewed Badges
Each game section shows a green **✓ Reviewed (N)** badge and green left-border accent as soon as an image is selected. Updates live without requiring a save.

### Delete All Images Button (🗑 Delete All)
Each game section has a **Delete All** button. Clicking shows an inline confirmation overlay. On confirm:
- All `.webp` files in `out/candidates/<gameId>/` are permanently deleted
- `meta.json` cache is cleared
- The game is removed from `reviewed_selections_multi.json` (atomic write)
- The section is removed from the DOM immediately

Useful when scraped images are useless and you want to free space/skip a game.

**Backend endpoint:** `POST /delete-images` with body `{ "gameId": "..." }`

### Progress Sync on Save
The status bar metrics refresh after each manual save (`CTRL+S` or floating button).

## `parse-readme.js` — Deduplication Fix

Located at `website/scripts/parse-readme.js`, the README parser now operates in **deduplicated mode**:

- **Problem:** Some games appear in multiple categories in the README (e.g. `space-shooter` in both `Browser-Based` and `Native`). The old parser generated an ID from `name + subcategory`, creating duplicate entries in `games.json`.
- **Fix:** IDs are now generated **from the game name only** (no subcategory suffix). When a game appears in a second category, its entry is updated to **merge the new category and subcategory into the `tags` array**, keeping a single unique object.
- **Result:** `games.json` is guaranteed to have exactly one entry per game, with all its categories listed in `tags`.

**Execution:**
```bash
node website/scripts/parse-readme.js
```

## Auxiliary Utilities

*   **`upgrade-resolutions.js`**: Re-evaluates internal logs and attempts to bypass proxy locks from cached networks to force-download uncompressed originals, overriding previously processed webp shards without reinitiating full Puppeteer stacks.
*   **`stats.js`**: Evaluates footprint capacity, processing metrics, and storage impacts cross-pipeline.
*   **Lab Scripts (`test-ddg.js`, `test-intercept.js`)**: Isolated DOM layout explorers and request intercept sandboxes mapped for internal routing maintenance if target domains change structural APIs.

## Requirements constraints
Requires active instances of Node.js environments bound with `sharp` native image processing binaries and headless browser distributions. Run scripts purely on `cwd: root`.


