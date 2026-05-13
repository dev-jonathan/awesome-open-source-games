const fs = require('fs');
const path = require('path');
const https = require('https');

// Load .env manually if it exists
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.replace(/(^['"]|['"]$)/g, '').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const GAMES_RAW_PATH = path.join(
  __dirname,
  '../../website/src/data/final_games.json',
);
const FINAL_GAMES_PATH = path.join(
  __dirname,
  '../../website/src/data/final_games.json',
);
const CACHE_PATH = path.join(__dirname, 'enrichment-cache.json');
const SELECTIONS_PATH = path.join(__dirname, 'reviewed_selections_multi.json');

const TTL_DAYS = 19;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

// Load inputs
const rawGames = JSON.parse(fs.readFileSync(GAMES_RAW_PATH, 'utf-8'));
const selections = fs.existsSync(SELECTIONS_PATH)
  ? JSON.parse(fs.readFileSync(SELECTIONS_PATH, 'utf-8'))
  : {};
let cache = fs.existsSync(CACHE_PATH)
  ? JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'))
  : {};

// Arguments
const forceAll = process.argv.includes('--all');
const existingFinalGames = fs.existsSync(FINAL_GAMES_PATH)
  ? JSON.parse(fs.readFileSync(FINAL_GAMES_PATH, 'utf-8'))
  : [];
const existingStatsMap = new Map(
  existingFinalGames.map((g) => [g.id, g.stats]),
);
const existingLanguageMap = new Map(
  existingFinalGames.map((g) => [g.id, g.language]),
);

// Helper to make GitHub API requests
function fetchGitHubAPI(repoPathOrUrl, redirectCount = 0) {
  // Trava de segurança para evitar loops infinitos de redirecionamento
  if (redirectCount > 3) return Promise.reject(new Error('TOO_MANY_REDIRECTS'));

  return new Promise((resolve, reject) => {
    // Permite que a função receba tanto o formato "dono/repo" quanto a URL completa do redirecionamento
    const url = repoPathOrUrl.startsWith('http')
      ? repoPathOrUrl
      : `https://api.github.com/repos/${repoPathOrUrl}`;

    const options = {
      headers: {
        'User-Agent': 'Awesome-Open-Source-Games-Builder',
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        }),
      },
    };

    https
      .get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else if ([301, 302, 307, 308].includes(res.statusCode)) {
            // Captura a nova URL no cabeçalho 'location' e faz a requisição novamente
            const redirectUrl = res.headers.location;
            if (redirectUrl) {
              resolve(fetchGitHubAPI(redirectUrl, redirectCount + 1));
            } else {
              reject(
                new Error(
                  `Status ${res.statusCode}: Redirecionamento sem header Location`,
                ),
              );
            }
          } else if (res.statusCode === 403 || res.statusCode === 429) {
            reject(new Error('RATE_LIMIT'));
          } else if (res.statusCode === 404) {
            resolve(null); // Repo deletado ou oculto
          } else {
            reject(new Error(`Status ${res.statusCode}: ${data}`));
          }
        });
      })
      .on('error', reject);
  });
}

function getRecencyMultiplier(pushedAtDate) {
  if (!pushedAtDate) return 0.1;

  const msSincePush = Date.now() - new Date(pushedAtDate).getTime();
  const yearsSincePush = msSincePush / (1000 * 60 * 60 * 24 * 365.25);

  if (yearsSincePush < 1) return 1.6;
  if (yearsSincePush < 2) return 1.3;
  if (yearsSincePush < 3) return 1.0;
  if (yearsSincePush < 5) return 0.4;
  return 0.1;
}

