import { registerUser } from '../../support/task/RegisterUser';
import { generateUser } from '../../support/utils/userGenerator';
const { visualConfig, VisualTestHelper } = require('../../../VisualTestingImplement/utils/visualTesting');

describe('Registration Flow - Mobile', () => {
  it('Should register a new user - Mobile', () => {
    const type = 'Mobile';
    const { width, height } = visualConfig.VIEWPORTS[type];
    cy.viewport(width, height);
    cy.visit('/');
    cy.get('button.navbar-toggle').click();
    cy.get('div#topnav select.form-control').select('Account');
    const user = generateUser();
    registerUser(user);
    cy.contains('My Account').should('exist');
    VisualTestHelper.captureAndCompare('registration', 'after-register', type);
  });
});
