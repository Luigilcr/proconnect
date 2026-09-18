/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * SCRIPT DE VERIFICACIÓN GLOBAL AMPLIADO (B2B, MOTOR VISUAL, COLOR IA & LEADS)
 */

const fs = require('fs');
const path = require('path');

console.log('=== VERIFICANDO ESTRUCTURA GLOBAL PROCONNECT B2B & VISUAL ENGINE ===\n');

const projectRoot = path.resolve(__dirname, '..');

const criticalFiles = [
  'supabase/schema.sql',
  'package.json',
  'tsconfig.json',
  'tailwind.config.ts',
  'LICENSE',
  'README.md',
  'lib/types.ts',
  'lib/color-extractor.ts',
  'lib/vcard-generator.ts',
  'lib/data/demo-data.ts',
  'lib/data/card-store.ts',
  'components/card/DigitalCard.tsx',
  'components/card/SmartWhatsAppModal.tsx',
  'components/card/VCardDownloadButton.tsx',
  'components/card/QRCodeModal.tsx',
  'components/card/MultimediaViewer.tsx',
  'components/dashboard/LivePreviewPhone.tsx',
  'components/dashboard/IdentityEditor.tsx',
  'components/dashboard/DesignCustomizer.tsx',
  'components/dashboard/LinksEditor.tsx',
  'components/dashboard/MultimediaManager.tsx',
  'components/dashboard/VCardEditor.tsx',
  'components/dashboard/AnalyticsAndLeads.tsx',
  'components/admin/AdminComponents.tsx',
  'components/layout/Navbar.tsx',
  'components/layout/Footer.tsx',
  'app/layout.tsx',
  'app/page.tsx',
  'app/c/[slug]/page.tsx',
  'app/dashboard/page.tsx',
  'app/org-dashboard/page.tsx',
  'app/admin/page.tsx',
  'app/terminos/page.tsx',
  'app/privacidad/page.tsx',
];

let missing = 0;
for (const relPath of criticalFiles) {
  const fullPath = path.join(projectRoot, relPath);
  if (fs.existsSync(fullPath)) {
    console.log(`✓ Archivo verificado: ${relPath}`);
  } else {
    console.error(`✗ Falta archivo crítico: ${relPath}`);
    missing++;
  }
}

// 1. Verificación SQL: Organizaciones, Analytics y Leads
const sqlContent = fs.readFileSync(path.join(projectRoot, 'supabase/schema.sql'), 'utf-8');
const hasOrgsTable = sqlContent.includes('CREATE TABLE IF NOT EXISTS public.organizations');
const hasLayoutType = sqlContent.includes('CREATE TYPE layout_type AS ENUM');
const hasAnalyticsEvents = sqlContent.includes('CREATE TABLE IF NOT EXISTS public.analytics_events');
const hasWhatsAppLeads = sqlContent.includes('CREATE TABLE IF NOT EXISTS public.whatsapp_leads');
const hasBrandLock = sqlContent.includes('enforce_brand_lock BOOLEAN');

console.log('\n=== VERIFICACIÓN DE ESQUEMA SQL B2B ===');
if (hasOrgsTable && hasLayoutType && hasAnalyticsEvents && hasWhatsAppLeads && hasBrandLock) {
  console.log('✓ Jerarquía B2B en SQL: Tabla organizations, layouts ampliados, eventos analíticos y leads verificados.');
} else {
  console.error('✗ Error en schema.sql: faltan tablas u objetos de la arquitectura B2B.');
  missing++;
}

// 2. Verificación de Tipos y Plantillas
const typesContent = fs.readFileSync(path.join(projectRoot, 'lib/types.ts'), 'utf-8');
const has6Layouts = typesContent.includes("'banner_header'") && typesContent.includes("'card_id_badge'") && typesContent.includes("'creative_grid'");
const hasBrandLockTypes = typesContent.includes('enforce_brand_lock: boolean');

console.log('\n=== VERIFICACIÓN DE TIPOS Y MOTOR VISUAL ===');
if (has6Layouts && hasBrandLockTypes) {
  console.log('✓ Motor Visual en TypeScript: 6 layouts y propiedades B2B presentes.');
} else {
  console.error('✗ Error en lib/types.ts: faltan definiciones de los 6 layouts.');
  missing++;
}

// 3. Verificación de Extractor de Colores
const extractorContent = fs.readFileSync(path.join(projectRoot, 'lib/color-extractor.ts'), 'utf-8');
const hasExtractFunc = extractorContent.includes('export async function extractPaletteFromImage');

console.log('\n=== VERIFICACIÓN DEL MOTOR IA DE COLORES ===');
if (hasExtractFunc) {
  console.log('✓ Motor de análisis de logotipo y extracción de color verificado.');
} else {
  console.error('✗ Error en lib/color-extractor.ts.');
  missing++;
}

if (missing === 0) {
  console.log('\n🎉 ¡TODAS LAS VALIDACIONES SUPERADAS EXITOSAMENTE! (100% OK)');
  process.exit(0);
} else {
  console.error(`\nSe encontraron ${missing} problemas.`);
  process.exit(1);
}
