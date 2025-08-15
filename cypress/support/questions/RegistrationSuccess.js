// Pregunta: ¿El registro fue exitoso?
import { RegistrationForm } from '../ui/RegistrationForm';

export function registrationShouldBeSuccessful() {
  cy.contains(RegistrationForm.successMsg).should('be.visible');
}
