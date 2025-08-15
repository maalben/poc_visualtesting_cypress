// Limpieza de carpetas visual-diff antes y después de la suite
before(() => {
  cy.task('cleanVisualDiffDirs');
});

after(() => {
  cy.task('cleanVisualDiffDirs');
});
