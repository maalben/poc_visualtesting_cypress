// Script para modificar el HTML de Allure Report e insertar información sobre los visual diffs
const fs = require('fs');
const path = require('path');


// Permitir pasar la ruta de la carpeta de timestamp como argumento
const timestampDir = process.argv[2];
const allureReportDir = path.join(__dirname, '../allure-report');
const allureReportIndex = path.join(allureReportDir, 'index.html');

if (!timestampDir || !fs.existsSync(timestampDir)) {
  console.error('[patch-allure-report-html] Debe proveer la ruta de la carpeta de timestamp con los diffs como argumento');
  process.exit(1);
}
if (!fs.existsSync(allureReportIndex)) {
  console.error('[patch-allure-report-html] No se encontró allure-report/index.html');
  process.exit(1);
}


// Buscar todos los archivos y carpetas dentro de la carpeta de timestamp (estructura recursiva)
function listAllFiles(dir, base = dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  fs.readdirSync(dir).forEach(item => {
    const fullPath = path.join(dir, item);
    const relPath = path.relative(base, fullPath);
    if (fs.statSync(fullPath).isDirectory()) {
      results.push({ type: 'dir', path: relPath });
      results = results.concat(listAllFiles(fullPath, base));
    } else {
      results.push({ type: 'file', path: relPath });
    }
  });
  return results;
}

const allFiles = listAllFiles(timestampDir);

let html = fs.readFileSync(allureReportIndex, 'utf8');

// Inserta una sección al final del body con los diffs encontrados
const marker = '</body>';

let section = '\n<!-- Visual Diffs Auto-Insert -->\n<div style="padding:24px 0 0 0;">\n  <h2 style="color:#d32f2f;">Archivos de Attachments por ejecución</h2>\n  <ul style="font-size:1.1em;">';
allFiles.forEach(entry => {
  if (entry.type === 'dir') {
    section += `\n    <li><b>[Carpeta]</b> ${entry.path}</li>`;
  } else {
    section += `\n    <li><a href="data/attachments/${path.basename(timestampDir)}/${entry.path.replace(/\\/g, '/')}" target="_blank">${entry.path}</a></li>`;
  }
});
section += '\n  </ul>\n  <div style="color:#888;font-size:0.95em;">(Todo el contenido generado por la ejecución, incluyendo legacy y visual-diff, está aquí)</div>\n</div>\n<!-- /Visual Diffs Auto-Insert -->\n';

if (html.includes(marker)) {
  html = html.replace(marker, section + marker);
  fs.writeFileSync(allureReportIndex, html, 'utf8');
  console.log('[patch-allure-report-html] Se insertó la sección de visual diffs en el reporte.');
} else {
  console.warn('[patch-allure-report-html] No se encontró el marcador </body> en el HTML.');
}
