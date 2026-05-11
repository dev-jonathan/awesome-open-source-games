const fs = require("fs");
const path = require("path");
const axios = require("axios");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const sharp = require("sharp");

puppeteer.use(StealthPlugin());

const GAMES_JSON_PATH = path.join(
  __dirname,
  "../../website/src/data/games.json",
);
const OUT_DIR = path.join(__dirname, "out");
const CANDIDATES_DIR = path.join(OUT_DIR, "candidates");
const PROGRESS_FILE = path.join(OUT_DIR, "progress.json");

// Util functions
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function downloadAndOptimize(url, destPath) {
  try {
    const response = await axios({
      url,
      responseType: "arraybuffer",
      timeout: 10000,
    });

    const buffer = Buffer.from(response.data, "binary");

    await sharp(buffer)
      .resize({ width: 1280, withoutEnlargement: true }) // Redimensiona HD
      .webp({ quality: 85 })
      .toFile(destPath);

    return true;
  } catch (e) {
    console.error(
      `  [X] Falha no download ou compressao da imagem: ${e.message}`,
    );
    return false;
  }
}

async function startScraping() {
  if (!fs.existsSync(GAMES_JSON_PATH)) {
    console.error(`Games database not found at ${GAMES_JSON_PATH}`);
    return;
  }

  if (!fs.existsSync(CANDIDATES_DIR)) {
    fs.mkdirSync(CANDIDATES_DIR, { recursive: true });
  }

  let progress = {};
  if (fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
  }

  const games = JSON.parse(fs.readFileSync(GAMES_JSON_PATH, "utf-8"));

  console.log(`\nIniciando Scraper Invisível... 🚀`);
  console.log(`Total de jogos: ${games.length}\n`);

  const browser = await puppeteer.launch({
    headless: true, // true roda maravilhosamente bem invisivel, sem roubar seu mouse
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  // Identidade de browser padrao de mercado
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
  );
  //for (let i = 0; i < Math.min(5, games.length); i++) {
  for (let i = 0; i < games.length; i++) {
    const game = games[i];

    if (progress[game.id]) {
      console.log(
        `[${i + 1}/${games.length}] (Pulando) ${game.name} - Já parseado antes.`,
      );
      continue;
    }

    console.log(
      `[${i + 1}/${games.length}] Buscando em HD Real: ${game.name} ...`,
    );

    const query = `open source game ${game.name} screenshot`;
    const ddgUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=images&iax=images`;

    const gameDir = path.join(CANDIDATES_DIR, game.id);
    if (!fs.existsSync(gameDir)) {
      fs.mkdirSync(gameDir, { recursive: true });
    }

    try {
      // Preparar o Interceptador de API Oculto do DuckDuckGo
      let highResUrls = [];
      const interceptor = async (response) => {
        const url = response.url();
        if (url.includes("duckduckgo.com/i.js")) {
          try {
            const text = await response.text();
            const json = JSON.parse(text);
            if (json.results) {
              highResUrls.push(...json.results.map((r) => r.image));
            }
          } catch (e) {}
        }
      };

      page.on("response", interceptor);

      await page.goto(ddgUrl, { waitUntil: "networkidle0", timeout: 30000 });

      // Remove o listener para a próxima iteração não acumular duplos
      page.off("response", interceptor);

      if (highResUrls.length === 0) {
        console.log(
          `  [!] Nenhuma imagem de Alta Resolução encontrada na API.`,
        );
        continue;
      }

      let dCount = 0;
      const sourcesLog = [];

      for (let idx = 0; idx < highResUrls.length; idx++) {
        if (dCount >= 5) break;

        const targetUrl = highResUrls[idx];
        const destFile = path.join(gameDir, `alt-${dCount + 1}.webp`);

        // Tenta baixar a original Ultra HD
        let success = await downloadAndOptimize(targetUrl, destFile);

        if (success) {
          sourcesLog.push({ img: `alt-${dCount + 1}.webp`, url: targetUrl });
          dCount++;
        }
      }

      fs.writeFileSync(
        path.join(gameDir, "sources.json"),
        JSON.stringify(sourcesLog, null, 2),
      );

      console.log(`  [v] Salvas ${dCount} imagens WebP (HD) para ${game.id}.`);

      progress[game.id] = true;
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

      const delay = Math.floor(Math.random() * 3000) + 2000;
      await sleep(delay);
    } catch (err) {
      console.error(`  [X] Falha no fluxo para ${game.name}:`, err.message);
      await sleep(5000);
    }
  }

  await browser.close();
  console.log(`\nScraper finalizado com sucesso!`);
}

startScraping();