async function run() {
  console.log(`=== ENRICH GAMES SCRIPT (V2 Algorithm) ===`);
  if (forceAll)
    console.log(`[INFO] --all flag detected. Fetching for ALL games.`);
  else
    console.log(`[INFO] Default mode: only fetching for games with 0 stats.`);

  const finalGames = [];
  let rateLimitHit = false;

  const issues = {
    nonGithubLinks: [],
    malformedGithubLinks: [],
    notFound: [],
    rateLimited: [],
    errors: [],
  };

  for (const game of rawGames) {
    const finalGame = { ...game };

    // --- Image Matching ---
    const gameDir = path.join(__dirname, '../../website/public/games', game.id);
    let gameImages = [];
    if (fs.existsSync(gameDir)) {
      const files = fs.readdirSync(gameDir).filter((f) => f.endsWith('.webp'));
      gameImages = files;
    }

    finalGame.hasImage = gameImages.length > 0;

    // Use actual filenames from the directory
    finalGame.images = gameImages.map((file) => {
      return `/games/${game.id}/${file}`;
    });

    // --- Delta Check (Skip if already has stats) ---
    const existingStats = existingStatsMap.get(game.id);
    const hasValidStats =
      existingStats && (existingStats.stars > 0 || existingStats.commits > 0);
    if (!forceAll && hasValidStats) {
      finalGame.stats = { ...existingStats };
      finalGame.language = existingLanguageMap.get(game.id);
      finalGames.push(finalGame);
      continue;
    }

    // --- Relevance & GitHub Stats ---
    let targetLink = game.link;
    if (targetLink && !targetLink.includes('github.com') && game.links && game.links.length > 0) {
      const ghLink = game.links.find(l => l.includes('github.com'));
      if (ghLink) targetLink = ghLink;
    }

    if (!targetLink || game.isCompany) {
      finalGame.stats = {
        stars: 0,
        commits: 0,
        lastPush: null,
        relevanceScore: 0,
      };
    } else if (!targetLink.includes('github.com')) {
      issues.nonGithubLinks.push({ id: game.id, link: targetLink });
      finalGame.stats = {
        stars: 0,
        commits: 0,
        lastPush: null,
        relevanceScore: 0,
      };
    } else if (rateLimitHit) {
      issues.rateLimited.push({ id: game.id, link: targetLink });
      finalGame.stats = existingStats || {
        stars: 0,
        commits: 0,
        lastPush: null,
        relevanceScore: 0,
      };
    } else {
      const match = targetLink.match(/github\.com\/([^/]+\/[^/]+)/);
      if (match) {
        let repoPath = match[1].split('?')[0].split('#')[0]; // Clean up query/fragment
        if (repoPath.endsWith('/')) repoPath = repoPath.slice(0, -1);
        if (repoPath.endsWith('.git')) repoPath = repoPath.slice(0, -4);

        const cached = cache[game.id];
        const isFresh =
          cached &&
          cached.lastFetched &&
          Date.now() - cached.lastFetched < TTL_MS;

        if (isFresh && !forceAll) {
          finalGame.stats = { ...cached.stats };
          finalGame.language = cached.language;
        } else {
          console.log(`Fetching API for ${repoPath}...`);
          try {
            const apiData = await fetchGitHubAPI(repoPath);
            if (apiData) {
              const stars = apiData.stargazers_count || 0;
              const proxyCommits = apiData.size
                ? Math.max(apiData.size / 100, 10)
                : 10;
              const pushed_at = apiData.pushed_at;

              const logStars = Math.log10(stars + 1);
              const logCommits =
                proxyCommits >= 30
                  ? Math.log10(proxyCommits)
                  : Math.log10(proxyCommits + 1) * 0.5;
              const recency = getRecencyMultiplier(pushed_at);
              const score = (1.5 * logStars + 1.0 * logCommits) * recency;

              finalGame.stats = {
                stars,
                commits: Math.round(proxyCommits),
                lastPush: pushed_at,
                relevanceScore: parseFloat(score.toFixed(2)),
              };
              finalGame.language = apiData.language;

              // Update cache
              cache[game.id] = {
                lastFetched: Date.now(),
                stats: finalGame.stats,
                language: finalGame.language,
              };
              fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));

              // Respect rate limit intentionally
              await new Promise((r) => setTimeout(r, 600));
            } else {
              // 404
              issues.notFound.push({ id: game.id, repo: repoPath });
              finalGame.stats = {
                stars: 0,
                commits: 0,
                lastPush: null,
                relevanceScore: 0,
              };
              cache[game.id] = {
                lastFetched: Date.now(),
                stats: finalGame.stats,
                language: null,
              };
            }
          } catch (err) {
            if (err.message === 'RATE_LIMIT') {
              console.warn(`[WARN] GitHub API Rate limit hit!`);
              rateLimitHit = true;
              issues.rateLimited.push({ id: game.id, link: targetLink });
              finalGame.stats = existingStats || {
                stars: 0,
                commits: 0,
                lastPush: null,
                relevanceScore: 0,
              };
            } else {
              console.error(`[ERROR] ${game.id}: ${err.message}`);
              issues.errors.push({ id: game.id, error: err.message });
              finalGame.stats = existingStats || {
                stars: 0,
                commits: 0,
                lastPush: null,
                relevanceScore: 0,
              };
            }
          }
        }
      } else {
        issues.malformedGithubLinks.push({ id: game.id, link: targetLink });
        finalGame.stats = {
          stars: 0,
          commits: 0,
          lastPush: null,
          relevanceScore: 0,
        };
      }
    }

    finalGames.push(finalGame);
  }

  fs.writeFileSync(FINAL_GAMES_PATH, JSON.stringify(finalGames, null, 2));
  console.log(`\n=== ENRICHMENT COMPLETE ===`);
  console.log(`Processed ${finalGames.length} games.`);

  if (issues.nonGithubLinks.length > 0) {
    console.log(
      `\n[WARNING] Non-GitHub Links (${issues.nonGithubLinks.length}):`,
    );
    issues.nonGithubLinks.forEach((i) => console.log(`  - ${i.id}: ${i.link}`));
  }

  if (issues.malformedGithubLinks.length > 0) {
    console.log(
      `\n[ERROR] Malformed GitHub Links (${issues.malformedGithubLinks.length}):`,
    );
    issues.malformedGithubLinks.forEach((i) =>
      console.log(`  - ${i.id}: ${i.link}`),
    );
  }

  if (issues.notFound.length > 0) {
    console.log(`\n[ERROR] Repos Not Found (404) (${issues.notFound.length}):`);
    issues.notFound.forEach((i) => console.log(`  - ${i.id}: ${i.repo}`));
  }

  if (issues.rateLimited.length > 0) {
    console.log(`\n[WARN] Rate Limited Games (${issues.rateLimited.length}):`);
    issues.rateLimited.forEach((i) => console.log(`  - ${i.id}: ${i.link}`));
  }

  if (issues.errors.length > 0) {
    console.log(`\n[ERROR] Other Errors (${issues.errors.length}):`);
    issues.errors.forEach((i) => console.log(`  - ${i.id}: ${i.error}`));
  }

  console.log(`\nOutput written to: website/src/data/final_games.json\n`);
}

run();
