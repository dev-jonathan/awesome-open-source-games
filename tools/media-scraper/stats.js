const fs = require('fs');
const path = require('path');

const candidatesDir = path.join(__dirname, 'out/candidates');

if (!fs.existsSync(candidatesDir)) {
    console.log("Pasta de candidatos ainda não existe. O robô gerou alguma coisa?");
    process.exit(0);
}

let size = 0;
let count = 0;

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(f => {
        const file = path.join(dir, f);
        const stat = fs.statSync(file);
        if (stat.isDirectory()) {
            walk(file);
        } else if (f.endsWith('.webp')) {
            size += stat.size;
            count++;
        }
    });
}

walk(candidatesDir);

console.log('--- RELATÓRIO DO SCRAPER ---');
console.log('Total de Imagens WebP Cortadas:', count);
console.log('Tamanho Total no Disco:', (size / 1024 / 1024).toFixed(2), 'MB');
if (count > 0) {
    console.log('Media de peso por imagem:', ((size / count) / 1024).toFixed(1), 'KB (Incrívelmente Otimizado!)');
}
