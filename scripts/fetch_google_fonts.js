import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

fetch('https://fonts.google.com/metadata/fonts')
  .then(res => res.text())
  .then(text => {
    let cleaned = text;
    if (text.startsWith(")]}'")) {
      cleaned = text.substring(4);
    }
    const data = JSON.parse(cleaned);
    
    const arabic = [];
    const allNames = [];

    data.familyMetadataList.forEach(font => {
      allNames.push(font.family);
      
      if (font.subsets.includes('arabic')) {
        const weights = Object.keys(font.fonts).map(k => parseInt(k.replace('i', ''), 10));
        const uniqueWeights = [...new Set(weights)].sort((a, b) => a - b);
        
        arabic.push({
          family: font.family,
          category: font.category,
          weights: uniqueWeights
        });
      }
    });

    const output = {
      arabic: arabic.sort((a, b) => a.family.localeCompare(b.family)),
      all: allNames.sort()
    };

    const targetPath = path.join(__dirname, '../src/google-fonts.json');
    fs.writeFileSync(targetPath, JSON.stringify(output, null, 2));
    console.log(`Successfully wrote ${output.arabic.length} Arabic fonts and ${output.all.length} total fonts to ${targetPath}`);
  })
  .catch(err => console.error(err));
