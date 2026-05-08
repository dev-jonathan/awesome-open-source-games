const fs = require('fs');
const path = require('path');

const README_PATH = path.join(__dirname, '../../README.md');
const OUTPUT_PATH = path.join(__dirname, '../src/data/games.json');

function normalizeString(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseReadme() {
  console.log('🚀 Starting README.md parser...');

  if (!fs.existsSync(README_PATH)) {
    console.error(`❌ Error: ${README_PATH} not found.`);
    return;
  }

  const content = fs.readFileSync(README_PATH, 'utf-8');
  const lines = content.split('\n');

  const games = [];

  let currentCategory = '';
  let currentSubcategory = '';

  const validGameCategories = ['Browser-Based', 'Native', 'Mobile Games'];
  const advancedCategories = [
    'Just The Source',
    'Frameworks/Engines/Libraries',
    'Maps/Hacks/Plugins/Utilities/All of the Things™',
    'Chat bots',
  ];
  const companyCategory = 'Major Companies';

  const itemRegex = /^\s*-\s+\[(.*?)\]\((.*?)\)(?:\s*-\s*(.*))?$/;
  const companyRegex = /\[<img.*?title="(.*?)".*?>\]\((.*?)\)/g;

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Detect main categories (##)
    if (trimmedLine.startsWith('## ')) {
      currentCategory = trimmedLine.replace('## ', '').trim();
      currentSubcategory = '';
      return;
    }

    // Detect subcategories (###)
    if (trimmedLine.startsWith('### ')) {
      currentSubcategory = trimmedLine.replace('### ', '').trim();
      return;
    }

    const isGame = validGameCategories.includes(currentCategory);
    const isAdvanced = advancedCategories.includes(currentCategory);
    const isMajorCompany = currentCategory === companyCategory;

    if (!isGame && !isAdvanced && !isMajorCompany) return;

    // CASE 1: Major Companies setup
    if (isMajorCompany && trimmedLine.includes('<img')) {
      let match;
      while ((match = companyRegex.exec(trimmedLine)) !== null) {
        const name = match[1];
        const id = `company-${name.toLowerCase().replace(/\s+/g, '-')}`;

        const existing = games.find((g) => g.id === id);
        if (existing) {
          if (!existing.links.includes(match[2])) existing.links.push(match[2]);
        } else {
          games.push({
            id,
            name,
            link: match[2],
            links: [match[2]],
            description: 'Major game studio/publisher',
            category: currentCategory,
            subcategory: '',
            tags: [currentCategory],
            isAdvanced: false,
            isCompany: true,
          });
        }
      }
      return;
    }

    // CASE 2: Capture Items (Games and Tools)
    const match = trimmedLine.match(itemRegex);
    if (match) {
      const name = match[1].trim();
      const link = match[2].trim();
      const description = (match[3] || '').trim();

      const baseName = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const normalizedName = normalizeString(name);
      const normalizedDesc = normalizeString(description);

      // Duplicate check based on highly similar name AND description
      const existingGame = games.find((g) => {
        return (
          normalizeString(g.name) === normalizedName &&
          normalizeString(g.description) === normalizedDesc
        );
      });

      if (existingGame) {
        // Merge with existing game to avoid duplicates (e.g. cross-platform games)
        if (!existingGame.links.includes(link)) {
          existingGame.links.push(link);
        }

        const combinedTags = new Set([
          ...existingGame.tags,
          currentCategory,
          ...(currentSubcategory ? [currentSubcategory] : []),
        ]);

        existingGame.tags = Array.from(combinedTags);
      } else {
        // New unique game
        const countSoFar = games.filter((g) => g._baseName === baseName).length;
        const id =
          countSoFar === 0 ? baseName : `${baseName}--${countSoFar + 1}`;

        games.push({
          id,
          _baseName: baseName, // internal, used for collision counting
          name,
          link,
          links: [link],
          description,
          category: currentCategory,
          subcategory: currentSubcategory,
          tags: [currentCategory, currentSubcategory].filter(Boolean),
          isAdvanced: isAdvanced,
          isCompany: false,
        });
      }
    }
  });

  // Remove internal helper field before saving
  games.forEach((g) => delete g._baseName);

  // Save to Output
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(games, null, 2), 'utf-8');
  console.log(
    `✅ Success: ${games.length} entries exported to ${OUTPUT_PATH}!`,
  );
}

parseReadme();
