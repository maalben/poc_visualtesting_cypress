// Script standalone para limpiar carpetas visual-diff y screenshots (incluyendo legacy)
const path = require('path');
const fs = require('fs');

function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  if (files.length === 0) {
    fs.rmdirSync(dir);
    return;
  }
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      removeEmptyDirs(fullPath);
    }
  });
  if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
  }
}

// Limpieza visual-diff centralizada
const visualDiffRoot = path.join(__dirname, '../evidences/visual-diff');
if (fs.existsSync(visualDiffRoot)) {
  removeEmptyDirs(visualDiffRoot);
}

// Limpieza recursiva de contenido en cypress/screenshots (sin borrar la carpeta principal)
function removeAllContents(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(item => {
    const itemPath = path.join(dir, item);
    if (fs.statSync(itemPath).isDirectory()) {
      removeAllContents(itemPath);
      if (fs.existsSync(itemPath) && fs.readdirSync(itemPath).length === 0) {
        fs.rmdirSync(itemPath);
      }
    } else {
      fs.unlinkSync(itemPath);
    }
  });
}
const legacyScreenshotsRoot = path.resolve(__dirname, '../../cypress/screenshots');
removeAllContents(legacyScreenshotsRoot);

console.log('Carpetas visual-diff y screenshots limpiadas correctamente.');
