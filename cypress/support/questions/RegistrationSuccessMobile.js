// Pregunta: ¿El registro fue exitoso en mobile?
export function registrationShouldBeSuccessfulMobile() {
  cy.contains('My Account').should('be.visible');
}
