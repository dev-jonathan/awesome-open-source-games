const fs = require('fs');
const path = require('path');

const SELECTIONS_FILE = path.join(__dirname, 'reviewed_selections_multi.json');
const CANDIDATES_DIR = path.join(__dirname, 'out', 'candidates');
const DEST_DIR = path.join(__dirname, '../../website/public/games');

if (!fs.existsSync(SELECTIONS_FILE)) {
    console.error("ERROR: 'reviewed_selections_multi.json' not found!");
    process.exit(1);
}

console.log("=== APPLY REVIEW — Folder-Based Export ===\n");

// Clean old flat export if exists, to avoid stale files
if (fs.existsSync(DEST_DIR)) {
    fs.rmSync(DEST_DIR, { recursive: true, force: true });
    console.log("[CLEAN] Removed old public/games/ directory.\n");
}
fs.mkdirSync(DEST_DIR, { recursive: true });

const selections = JSON.parse(fs.readFileSync(SELECTIONS_FILE, 'utf-8'));

let copiedCount = 0;
let errorsCount = 0;
let gamesExported = 0;

for (const [gameId, selectedFilesArray] of Object.entries(selections)) {
    if (!selectedFilesArray || selectedFilesArray.length === 0) continue;

    // Create a subfolder per game: public/games/<gameId>/
    const gameDestDir = path.join(DEST_DIR, gameId);
    fs.mkdirSync(gameDestDir, { recursive: true });

    for (let idx = 0; idx < selectedFilesArray.length; idx++) {
        const selectedFile = selectedFilesArray[idx];
        const sourceFilePath = path.join(CANDIDATES_DIR, gameId, selectedFile);

        // Output name: index 0 → <gameId>.webp (main banner), index N → <gameId>_N.webp
        const suffix = idx === 0 ? '' : `_${idx}`;
        const destFileName = `${gameId}${suffix}.webp`;
        const destFilePath = path.join(gameDestDir, destFileName);

        if (fs.existsSync(sourceFilePath)) {
            fs.copyFileSync(sourceFilePath, destFilePath);
            copiedCount++;
        } else {
            console.warn(`  [WARN] Missing source: ${gameId}/${selectedFile}`);
            errorsCount++;
        }
    }

    console.log(`  [OK] ${gameId}/ → ${selectedFilesArray.length} image(s)`);
    gamesExported++;
}

console.log(`\n=== EXPORT COMPLETE ===`);
console.log(`Games with folders:  ${gamesExported}`);
console.log(`Images copied:       ${copiedCount}`);
if (errorsCount > 0) console.log(`Missing sources:     ${errorsCount}`);
console.log(`\nOutput: website/public/games/<gameId>/<gameId>.webp`);

