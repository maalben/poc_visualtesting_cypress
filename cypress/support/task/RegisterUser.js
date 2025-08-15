// Tarea: Registrar un usuario
import { RegistrationForm } from '../ui/RegistrationForm';

export function registerUser(user) {
  cy.contains('Continue').click();
  cy.get(RegistrationForm.firstname).type(user.firstname);
  cy.get(RegistrationForm.lastname).type(user.lastname);
  cy.get(RegistrationForm.email).type(user.email);
  cy.get(RegistrationForm.address1).type(user.address1);
  cy.get(RegistrationForm.city).type(user.city);
  cy.get(RegistrationForm.country).select(user.country);
  cy.get(RegistrationForm.region).select(user.region);
  cy.get(RegistrationForm.postcode).type(user.postcode);
  cy.get(RegistrationForm.loginname).type(user.loginname);
  cy.get(RegistrationForm.password).type(user.password);
  cy.get(RegistrationForm.confirm).type(user.password);
  cy.get(RegistrationForm.agree).check();
  cy.get(RegistrationForm.continueBtn).should('be.visible').click({ force: true }); 
}
