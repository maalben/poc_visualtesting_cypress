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
  const screenshotsRoot = path.join(__dirname, '../../screenshots');
  const pattern = path.join(screenshotsRoot, '**', `*${baseName}*.png`);
  const matches = glob.sync(pattern);
  console.log('Screenshot search pattern:', pattern);
  console.log('Screenshot matches found:', matches);
  if (matches.length > 0) {
    // 0. Priorizar desktop.cy.js/
    const cyJsDir = `${type}.cy.js`;
    const cyJsNoSuffix = matches.find(f => f.includes(cyJsDir) && f.endsWith(`${baseName}.png`));
    if (cyJsNoSuffix) {
      console.log('Selected screenshot (cy.js, no suffix):', cyJsNoSuffix);
      return cyJsNoSuffix;
    }
    const cyJsWithSuffix = matches.find(f => f.includes(cyJsDir) && /\(\d+\)\.png$/.exec(f));
    if (cyJsWithSuffix) {
      console.log('Selected screenshot (cy.js, with suffix):', cyJsWithSuffix);
      return cyJsWithSuffix;
    }
    // 1. Priorizar subcarpeta de dispositivo/flujo dinámicamente
    // Busca cualquier subcarpeta bajo type/flow
    const typeDirs = matches.filter(f => f.includes(`${path.sep}${type}${path.sep}`));
    // Sin sufijo
    const typeNoSuffix = typeDirs.find(f => f.endsWith(`${baseName}.png`));
    if (typeNoSuffix) {
      console.log('Selected screenshot (type subdir, no suffix):', typeNoSuffix);
      return typeNoSuffix;
    }
    // Con sufijo
    const suffixRegex = /\(\d+\)\.png$/;
    const typeWithSuffix = typeDirs.find(f => suffixRegex.exec(f));
    if (typeWithSuffix) {
      console.log('Selected screenshot (type subdir, with suffix):', typeWithSuffix);
      return typeWithSuffix;
    }
    // 2. Priorizar e2e/type/flow dinámicamente
    const e2eDirs = matches.filter(f => f.includes(`${path.sep}e2e${path.sep}${type}${path.sep}`));
    const e2eNoSuffix = e2eDirs.find(f => f.endsWith(`${baseName}.png`));
    if (e2eNoSuffix) {
      console.log('Selected screenshot (e2e subdir, no suffix):', e2eNoSuffix);
      return e2eNoSuffix;
    }
    const e2eWithSuffix = e2eDirs.find(f => suffixRegex.exec(f));
    if (e2eWithSuffix) {
      console.log('Selected screenshot (e2e subdir, with suffix):', e2eWithSuffix);
      return e2eWithSuffix;
    }
    // 3. Finalmente, evitar mezclar dispositivos: nunca tomar tablet/mobile para desktop
    const filtered = matches.filter(f => {
      if (type === 'desktop') {
        return f.includes('desktop');
      }
      if (type === 'tablet') {
        return f.includes('tablet');
      }
      if (type === 'mobile') {
        return f.includes('mobile');
      }
      return true;
    });
    if (filtered.length > 0) {
      return filtered[0];
    }
    return matches[0];
  }
  return null;
}
// Cypress tasks for visual testing
const fs = require('fs');
const path = require('path');
const { visualConfig } = require('../visualConfig');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

