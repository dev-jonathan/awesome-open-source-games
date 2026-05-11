// copy de readme here
const markdownList = `
- [Hextris](https://github.com/Hextris/hextris)
- [Hexahedral](https://github.com/mminer/hexahedral)
- [Inexistente](https://github.com/github/repo-que-nao-existe-12345)
`;

// Regex
const linkRegex = /https:\/\/github\.com\/[\w-]+\/[\w.-]+(?=\)|$|\s)/g;

async function checkLinks() {
  const links = [...new Set(markdownList.match(linkRegex))];
  console.log(`🚀 Checking ${links.length} links...\n`);

  const results = await Promise.all(
    links.map(async (url) => {
      try {
        // fetch
        const res = await fetch(url, {
          method: "GET",
          headers: { "User-Agent": "Mozilla/5.0" },
        });

        if (res.status === 404) return { url, status: "❌ 404 - Not Found" };
        if (res.ok) return { url, status: "✅ OK" };

        return { url, status: `⚠️ Status: ${res.status}` };
      } catch (err) {
        return { url, status: "🔥 ERROR" };
      }
    }),
  );

  console.table(results);
}

checkLinks();
