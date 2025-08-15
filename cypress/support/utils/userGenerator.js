// Utilidad para generar usuarios
import { faker } from '@faker-js/faker';
import { colombianLocations } from '../const/colombianLocations';

export function generateUser() {
  const location = faker.helpers.arrayElement(colombianLocations);
  return {
    firstname: faker.person.firstName(),
    lastname: faker.person.lastName(),
    email: faker.internet.email(),
    address1: faker.location.streetAddress(),
    city: location.city,
    country: 'Colombia',
    region: location.region,
    postcode: location.zip,
    loginname: faker.internet.userName(),
    password: 'Cypress1234*',
  };
}