function getBaselinePath(flow, type, name) {
  // Nuevo orden: type/flow/name
  return path.join(__dirname, `../../visual-baseline/${type}`, flow, name);
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
      const screenshotsDir = path.join(__dirname, `../../screenshots/e2e/${type}`, flow);
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
      const screenshotsDir = path.join(__dirname, `../../screenshots/e2e/${type}`, flow);
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
      // Mueve el screenshot recién tomado a la ruta esperada
      const screenshotsRoot = path.join(__dirname, '../../screenshots');
      const destDir = path.join(screenshotsRoot, 'e2e', type, flow);
      const destPath = path.join(destDir, `${name}.png`);
      const glob = require('glob');
      const fs = require('fs');
      // Buscar el screenshot recién generado (puede tener sufijo)
      const pattern = path.join(screenshotsRoot, `${name}*.png`);
      const matches = glob.sync(pattern);
      if (matches.length === 0) {
        return { success: false, error: 'No screenshot found to move.' };
      }
      // Elige el más reciente
      const latest = matches.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
      try {
        // Asegura carpeta destino
        fs.mkdirSync(destDir, { recursive: true });
        fs.renameSync(latest, destPath);
        // Verifica que el archivo existe después de moverlo
        if (fs.existsSync(destPath)) {
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
  // Construir el path del screenshot automáticamente
  const screenshotFile = `${name}.png`;
  // Lógica de actualización selectiva
  const shouldUpdateBaseline = visualConfig.UPDATE_BASELINE_TOTAL || (
    Array.isArray(visualConfig.UPDATE_BASELINE_ONLY) &&
    visualConfig.UPDATE_BASELINE_ONLY.some(entry => entry.type === type && entry.flow === flow)
  );
      const screenshotsDir = path.join(__dirname, `../../screenshots/e2e/${type}`, flow);
      createDirectory(screenshotsDir);
      // Buscar el screenshot en la ruta principal y subcarpetas
      let screenshotPath = findScreenshot(screenshotsDir, screenshotFile, type);
      const exists = screenshotPath && fs.existsSync(screenshotPath);
      console.log('Screenshot path:', screenshotPath, 'Exists:', exists);
      if (!exists) {
        return { success: false, error: `Screenshot not found or not accessible: ${screenshotFile} in ${screenshotsDir}` };
      }
      const baselinePath = getBaselinePath(flow, type, screenshotFile);
      // El screenshot ya está en la ruta destino, no borrar ni renombrar

  if (shouldUpdateBaseline) {
        // Si la imagen baseline no existe, la crea; si existe, la sobreescribe
        createDirectory(path.dirname(baselinePath));
        if (fs.existsSync(screenshotPath)) {
          fs.copyFileSync(screenshotPath, baselinePath);
        } else {
          // Si no existe el screenshot, crea el baseline vacío y reporta como creado
          console.warn('Screenshot not found, creating empty baseline:', baselinePath);
          fs.writeFileSync(baselinePath, Buffer.alloc(0));
          return { success: true, created: true, warning: `Screenshot not found, baseline created empty: ${baselinePath}` };
        }
        const diffDir = path.join(__dirname, `../../visual-diff/${type}`, flow);
        const diffPath = path.join(diffDir, `${name}-diff.png`);
        const htmlPath = path.join(diffDir, `${name}-diff.html`);
        if (fs.existsSync(diffPath)) {
          deleteFile(diffPath, 'Error deleting diff image:');
        }
        if (fs.existsSync(htmlPath)) {
          deleteFile(htmlPath, 'Error deleting diff HTML:');
        }
        return { success: true, updated: true };
      } else {
        if (!fs.existsSync(screenshotPath)) {
          console.error('Screenshot not found at comparison time:', screenshotPath);
          return { success: false, error: `Screenshot not found at comparison time: ${screenshotPath}` };
        }
  // Si la imagen baseline no existe y no estamos en modo UPDATE_BASELINE_TOTAL, no crear ni comparar, pasar la prueba
        if (!fs.existsSync(baselinePath)) {
          return { success: true, skipped: true, message: 'Baseline no existe y UPDATE_BASELINE_TOTAL es false. Prueba pasada sin comparar ni crear baseline.' };
        }
        // Para la comparación, usa la ruta destino donde se acaba de copiar el screenshot
        const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
        const img2 = PNG.sync.read(fs.readFileSync(screenshotPath));
        const { width, height } = img1;
        // Determinar áreas a ignorar para este módulo y tipo
        let ignoreAreas = [];
        if (visualConfig.IGNORE_AREAS?.[flow]?.[type]) {
          ignoreAreas = visualConfig.IGNORE_AREAS[flow][type];
        }
        // Guardar en global para que createDiff lo use
        global.visualConfig = global.visualConfig || {};
        global.visualConfig._ignoreAreasToMask = ignoreAreas;
        const diffDir = path.join(__dirname, `../../visual-diff/${type}`, flow);
        let diffPath = path.join(diffDir, `${name}-diff.png`);
        const numDiffPixels = createDiff({ img1, img2, width, height, diffPath });
        if (numDiffPixels > 0) {
          createDirectory(diffDir);
          // Generar HTML con las tres imágenes y devolverlo embebido en el error
          // Usar rutas relativas desde allure-report/visual-diff/... para que funcionen en el reporte
          const relScreenshot = path.relative(diffDir, screenshotPath);
          const relBaseline = path.relative(diffDir, baselinePath);
          // Definir projectRoot antes de usarlo
          const projectRoot = path.resolve(__dirname, '../../..');
          // Si estamos en allure-report, ajustar ruta para iframe
          const allureVisualDiffDir = path.join(projectRoot, 'allure-report', 'visual-diff', type, flow);
          // Usar rutas relativas para la imagen diff, igual que para screenshot y baseline
          // La imagen diff debe referenciarse con la ruta relativa desde el HTML generado
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

          // --- COPIAR DIFF A allure-results PARA QUE SEA DESCARGABLE EN EL REPORTE ---
          try {
            // Obtener la raíz del proyecto (dos niveles arriba de cypress/)
            const projectRoot = path.resolve(__dirname, '../../..');
            const allureAttachmentsBase = path.join(projectRoot, 'allure-report/data/attachments');
            const allureAttachmentsDir = path.join(allureAttachmentsBase, type, flow);
            createDirectory(allureAttachmentsDir);
            // Guardar con nombre simple: name-diff.png y name-diff.html
            const allureDiffName = `${name}-diff.png`;
            const allureDiffPath = path.join(allureAttachmentsDir, allureDiffName);
            fs.copyFileSync(diffPath, allureDiffPath);
            // También copiar el HTML autosuficiente si se desea descargar
            const allureHtmlName = `${name}-diff.html`;
            const allureHtmlPath = path.join(allureAttachmentsDir, allureHtmlName);
            fs.copyFileSync(htmlPath, allureHtmlPath);
          } catch (err) {
            console.error('Error copiando archivos diff a allure-results:', err);
          }
          // --- FIN COPIA ---

          return { success: false, diffPath, numDiffPixels, html, htmlPath };
        } else {
          // Si la comparación es correcta, eliminar el HTML si existe
          const htmlPath = path.join(diffDir, `${name}-diff.html`);
          if (fs.existsSync(htmlPath)) {
            deleteFile(htmlPath, 'Error deleting diff HTML (no differences):');
          }
          // Si existe el diff.png (por error previo), eliminarlo
          if (fs.existsSync(diffPath)) {
            deleteFile(diffPath, 'Error deleting diff PNG (no differences):');
          }
          return { success: true, updated: false };
        }
      }
    },
    fileExists(filePath) {
      const fs = require('fs');
      return fs.existsSync(filePath);
    },

    cleanVisualDiffDirs() {
      // Limpia carpetas vacías en visual-diff
      const path = require('path');
      const fs = require('fs');
      const visualDiffRoot = path.join(__dirname, '../../visual-diff');
      if (fs.existsSync(visualDiffRoot)) {
        removeEmptyDirs(visualDiffRoot);
      }
      return { success: true };
    }
  });
};
