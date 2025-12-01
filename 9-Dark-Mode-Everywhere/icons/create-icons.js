/**
 * Icon Generator for Dark Mode Everywhere
 * Run: node create-icons.js
 * 
 * This creates simple PNG icons. For production, use the generate-icons.html
 * in a browser to create high-quality icons.
 */

const fs = require('fs');
const path = require('path');

// Simple 16x16 dark mode icon (base64 encoded PNG)
const icon16Base64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA2ElEQVQ4T2NkoBAwUqifgWoGzP3/n+H/339MDAwM/xgZGBj+//v7j4GJ6R8jA8N/hr9//zMwMfxnZGBg+P/v338GJsZ/jIz/Gf7//feP4T8jEyPDf4Z/f/8z/GdkYmT4z/Dv7z+G/4z/GRn+M/z/+/cf438GJkYGhv8Mf//+Y/j/n4GRgeE/w9+//xj+MTAxMjL8Z/j79y/D/3//GRkY/jP8+/uP4f9/BkaG/wx///5j+M/IxMjwn+Hf338M/xmZGBn+M/z7+4/hPwMTIyPDf4a/f/8x/P/PyAAAoVGxEAFu1KAAAAAASUVORK5CYII=';

// Simple 32x32 dark mode icon
const icon32Base64 = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA3klEQVRYR+2WwQ2AIAxFsY4i4+gIOoKO4Ag6go6gI+gIjuAosuIIO4Kv0UQI2EIl8U4e+K+/v5QGYOY+wD8Cdg7g7k4BHMDVOXnuBNydPPcBHMDdnTx3ARzA3Z08dwEcwN2dPHcBHMDdnTx3ARzA3Z08dwEcwN2dPHcBHMDdnTx3ARzA3Z08dwEcwN2dPHcBHMDdnTx3ARzA3Z08dwEcwN2dPHcBHMDdnTx3ARzA3Z08dwEcwN2dPHcBHMDdnTz3AR7uBPR/gJeTZ0cAd3cK4ACuLpDnXgB3J899AAdwdyfPD1BYQiEQwqF8AAAAAElFTkSuQmCC';

// Simple 48x48 dark mode icon
const icon48Base64 = 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAA5klEQVRoQ+2ZwQ2AIAxFtY4i4+gIOoKO4Ag6go6gI+gIjuAosuKIO4Kv0UQI2EIl8U4e+K+/v5QGYOY+wH8E7BzA3Z0COICrc/LcCbg7ee4DOICrO3nuAjiAuzt57gI4gLs7ee4COIC7O3nuAjiAuzt57gI4gLs7ee4COIC7O3nuAjiAuzt57gI4gLs7ee4COIC7O3nuAjiAuzt57gI4gLs7ee4COIC7O3nuAjiAuzt57gI4gLs7ee4COIC7O3nuAziAu5PnPsDDnYD+D/By8uwI4O5OARzA1QXy3Avg7uS5D+AA7u7k+QEgH3Ah84yMzQAAAABJRU5ErkJggg==';

// Simple 128x128 dark mode icon
const icon128Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAA7UlEQVR4Xu3SwQ0AIAwDsNL9h4YNEBLi0gCd/e6ZZ4HZBR6/QIJBCAYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoJJCCYhmIRgEoL5AI8XQCGBHTH3AAAAAElFTkSuQmCC';

// Create icon files
const icons = {
  'icon16.png': icon16Base64,
  'icon32.png': icon32Base64,
  'icon48.png': icon48Base64,
  'icon128.png': icon128Base64
};

Object.entries(icons).forEach(([filename, base64]) => {
  const buffer = Buffer.from(base64, 'base64');
  const filepath = path.join(__dirname, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`Created ${filename}`);
});

console.log('\nAll icons created successfully!');
console.log('For high-quality icons, open generate-icons.html in a browser.');
