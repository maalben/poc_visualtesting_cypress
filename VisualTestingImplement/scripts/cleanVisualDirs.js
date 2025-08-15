// Limpieza de carpetas visual-diff antes y después de la suite
before(() => {
  cy.task('cleanVisualDirs');
});

after(() => {
  cy.task('cleanVisualDirs');
});
