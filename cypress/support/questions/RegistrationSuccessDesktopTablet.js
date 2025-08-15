// Pregunta: ¿El registro fue exitoso en desktop/tablet?
import { RegistrationForm } from '../ui/RegistrationForm';

export function registrationShouldBeSuccessfulDesktopTablet() {
  cy.contains(RegistrationForm.successMsg).should('be.visible');
}
