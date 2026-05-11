/**
 * purge-unselected.js
 * Deletes every image in /out/candidates/ that was NOT manually curated.
 * Safe to re-run: never touches reviewed_selections_multi.json or meta.json/sources.json.
 */

const fs = require('fs');
const path = require('path');

const SELECTIONS_FILE = path.join(__dirname, 'reviewed_selections_multi.json');
const CANDIDATES_DIR = path.join(__dirname, 'out', 'candidates');

const NON_IMAGE_FILES = new Set(['sources.json', 'meta.json']); // keep these always

if (!fs.existsSync(SELECTIONS_FILE)) {
    console.error('[ERROR] reviewed_selections_multi.json not found!');
    process.exit(1);
}

const selections = JSON.parse(fs.readFileSync(SELECTIONS_FILE, 'utf-8'));
const selectedGameIds = new Set(Object.keys(selections));

let totalDeleted = 0;
let totalKept = 0;
let totalFoldersDeleted = 0;

console.log('\n=== PURGE UNSELECTED IMAGES ===');
console.log(`Curated game entries: ${selectedGameIds.size}`);
console.log(`Scanning: ${CANDIDATES_DIR}\n`);

if (!fs.existsSync(CANDIDATES_DIR)) {
    console.error('[ERROR] candidates/ folder not found. Run the scraper first.');
    process.exit(1);
}

const gameFolders = fs.readdirSync(CANDIDATES_DIR);

for (const gameId of gameFolders) {
    const gameDir = path.join(CANDIDATES_DIR, gameId);
    const stat = fs.statSync(gameDir);
    if (!stat.isDirectory()) continue;

    // Game folder has no curated selections at all — delete the entire folder
    if (!selectedGameIds.has(gameId)) {
        const allFiles = fs.readdirSync(gameDir);
        for (const f of allFiles) {
            fs.unlinkSync(path.join(gameDir, f));
        }
        fs.rmdirSync(gameDir);
        totalFoldersDeleted++;
        console.log(`[PURGED FOLDER] ${gameId} (no selections)`);
        continue;
    }

    // Game has selections — keep only selected files + metadata files
    const keptFiles = new Set(selections[gameId]);
    const allFiles = fs.readdirSync(gameDir);

    for (const file of allFiles) {
        if (NON_IMAGE_FILES.has(file)) continue; // keep sources.json, meta.json
        if (!file.endsWith('.webp')) continue;

        if (keptFiles.has(file)) {
            totalKept++;
        } else {
            fs.unlinkSync(path.join(gameDir, file));
            totalDeleted++;
            console.log(`  [DEL] ${gameId}/${file}`);
        }
    }
}

console.log('\n=== PURGE COMPLETE ===');
console.log(`Images Kept (selected):   ${totalKept}`);
console.log(`Images Deleted (unsel.):  ${totalDeleted}`);
console.log(`Folders Entirely Purged:  ${totalFoldersDeleted}`);
console.log('\nRun apply-review.js next to move kept images to website/public/games/');
