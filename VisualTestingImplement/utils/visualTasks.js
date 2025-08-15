// Elimina recursivamente carpetas vacías dentro de un directorio dado
function removeEmptyDirs(dir) {
  const fs = require('fs');
  const path = require('path');
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
  // Si después de limpiar subcarpetas, la carpeta está vacía, eliminarla
  if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
  }
}
const glob = require('glob');
function findScreenshot(screenshotsDir, screenshotFile, type) {
  const directPath = path.join(screenshotsDir, screenshotFile);
  if (fs.existsSync(directPath)) {
    return directPath;
  }
  const baseName = path.basename(screenshotFile, '.png');
  const screenshotsRoot = path.join(__dirname, '../evidences/visual-actual');
  const pattern = path.join(screenshotsRoot, '**', `*${baseName}*.png`);
  const matches = glob.sync(pattern);
  if (matches.length === 0) return null;
  // Prioridad: type/flow/name.png sin sufijo
  const typeDir = matches.filter(f => f.includes(`${path.sep}${type}${path.sep}`));
  const noSuffix = typeDir.find(f => f.endsWith(`${baseName}.png`));
  if (noSuffix) return noSuffix;
  // Con sufijo (ej: name(1).png)
  const suffixRegex = /\(\d+\)\.png$/;
  const withSuffix = typeDir.find(f => suffixRegex.exec(f));
  if (withSuffix) return withSuffix;
  // Si no, devolver el primero que coincida
  return matches[0];
}
// Cypress tasks for visual testing
const fs = require('fs');
const path = require('path');
const { visualConfig } = require('../config/visualConfig');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

function getBaselinePath(flow, type, name) {
  // Nuevo orden: type/flow/name
  return path.join(__dirname, `../evidences/visual-baseline/${type}`, flow, name);
}

function createDirectory(pathStr) {
  try {
    fs.mkdirSync(pathStr, { recursive: true });
  } catch (err) {
    console.error(`Error creating directory ${pathStr}:`, err);
  }
}

function deleteFile(pathStr, errorMsg) {
  try {
    fs.unlinkSync(pathStr);
  } catch (err) {
    console.error(errorMsg, err);
  }
}

function createDiff({ img1, img2, width, height, diffPath }) {
  const diff = new PNG({ width, height });
  // Enmascarar áreas ignoradas antes de comparar
  if (global.visualConfig?._ignoreAreasToMask) {
    const areas = global.visualConfig._ignoreAreasToMask;
    areas.forEach(area => {
      maskArea(img1, area);
      maskArea(img2, area);
    });
  }
  const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
  console.log('[VisualTesting] Diff pixels:', numDiffPixels, 'Diff path:', diffPath);
  if (numDiffPixels > 0) {
    try {
      // Asegura que la carpeta destino existe
      fs.mkdirSync(path.dirname(diffPath), { recursive: true });
      console.log('[VisualTesting] Writing diff image to:', diffPath);
      fs.writeFileSync(diffPath, PNG.sync.write(diff));
      console.log('[VisualTesting] Diff image written:', fs.existsSync(diffPath));
    } catch (err) {
      console.error('[VisualTesting] Error writing diff image:', err);
    }
  }
  return numDiffPixels;
}
// Enmascara un área rectangular en una imagen PNG
function maskArea(png, area, color = { r: 255, g: 255, b: 255, a: 255 }) {
  for (let y = area.y; y < area.y + area.height; y++) {
    for (let x = area.x; x < area.x + area.width; x++) {
      const idx = (png.width * y + x) << 2;
      png.data[idx] = color.r;
      png.data[idx + 1] = color.g;
      png.data[idx + 2] = color.b;
      png.data[idx + 3] = color.a;
    }
  }
}

