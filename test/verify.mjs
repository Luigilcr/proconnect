/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * Script de verificación automatizada para ProConnect
 */

import { generateVCardString } from '../lib/vcard-generator.ts';
import { DEMO_CARDS } from '../lib/data/demo-data.ts';

console.log('=== INICIANDO PRUEBAS DE VERIFICACIÓN PROCONNECT ===\n');

// 1. Verificación de Tarjetas Demo
console.log(`[TEST 1] Verificando tarjetas de demostración...`);
if (DEMO_CARDS.length >= 3) {
  console.log(`✓ Se encontraron ${DEMO_CARDS.length} tarjetas demo preconfiguradas.`);
} else {
  console.error(`✗ Error: Se esperaban al menos 3 tarjetas.`);
  process.exit(1);
}

const elenaCard = DEMO_CARDS.find((c) => c.slug === 'elena-rodriguez');
const carlosCard = DEMO_CARDS.find((c) => c.slug === 'carlos-mendoza');
const sofiaCard = DEMO_CARDS.find((c) => c.slug === 'sofia-valenzuela');

if (!elenaCard || !carlosCard || !sofiaCard) {
  console.error(`✗ Error: No se encontraron los 3 perfiles temáticos (Modern, Executive, Minimal).`);
  process.exit(1);
}
console.log(`✓ Perfiles verificados: Modern (${elenaCard.full_name}), Executive (${carlosCard.full_name}), Minimal (${sofiaCard.full_name})`);

// 2. Verificación de Generación vCard 3.0 con campos include_photo y custom_vcf_notes
console.log(`\n[TEST 2] Verificando generación vCard 3.0 para móviles (iOS & Android)...`);
const vcfContent = generateVCardString(elenaCard, 'https://proconnect.app/c/elena-rodriguez');

const requiredTokens = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'FN;CHARSET=UTF-8:Elena Rodríguez Morales',
  'ORG;CHARSET=UTF-8:NexaCorp Technologies',
  'TITLE;CHARSET=UTF-8:Chief Innovation Officer & Co-Founder',
  'TEL;',
  'EMAIL;',
  'NOTE;CHARSET=UTF-8:',
  'PHOTO;VALUE=URI:',
  'END:VCARD',
];

for (const token of requiredTokens) {
  if (vcfContent.includes(token)) {
    console.log(`✓ Token vCard detectado correctamente: "${token}"`);
  } else {
    console.error(`✗ Error: Falta token requerido en vCard: "${token}"`);
    process.exit(1);
  }
}

// 3. Verificación de notas y foto vCard integradas en cards
console.log(`\n[TEST 3] Verificando optimización de base de datos en tabla cards...`);
if (typeof elenaCard.include_photo === 'boolean' && elenaCard.custom_vcf_notes) {
  console.log(`✓ Columnas include_photo y custom_vcf_notes presentes directamente en entidad Card.`);
} else {
  console.error(`✗ Error: Faltan campos include_photo o custom_vcf_notes en entidad Card.`);
  process.exit(1);
}

console.log('\n=== TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE (3/3) ===');
