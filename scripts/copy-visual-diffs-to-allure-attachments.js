// Script para copiar los diffs visuales y HTML autosuficiente a allure-report/data/attachments
const fs = require('fs');
const path = require('path');

// Origen: visual-diff/{type}/{flow}/*.png, *.html
const visualDiffRoot = path.join(__dirname, '../visual-diff');

// Destino: carpeta de timestamp bajo allure-report/data/attachments/<timestamp> (por argumento)
let timestampDir = process.argv[2];
if (!timestampDir) {
  console.error('[copy-visual-diffs] Debe proveer la ruta de destino (attachments/timestamp) como argumento');
  process.exit(1);
}


// Crear la carpeta de timestamp si no existe (debe ejecutarse después de que Allure genera los attachments)
if (!fs.existsSync(timestampDir)) fs.mkdirSync(timestampDir, { recursive: true });


// Copiar toda la carpeta visual-diff dentro de la carpeta de timestamp, preservando estructura
function copyRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.readdirSync(srcDir).forEach(item => {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, 'visual-diff', item);
    if (fs.statSync(srcPath).isDirectory()) {
      if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, path.join(destDir, 'visual-diff', item));
    } else {
      const parentDir = path.dirname(destPath);
      if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      console.log(`[copy-visual-diffs] Copiado: ${srcPath} -> ${destPath}`);
    }
  });
}

copyRecursive(visualDiffRoot, timestampDir);
console.log('[copy-visual-diffs] Copia finalizada.');