module.exports = (on, config) => {
  on('task', {
    deleteScreenshots({ flow, type, name }) {
      // Limpia imágenes previas con y sin sufijo en la carpeta destino
  const screenshotsDir = path.join(__dirname, `../evidences/visual-actual/${type}`, flow);
      const baseName = `${name}`;
      const pattern = path.join(screenshotsDir, `${baseName}*.png`);
      const glob = require('glob');
      const fs = require('fs');
      const matches = glob.sync(pattern);
      let deleted = 0;
      matches.forEach(file => {
        try {
          fs.unlinkSync(file);
          deleted++;
        } catch (err) {
          console.error('Error deleting screenshot:', file, err);
        }
      });
      return { success: true, deleted };
    },
    ensureScreenshotDir({ flow, type, name }) {
  const screenshotsDir = path.join(__dirname, `../evidences/visual-actual/${type}`, flow);
      const fs = require('fs');
      try {
        fs.mkdirSync(screenshotsDir, { recursive: true });
        return { success: true };
      } catch (err) {
        console.error('Error creating screenshot dir:', screenshotsDir, err);
        return { success: false, error: err.message };
      }
    },
    moveScreenshot({ flow, type, name }) {
      // Mueve el screenshot recién tomado desde cypress/screenshots/... a la nueva ruta centralizada
      const legacyScreenshotsRoot = path.resolve(__dirname, '../../cypress/screenshots');
      const glob = require('glob');
      const fs = require('fs');
      // Buscar el screenshot recién generado en la ruta legacy (puede tener sufijo)
      const pattern = path.join(legacyScreenshotsRoot, `${type}.cy.js`, `${name}*.png`);
      const matches = glob.sync(pattern);
      if (matches.length === 0) {
        return { success: false, error: 'No screenshot found to move in legacy path.' };
      }
      // Elige el más reciente
      const latest = matches.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
      // Carpeta destino
  const destDir = path.join(__dirname, '../evidences/visual-actual', type, flow);
      const destPath = path.join(destDir, `${name}.png`);
      try {
        fs.mkdirSync(destDir, { recursive: true });
        fs.renameSync(latest, destPath);
        if (fs.existsSync(destPath)) {
          if (fs.existsSync(latest)) {
            fs.unlinkSync(latest);
          }
          return { success: true, moved: destPath };
        } else {
          return { success: false, error: 'Screenshot not found after move.' };
        }
      } catch (err) {
        console.error('Error moving screenshot:', err);
        return { success: false, error: err.message };
      }
    },
    updateBaseline({ flow, type, name }) {
      // Parameter validation
      if (!flow || !type || !name) {
        return { success: false, error: 'Missing required parameters: flow, type, name.' };
      }
      const screenshotFile = `${name}.png`;
      const shouldUpdateBaseline = visualConfig.UPDATE_BASELINE_TOTAL || (
        Array.isArray(visualConfig.UPDATE_BASELINE_ONLY) &&
        visualConfig.UPDATE_BASELINE_ONLY.some(entry => entry.type === type && entry.flow === flow)
      );
  const screenshotsDir = path.join(__dirname, `../evidences/visual-actual/${type}`, flow);
      createDirectory(screenshotsDir);
      let screenshotPath = findScreenshot(screenshotsDir, screenshotFile, type);
      const exists = screenshotPath && fs.existsSync(screenshotPath);
      if (!exists) {
        return { success: false, error: `Screenshot not found or not accessible: ${screenshotFile} in ${screenshotsDir}` };
      }
      const baselinePath = getBaselinePath(flow, type, screenshotFile);
      // --- LÓGICA CONDICIONAL AVANZADA ---
      // Si UPDATE_BASELINE_TOTAL está activo, solo crear baseline y limpiar diffs
      if (shouldUpdateBaseline) {
        createDirectory(path.dirname(baselinePath));
        if (fs.existsSync(screenshotPath)) {
          fs.copyFileSync(screenshotPath, baselinePath);
        } else {
          fs.writeFileSync(baselinePath, Buffer.alloc(0));
          return { success: true, created: true, warning: `Screenshot not found, baseline created empty: ${baselinePath}` };
        }
        // Limpiar diffs y HTML si existen
        const diffDir = path.join(__dirname, `../evidences/visual-diff/${type}`, flow);
        const diffPath = path.join(diffDir, `${name}-diff.png`);
        const htmlPath = path.join(diffDir, `${name}-diff.html`);
        if (fs.existsSync(diffPath)) {
          deleteFile(diffPath, 'Error deleting diff image:');
        }
        if (fs.existsSync(htmlPath)) {
          deleteFile(htmlPath, 'Error deleting diff HTML:');
        }
        return { success: true, updated: true, screenshotPath, baselinePath };
      }
      // Si no hay baseline y no estamos en modo UPDATE_BASELINE_TOTAL, no crear ni comparar, pasar la prueba
      if (!fs.existsSync(baselinePath)) {
        return { success: true, skipped: true, message: 'Baseline no existe y UPDATE_BASELINE_TOTAL es false. Prueba pasada sin comparar ni crear baseline.', screenshotPath };
      }
      // Comparación visual
      const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
      const img2 = PNG.sync.read(fs.readFileSync(screenshotPath));
      const { width, height } = img1;
      let ignoreAreas = [];
      if (visualConfig.IGNORE_AREAS?.[flow]?.[type]) {
        ignoreAreas = visualConfig.IGNORE_AREAS[flow][type];
      }
      global.visualConfig = global.visualConfig || {};
      global.visualConfig._ignoreAreasToMask = ignoreAreas;
      const diffDir = path.join(__dirname, `../evidences/visual-diff/${type}`, flow);
      let diffPath = path.join(diffDir, `${name}-diff.png`);
      const numDiffPixels = createDiff({ img1, img2, width, height, diffPath });
      if (numDiffPixels > 0) {
        createDirectory(diffDir);
        const relScreenshot = path.relative(diffDir, screenshotPath);
        const relBaseline = path.relative(diffDir, baselinePath);
        const projectRoot = path.resolve(__dirname, '../../..');
        const relDiff = `../../../visual-diff/${type}/${flow}/${name}-diff.png`;
        const html = `
          <html>
          <head>
            <title>Visual Diff - ${type} - ${flow}</title>
            <style>
              html, body { height: 100%; margin: 0; padding: 0; }
              body { font-family: sans-serif; min-height: 100vh; }
              table { border-collapse: collapse; width: 100%; }
              th, td { padding: 8px; border: 1px solid #ccc; vertical-align: top; }
              img { max-width: 100%; max-height: 90vh; display: block; margin: 0 auto; }
            </style>
          </head>
          <body>
            <h2>Visual Diff: ${type} - ${flow}</h2>
            <table>
              <tr>
                <th>Actual</th>
                <th>Baseline</th>
                <th>Difference</th>
              </tr>
              <tr>
                <td><img src="${relScreenshot}" alt="Actual"></td>
                <td><img src="${relBaseline}" alt="Baseline"></td>
                <td><img src="${relDiff}" alt="Diff"></td>
              </tr>
            </table>
            <p>Differences detected: <b>${numDiffPixels}</b></p>
          </body>
          </html>
        `;
        fs.writeFileSync(path.join(diffDir, `${name}-diff.html`), html);
        const htmlPath = path.join(diffDir, `${name}-diff.html`);
        // Copiar diff y HTML a allure-results
        try {
          const projectRoot = path.resolve(__dirname, '../../..');
          const allureAttachmentsBase = path.join(projectRoot, 'allure-report/data/attachments');
          const allureAttachmentsDir = path.join(allureAttachmentsBase, type, flow);
          createDirectory(allureAttachmentsDir);
          const allureDiffName = `${name}-diff.png`;
          const allureDiffPath = path.join(allureAttachmentsDir, allureDiffName);
          fs.copyFileSync(diffPath, allureDiffPath);
          const allureHtmlName = `${name}-diff.html`;
          const allureHtmlPath = path.join(allureAttachmentsDir, allureHtmlName);
          fs.copyFileSync(htmlPath, allureHtmlPath);
        } catch (err) {
          console.error('Error copiando archivos diff a allure-results:', err);
        }
        return { success: false, diffPath, numDiffPixels, html, htmlPath, baselinePath, screenshotPath };
      } else {
        // Si la comparación es correcta, eliminar el HTML y diff si existen
        const htmlPath = path.join(diffDir, `${name}-diff.html`);
        if (fs.existsSync(htmlPath)) {
          deleteFile(htmlPath, 'Error deleting diff HTML (no differences):');
        }
        if (fs.existsSync(diffPath)) {
          deleteFile(diffPath, 'Error deleting diff PNG (no differences):');
        }
        return { success: true, updated: false, screenshotPath, baselinePath };
      }
    },
    fileExists(filePath) {
      const fs = require('fs');
      return fs.existsSync(filePath);
    },

    cleanVisualDirs() {
      // Limpia carpetas vacías en visual-diff y screenshots
      const path = require('path');
      const fs = require('fs');
      // Limpieza visual-diff
    const visualDiffRoot = path.join(__dirname, '../evidences/visual-diff');
      if (fs.existsSync(visualDiffRoot)) {
        removeEmptyDirs(visualDiffRoot);
      }
      // Limpieza visual-actual centralizada
    const visualActualRoot = path.join(__dirname, '../evidences/visual-actual');
      if (fs.existsSync(visualActualRoot)) {
        removeEmptyDirs(visualActualRoot);
      }
      // Limpieza contenido de cypress/screenshots (legacy, sin borrar la carpeta)
      const legacyScreenshotsRoot = path.resolve(__dirname, '../../cypress/screenshots');
      if (fs.existsSync(legacyScreenshotsRoot)) {
        const fs = require('fs');
        const path = require('path');
        fs.readdirSync(legacyScreenshotsRoot).forEach(item => {
          const itemPath = path.join(legacyScreenshotsRoot, item);
          if (fs.statSync(itemPath).isDirectory()) {
            removeEmptyDirs(itemPath);
            if (fs.existsSync(itemPath) && fs.readdirSync(itemPath).length === 0) {
              fs.rmdirSync(itemPath);
            }
          } else {
            fs.unlinkSync(itemPath);
          }
        });
      }
      return { success: true };
    }
  });
};
