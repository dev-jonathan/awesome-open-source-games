const http = require('http');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const GAMES_JSON_PATH = path.join(__dirname, '../../website/src/data/games.json');
const CANDIDATES_DIR = path.join(__dirname, 'out', 'candidates');
const SELECTIONS_FILE = path.join(__dirname, 'reviewed_selections_multi.json');
const TEMP_SELECTIONS_FILE = path.join(__dirname, 'reviewed_selections_multi.tmp.json');

const PORT = 8080;

function loadSelections() {
    try {
        if (fs.existsSync(SELECTIONS_FILE)) {
            const data = fs.readFileSync(SELECTIONS_FILE, 'utf-8');
            if (data.trim().length > 0) return JSON.parse(data);
        }
    } catch(e) {}
    return {};
}

function atomicSaveSelections(payload) {
    fs.writeFileSync(TEMP_SELECTIONS_FILE, JSON.stringify(payload, null, 2));
    fs.renameSync(TEMP_SELECTIONS_FILE, SELECTIONS_FILE);
}

// Generate the global state ONCE on request to avoid hanging the thread for 10 seconds.
async function generateApiDb() {
    let games = [];
    try { games = JSON.parse(fs.readFileSync(GAMES_JSON_PATH, 'utf-8')); } catch(e) { return {error: "No games.json"}; }
    const currentSelections = loadSelections();
    let db = { games: [], selections: currentSelections };

    for (const game of games) {
        const gameDir = path.join(CANDIDATES_DIR, game.id);

        let files = [];
        if (fs.existsSync(gameDir)) {
            files = fs.readdirSync(gameDir).filter(f => f.endsWith('.webp'));
        }

        let sourcesMap = {};
        const sourcesFile = path.join(gameDir, 'sources.json');
        if (fs.existsSync(sourcesFile)) {
            try { JSON.parse(fs.readFileSync(sourcesFile, 'utf-8')).forEach(s => sourcesMap[s.img] = s.url); } catch(e) {}
        }

        let metaCache = {};
        const metaFile = path.join(gameDir, 'meta.json');
        try { if (fs.existsSync(metaFile)) metaCache = JSON.parse(fs.readFileSync(metaFile, 'utf-8')); } catch(e){}
        let metaUpdated = false;

        let images = [];
        for (const file of files) {
            let metadata = metaCache[file];
            if (!metadata) {
                try {
                    const meta = await sharp(path.join(gameDir, file)).metadata();
                    metadata = { w: meta.width, h: meta.height };
                    metaCache[file] = metadata;
                    metaUpdated = true;
                } catch(e) { metadata = { w: 0, h: 0 }; }
            }
            images.push({ file: file, srcUrl: sourcesMap[file] || (file.startsWith('custom_') ? '#' : '#'), w: metadata.w, h: metadata.h });
        }

        if (metaUpdated) fs.writeFileSync(metaFile, JSON.stringify(metaCache, null, 2));

        db.games.push({
            id: game.id,
            name: game.name,
            description: game.description,
            link: game.link,
            category: game.category,
            subcategory: game.subcategory,
            tags: game.tags,
            images: images
        });
    }
    return db;
}

const frontendTemplate = fs.readFileSync(path.join(__dirname, 'frontend.html'), 'utf8').catch ? "Wait" : ""; // We'll create frontend.html next!

