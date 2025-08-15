// copy-visual-diff.js
// Copia recursivamente los archivos de cypress/visual-diff a allure-report/visual-diff
const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach((item) => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyRecursiveSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

const srcDir = path.join(__dirname, 'cypress', 'visual-diff');
const destDir = path.join(__dirname, 'allure-report', 'visual-diff');
copyRecursiveSync(srcDir, destDir);

console.log('Archivos visual-diff copiados a allure-report/visual-diff');
