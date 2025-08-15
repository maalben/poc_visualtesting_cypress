// Utilidad para visual testing en Cypress
class VisualTestHelper {
  /**
   * Captura screenshot y ejecuta la comparación visual.
   * @param {string} flow - Nombre del flujo (ej: 'registration')
   * @param {string} name - Nombre del screenshot (sin extensión)
   * @param {string} type - Tipo de dispositivo ('Desktop', 'Tablet', 'Mobile')
   */
  static captureAndCompare(flow, name, type) {
    cy.window().its('document.readyState').should('eq', 'complete');
    cy.scrollTo('top');
    const { visualConfig } = require('../visualConfig');
    const { width, height } = visualConfig.VIEWPORTS[type];
    cy.viewport(width, height);
    cy.document().then(doc => {
      const style = doc.createElement('style');
      style.innerHTML = '* { cursor: none !important; }';
      style.setAttribute('data-cy-hide-cursor', 'true');
      doc.head.appendChild(style);
    });
    cy.document().then(doc => {
      const style = doc.createElement('style');
      style.innerHTML = `* { transition: none !important; animation: none !important; }`;
      style.setAttribute('data-cy-no-animations', 'true');
      doc.head.appendChild(style);
    });
    cy.document().then(doc => {
      const style = doc.createElement('style');
      style.innerHTML = '*:hover, *:focus, *:active { pointer-events: none !important; background: none !important; color: inherit !important; box-shadow: none !important; outline: none !important; }';
      style.setAttribute('data-cy-disable-hover', 'true');
      doc.head.appendChild(style);
    });
    cy.document().then(doc => {
      doc.dispatchEvent(new MouseEvent('mousemove', { clientX: 0, clientY: 0 }));
    });
    cy.get('body').click(0, 0, { force: true });
    Cypress.$(':focus').blur();
    cy.wait(300);
    cy.task('ensureScreenshotDir', { flow, type, name })
      .then(() => {
        return cy.task('deleteScreenshots', { flow, type, name });
      })
      .then(() => {
        return cy.screenshot(`${name}`);
      })
      .then(() => {
        return cy.task('moveScreenshot', { flow, type, name });
      })
      .then(() => {
        return cy.wait(200);
      })
      .then(() => cy.task('updateBaseline', { flow, type, name }))
      .then((result) => {
        if (!result.success) {
          // Generar HTML autosuficiente antes de adjuntar a Allure
          const { execSync } = require('child_process');
          const path = require('path');
          const projectRoot = process.cwd();
          const scriptPath = path.join(projectRoot, 'generateSelfContainedDiffHtml.js');
          const flowSafe = flow.replace(/"/g, '');
          try {
            execSync(`node "${scriptPath}" "${flowSafe}" "${type}" "${name}"`, { stdio: 'inherit' });
          } catch (e) {
            console.error('Error generando HTML autosuficiente:', e);
          }
          // Asegura que la ruta sea exactamente igual a la que genera el script
          // Nuevo orden: cypress/visual-diff/flow/type/name-diff-selfcontained.html
          const selfContainedHtmlPath = path.join(projectRoot, 'cypress', 'visual-diff', flow, type, `${name}-diff-selfcontained.html`);
          // Log explícito para depuración de ruta
          // eslint-disable-next-line no-console
          console.log('[VisualTestHelper] Ruta esperada del HTML autosuficiente:', selfContainedHtmlPath);
          const errorMsg = `
            <b style='color:#d32f2f;font-size:1.2em;'>❌ Visual regression detected</b><br>
            <ul style='margin-top:8px;'>
              <li><b>Actual:</b> Image generated during execution</li>
              <li><b>Baseline:</b> Expected image</li>
              <li><b>Difference:</b> Differences detected (Red areas)</li>
            </ul>
          `;
          cy.allure().descriptionHtml(errorMsg);
          if (result.htmlPath) {
            cy.allure().fileAttachment('Visual Testing Difference', result.htmlPath, 'text/html');
          }
          cy.task('fileExists', selfContainedHtmlPath).then((exists) => {
            if (exists) {
              cy.allure().fileAttachment('Visual Diff HTML (autosuficiente)', selfContainedHtmlPath, 'text/html');
            }
          });
          if (result.baselinePath) {
            cy.allure().fileAttachment('Baseline', result.baselinePath, 'image/png');
          }
          if (result.screenshotPath) {
            cy.allure().fileAttachment('Actual', result.screenshotPath, 'image/png');
          }
          if (result.diffPath) {
            cy.allure().fileAttachment('Diff', result.diffPath, 'image/png');
          }
          cy.wait(200).then(() => {
            throw new Error(result.error || `Images do not match. See diff at: ${result.diffPath}`);
          });
        }
      });
  }
}

module.exports = { VisualTestHelper };
