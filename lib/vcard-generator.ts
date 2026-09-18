/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * GENERADOR DE ARCHIVOS VCARD (VCF 3.0) OPTIMIZADO PARA MÓVILES (iOS Y ANDROID)
 */

import { FullCard } from './types';

/**
 * Genera el contenido formateado de vCard en estándar 3.0
 */
export function generateVCardString(card: FullCard, publicCardUrl?: string): string {
  const lines: string[] = [];

  lines.push('BEGIN:VCARD');
  lines.push('VERSION:3.0');

  // Separar nombre y apellido de forma inteligente
  const nameParts = (card.full_name || 'Contacto').trim().split(/\s+/);
  let firstName = nameParts[0] || '';
  let lastName = nameParts.slice(1).join(' ') || '';

  lines.push(`N;CHARSET=UTF-8:${lastName};${firstName};;;`);
  lines.push(`FN;CHARSET=UTF-8:${card.full_name || 'Contacto'}`);

  if (card.company_name) {
    lines.push(`ORG;CHARSET=UTF-8:${card.company_name}`);
  }

  if (card.job_title) {
    lines.push(`TITLE;CHARSET=UTF-8:${card.job_title}`);
  }

  // Filtrar enlaces activos
  const activeLinks = (card.links || []).filter((link) => link.is_active);

  // Enlaces de teléfono y celular
  const phoneLinks = activeLinks.filter((l) => l.type === 'phone');
  phoneLinks.forEach((link) => {
    const cleanedNumber = link.url.replace(/[^\d+]/g, '');
    lines.push(`TEL;TYPE=CELL,VOICE:${cleanedNumber || link.url}`);
  });

  // Enlace de WhatsApp
  const whatsappLinks = activeLinks.filter((l) => l.type === 'whatsapp');
  whatsappLinks.forEach((link) => {
    const cleanedNumber = link.url.replace(/[^\d+]/g, '');
    if (phoneLinks.length === 0) {
      lines.push(`TEL;TYPE=CELL,VOICE:${cleanedNumber || link.url}`);
    }
    lines.push(`X-SOCIALPROFILE;type=whatsapp:https://wa.me/${cleanedNumber}`);
  });

  // Correos electrónicos
  const emailLinks = activeLinks.filter((l) => l.type === 'email');
  emailLinks.forEach((link) => {
    const cleanedEmail = link.url.replace(/^mailto:/i, '').trim();
    lines.push(`EMAIL;TYPE=INTERNET,WORK:${cleanedEmail}`);
  });

  // Sitios Web
  const webLinks = activeLinks.filter((l) => l.type === 'website');
  if (webLinks.length > 0) {
    lines.push(`URL;TYPE=WORK:${webLinks[0].url}`);
  } else if (publicCardUrl) {
    lines.push(`URL;TYPE=ProConnect:${publicCardUrl}`);
  }

  // Redes Sociales adicionales
  activeLinks.forEach((link) => {
    if (link.type === 'linkedin') {
      lines.push(`X-SOCIALPROFILE;type=linkedin:${link.url}`);
    } else if (link.type === 'instagram') {
      lines.push(`X-SOCIALPROFILE;type=instagram:${link.url}`);
    } else if (link.type === 'tiktok') {
      lines.push(`X-SOCIALPROFILE;type=tiktok:${link.url}`);
    }
  });

  // URL del perfil digital de la tarjeta NFC
  if (publicCardUrl) {
    lines.push(`URL;TYPE=DigitalCard:${publicCardUrl}`);
  }

  // Notas personalizadas (vCard settings)
  const notes = [
    card.custom_vcf_notes || 'Tarjeta de Presentación Digital generada con ProConnect.',
    card.bio ? `Biografía: ${card.bio}` : '',
    publicCardUrl ? `Ver perfil completo: ${publicCardUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  if (notes) {
    const sanitizedNotes = notes.replace(/\n/g, '\\n').replace(/,/g, '\\,');
    lines.push(`NOTE;CHARSET=UTF-8:${sanitizedNotes}`);
  }

  // Fotografía de perfil si está habilitada
  if (card.include_photo && card.profile_photo_url) {
    lines.push(`PHOTO;VALUE=URI:${card.profile_photo_url}`);
  }

  lines.push('REV:' + new Date().toISOString());
  lines.push('END:VCARD');

  return lines.join('\r\n');
}

/**
 * Descarga el archivo VCF en el navegador con compatibilidad total para iOS Safari y Android Chrome.
 * Utiliza el tipo MIME explícito text/vcard; charset=utf-8 y el atributo HTML5 download.
 */
export function downloadVCard(card: FullCard, publicCardUrl?: string): void {
  const vcardString = generateVCardString(card, publicCardUrl);
  const blob = new Blob([vcardString], {
    type: 'text/vcard; charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const fileName = `${(card.slug || card.full_name || 'contacto')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')}.vcf`;
  anchor.setAttribute('download', fileName);
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 200);
}
