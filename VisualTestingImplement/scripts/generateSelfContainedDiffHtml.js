// Script para generar un HTML autosuficiente con imágenes embebidas en base64 para visual diff
// Uso: node generateSelfContainedDiffHtml.js <flow> <type> <name>

const fs = require('fs');
const path = require('path');

function imgToBase64(imgPath) {
  if (!fs.existsSync(imgPath)) {
    console.warn('No existe la imagen para embebida:', imgPath);
    return '';
  }
  const ext = path.extname(imgPath).slice(1); // 'png'
  const data = fs.readFileSync(imgPath);
  console.log('Imagen embebida:', imgPath, 'Tamaño:', data.length);
  return `data:image/${ext};base64,${data.toString('base64')}`;
}

const [,, flow, type, name] = process.argv;
if (!flow || !type || !name) {
  console.error('Uso: node generateSelfContainedDiffHtml.js <flow> <type> <name>');
  process.exit(1);
}

const projectRoot = process.cwd();
const actualPath = path.join(projectRoot, 'VisualTestingImplement', 'evidences', 'visual-actual', type, flow, `${name}.png`);
const baselinePath = path.join(projectRoot, 'VisualTestingImplement', 'evidences', 'visual-baseline', type, flow, `${name}.png`);
const diffPath = path.join(projectRoot, 'VisualTestingImplement', 'evidences', 'visual-diff', type, flow, `${name}-diff.png`);

const html = `
<html>
  <head>
    <title>Visual Difference - ${type} - ${flow}</title>
    <style>
      html, body { height: 100%; margin: 0; padding: 0; }
      body { font-family: sans-serif; min-height: 100vh; }
      table { border-collapse: collapse; width: 100%; }
      th, td { padding: 8px; border: 1px solid #ccc; vertical-align: top; }
      img { max-width: 100%; max-height: 100vh; display: block; margin: 0 auto; }
    </style>
  </head>
  <body>
    <h2>Visual Difference: ${type} - ${flow}</h2>
    <table>
      <tr>
        <th>Actual</th>
        <th>Baseline</th>
        <th>Difference</th>
      </tr>
      <tr>
        <td><img src="${imgToBase64(actualPath)}" alt="Actual"></td>
        <td><img src="${imgToBase64(baselinePath)}" alt="Baseline"></td>
        <td><img src="${imgToBase64(diffPath)}" alt="Diff"></td>
      </tr>
    </table>
  </body>
</html>
`;

const outputHtml = path.join(projectRoot, 'VisualTestingImplement', 'evidences', 'visual-diff', flow, type, `${name}-diff-selfcontained.html`);
fs.writeFileSync(outputHtml, html);
console.log('HTML autosuficiente generado en:', outputHtml);
