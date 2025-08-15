import { registerUser } from '../../support/task/RegisterUser';
import { registrationShouldBeSuccessfulDesktopTablet } from '../../support/questions/RegistrationSuccessDesktopTablet';
import { generateUser } from '../../support/utils/userGenerator';
const { visualConfig, VisualTestHelper } = require('../../../VisualTestingImplement/utils/visualTesting');

  const type = 'Desktop';
  const { width, height } = visualConfig.VIEWPORTS[type];
  const flowHomePage = 'Home';

  it('[01] ' + type + ' - Visual testing: Home', () => {
    cy.viewport(width, height);
    cy.visit('/');
    VisualTestHelper.captureAndCompare(flowHomePage, 'home-page', type);
  });

  it('[02] ' + type + ' - Visual testing: Option new customer', () => {
    cy.viewport(width, height);
    cy.visit('/');
    cy.contains('Login or register').should('be.visible').click({ force: true });
    VisualTestHelper.captureAndCompare('Option new customer', 'option-new-user-page', type);
  });

  it('[03] ' + type + ' - Visual testing: Form create account', () => {
    cy.viewport(width, height);
    cy.visit('/');
    cy.contains('Login or register').should('be.visible').click({ force: true });
    cy.get('form#accountFrm button[type="submit"]').should('be.visible').click({ force: true });
    VisualTestHelper.captureAndCompare('Form create account', 'form-create-account-page', type);
  });

  it('[04] ' + type + ' - Visual and Functional testing: Finish registration', () => {
    cy.viewport(width, height);
    cy.visit('/');
    cy.contains('Login or register').should('be.visible').click({ force: true });
    cy.get('form#accountFrm button[type="submit"]').should('be.visible').click({ force: true });
    const user = generateUser();
    registerUser(user);
    registrationShouldBeSuccessfulDesktopTablet();
    VisualTestHelper.captureAndCompare('Page finish registration user', 'page-after-register-user', type);
  });