const server = http.createServer(async (req, res) => {
    // Silence expected browser Abort / connection drops from cluttering terminal
    req.on('error', err => {
        if (err.code === 'ECONNRESET') return;
        console.error('\n[!] Connection error:', err.message);
    });
    res.on('error', err => {
        if (err.code === 'ECONNRESET') return;
    });

    // Fix for stream memory leaks (ECONNRESET causes node hangs)
    if (req.url.startsWith('/candidates/')) {
        const filePath = path.join(__dirname, 'out', decodeURI(req.url));
        if (fs.existsSync(filePath)) {
            res.writeHead(200, { 'Content-Type': 'image/webp' });
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
            req.on('close', () => { if (!stream.destroyed) stream.destroy(); }); // CRITICAL FIX: Kill hanging filesystem pipes if browser aborts!!!
        } else {
            res.writeHead(404);
            res.end();
        }
        return;
    }

    if (req.method === 'GET' && req.url === '/api/db') {
        process.stdout.write(`\n[API] Compiling and sending database to frontend... `);
        const startTime = Date.now();
        const db = await generateApiDb();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db));
        console.log(`OK! (${Date.now() - startTime}ms)`);
        return;
    }

    if (req.method === 'POST' && req.url === '/upload') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const payload = JSON.parse(body);
                const gameId = payload.gameId;
                console.log(`\n[UPLOAD] Compressing custom image via Sharp for: ${gameId}...`);
                const base64Data = payload.base64.replace(/^data:image\/[a-z]+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const gameDir = path.join(CANDIDATES_DIR, gameId);
                if (!fs.existsSync(gameDir)) fs.mkdirSync(gameDir, { recursive: true });
                
                const newFileName = `custom_${Date.now()}.webp`;
                const dest = path.join(gameDir, newFileName);
                await sharp(buffer).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 80 }).toFile(dest);
                
                console.log(`[UPLOAD] Success! Saved as ${newFileName}`);
                res.writeHead(200); res.end(JSON.stringify({ success: true, fileName: newFileName }));
            } catch (err) {
                console.error(`[UPLOAD ERROR] Failed to parse custom image: ${err.message}`);
                res.writeHead(500); res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    if (req.method === 'POST' && req.url === '/save') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const incoming = JSON.parse(body);

                // SAFETY: load what is currently on disk
                const previous = loadSelections();

                // ── MERGE (never delete) ─────────────────────────────────────
                // Start from the full on-disk state. Only add/update keys from
                // the incoming payload. Keys in previous but NOT in incoming are
                // preserved as-is — they can only be removed via manual file edit
                // or the explicit /delete-images endpoint.
                const merged = Object.assign({}, previous, incoming);

                // Diff for logging / UI feedback
                const added = [], modified = [], skipped = [];
                Object.keys(merged).forEach(id => {
                    const wasIn = previous.hasOwnProperty(id);
                    const isIn  = incoming.hasOwnProperty(id);
                    if (!wasIn && isIn)  { added.push(id);    return; }
                    if (wasIn  && isIn) {
                        const same = JSON.stringify(previous[id]) === JSON.stringify(incoming[id]);
                        if (!same) modified.push(id);
                    }
                    if (wasIn && !isIn) skipped.push(id); // protected — not in DOM payload
                });

                // EXTRA GUARD: merged must never be smaller than previous
                if (Object.keys(merged).length < Object.keys(previous).length) {
                    throw new Error(`REFUSED: merge result (${Object.keys(merged).length}) is smaller than previous (${Object.keys(previous).length}). Aborting to protect data.`);
                }

                atomicSaveSelections(merged);

                // Verify write
                const verified = JSON.parse(fs.readFileSync(SELECTIONS_FILE, 'utf-8'));
                const savedCount = Object.keys(verified).length;

                const ts = new Date().toISOString();
                console.log(`\n[SAVE ${ts}] Merge+write OK — ${savedCount} total on disk (${skipped.length} protected)`);
                if (added.length)    console.log(`  [+] Added    (${added.length}): ${added.join(', ')}`);
                if (modified.length) console.log(`  [~] Modified (${modified.length}): ${modified.join(', ')}`);
                if (skipped.length)  console.log(`  [=] Protected from deletion (${skipped.length}): ${skipped.join(', ')}`);
                if (!added.length && !modified.length) console.log('  [=] No new changes.');

                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    savedCount,
                    diff: { added, modified, removed: [], skipped }
                }));
            } catch(err) {
                console.error(`[SAVE ERROR] ${err.message}`);
                res.writeHead(500); res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    if (req.method === 'POST' && req.url === '/delete-images') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { gameId } = JSON.parse(body);
                if (!gameId) { res.writeHead(400); res.end(JSON.stringify({ error: 'Missing gameId' })); return; }

                const gameDir = path.join(CANDIDATES_DIR, gameId);
                let deletedCount = 0;

                if (fs.existsSync(gameDir)) {
                    const files = fs.readdirSync(gameDir);
                    for (const file of files) {
                        if (file.endsWith('.webp')) {
                            fs.unlinkSync(path.join(gameDir, file));
                            deletedCount++;
                        }
                    }
                    // Also clear meta cache so it doesn't get stale
                    const metaFile = path.join(gameDir, 'meta.json');
                    if (fs.existsSync(metaFile)) fs.unlinkSync(metaFile);
                }

                // Remove from selections too
                const sel = loadSelections();
                if (sel[gameId]) {
                    delete sel[gameId];
                    atomicSaveSelections(sel);
                }

                console.log(`\n[DELETE] Removed ${deletedCount} images for: ${gameId}`);
                res.writeHead(200); res.end(JSON.stringify({ success: true, deleted: deletedCount }));
            } catch(err) {
                console.error(`[DELETE ERROR] ${err.message}`);
                res.writeHead(500); res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        let html;
        try { html = fs.readFileSync(path.join(__dirname, 'frontend.html'), 'utf8'); } catch(e) { html = "Frontend file missing."; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }
});

server.listen(PORT, () => {
    console.log('⚡=========================================⚡');
    console.log('[+] Curation Server is LIVE!');
    console.log(`[+] Access Dashboard: http://localhost:${PORT}`);
    console.log('⚡=========================================⚡');
});
