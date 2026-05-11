const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');

const GAMES_JSON_PATH = path.join(__dirname, '../../website/src/data/games.json');
const CANDIDATES_DIR = path.join(__dirname, 'out', 'candidates');

async function downloadAndOptimize(url, destPath) {
    try {
        const response = await axios({
            url,
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const buffer = Buffer.from(response.data, 'binary');
        await sharp(buffer)
            .resize({ width: 1280, withoutEnlargement: true })
            .webp({ quality: 85 })
            .toFile(destPath);
        return true;
    } catch (e) {
        return false;
    }
}

async function scrapeGithub() {
    if (!fs.existsSync(GAMES_JSON_PATH)) return;
    const games = JSON.parse(fs.readFileSync(GAMES_JSON_PATH, 'utf-8'));

    console.log("=== GITHUB README SCRAPER ===");
    console.log("Extracting embedded images from GitHub repositories safely without wiping current data...\n");

    for (let i = 0; i < games.length; i++) {
        const game = games[i];
        if (!game.link || (!game.link.includes('github.com/') && !game.link.includes('gitlab.com/'))) continue;

        const gameDir = path.join(CANDIDATES_DIR, game.id);
        if (!fs.existsSync(gameDir)) {
            fs.mkdirSync(gameDir, { recursive: true });
        }

        // Se ja baixamos imgs do github antes, pode pular (para ser continuavel)
        const existingFiles = fs.readdirSync(gameDir).filter(f => f.startsWith('github_'));
        if (existingFiles.length > 0) {
            console.log(`[${i+1}/${games.length}] (Skip) ${game.name} already has GitHub images.`);
            continue;
        }

        console.log(`[${i+1}/${games.length}] Fetching Repo: ${game.name} (${game.link})`);
        
        try {
            // Direct fetch of the HTML
            const response = await axios.get(game.link, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
            const html = response.data;
            
            let imageUrls = [];
            
            // Try to extract from Markdown Body (GitHub usually renders README inside this)
            const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
            if (articleMatch) {
                const articleHtml = articleMatch[1];
                const imgRegex = /<img[^>]+src="([^">]+)"/g;
                let m;
                while ((m = imgRegex.exec(articleHtml)) !== null) {
                    let src = m[1];
                    // Skip badges, icons, and svgs
                    if (src.includes('badge') || src.includes('.svg') || src.includes('shield') || src.includes('travis-ci') || src.includes('github/workflow')) continue;
                    // If relative URL inside github, make absolute
                    if (src.startsWith('/')) {
                        src = 'https://github.com' + src;
                    }
                    imageUrls.push(src);
                }
            }
            
            if (imageUrls.length === 0) {
                console.log(`  [-] No valid images found in README.`);
                continue;
            }

            // Deduplicate and limit to 4 images max
            imageUrls = [...new Set(imageUrls)].slice(0, 4);

            let vCount = 0;
            const sourcesLog = [];
            const sourcesFile = path.join(gameDir, 'sources.json');
            
            if (fs.existsSync(sourcesFile)) {
                try { sourcesLog.push(...JSON.parse(fs.readFileSync(sourcesFile, 'utf-8'))); } catch(e){}
            }

            for (let idx = 0; idx < imageUrls.length; idx++) {
                const url = imageUrls[idx];
                const destFile = path.join(gameDir, `github_${Date.now()}_${idx}.webp`);
                const success = await downloadAndOptimize(url, destFile);
                if (success) {
                    vCount++;
                    sourcesLog.push({ img: path.basename(destFile), url: url });
                }
            }

            if (vCount > 0) {
                fs.writeFileSync(sourcesFile, JSON.stringify(sourcesLog, null, 2));
                console.log(`  [v] Downloaded ${vCount} embedded README images.`);
            }

        } catch (err) {
            console.error(`  [X] Failed fetching repo ${game.name}:`, err.message);
        }
    }
    
    console.log("\nFinished fetching GitHub images!");
}

scrapeGithub();
