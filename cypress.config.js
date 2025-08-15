
const { defineConfig } = require("cypress");
const visualTasks = require('./cypress/support/utils/visualTasks.js');

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://automationteststore.com",
    // screenshotsFolder se mantiene genérico para que la lógica en visualTasks.js busque en toda la carpeta
    screenshotsFolder: 'cypress/screenshots',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
      visualTasks(on, config);
      require('@shelex/cypress-allure-plugin/writer')(on, config);
      on('task', {
        log(message) {
          console.log(message);
          return null;
        }
      });
      return config;
    }
  }
});
