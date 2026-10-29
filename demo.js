// Proyectos de demostración. Siempre marcados con isDemo=true y datos de contacto ficticios.

import { createProject, CATEGORIES } from './models.js';

const DEMO = {
  beauty: { name: 'Salón Aurora', city: 'Palma', address: 'Carrer de Exemple, 12' },
  wellness: { name: 'Centro Calma', city: 'Palma', address: 'Carrer de Exemple, 8' },
  restaurant: { name: 'Casa Mercado', city: 'Sevilla', address: 'Calle Ejemplo, 5' },
  motor: { name: 'Racing Garage', city: 'Sevilla', address: 'Polígono Ejemplo, nave 3' },
  fitness: { name: 'Estudio Pulso', city: 'Valencia', address: 'Calle Ejemplo, 21' },
  services: { name: 'Servicios Ejemplo', city: 'Madrid', address: 'Calle Ejemplo, 1' },
  other: { name: 'Negocio Ejemplo', city: 'Madrid', address: 'Calle Ejemplo, 1' },
};

export function createDemoProject(category = 'beauty') {
  const cat = CATEGORIES.some((c) => c.id === category) ? category : 'beauty';
  const d = DEMO[cat];
  const p = createProject({ name: `Demostración · ${d.name}`, category: cat, demo: true });
  Object.assign(p.business, {
    name: d.name,
    city: d.city,
    address: d.address,
    description: 'Contenido de demostración: sustitúyelo por los datos reales del negocio.',
    phone: '600 000 000',
    whatsapp: '600 000 000',
    email: 'demo@example.com',
    instagram: '@ejemplo',
  });
  return p;
}
