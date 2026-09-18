/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * MOTOR DE EXTRACCIÓN Y ANÁLISIS DE COLOR POR IMAGEN (IA HEURÍSTICA DE MARCA)
 */

import { BrandColors } from './types';

// Convertir RGB a HEX
function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
      .toUpperCase()
  );
}

// Convertir HEX a RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const sanitized = hex.replace(/^#/, '');
  const bigint = parseInt(sanitized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

// Generar variaciones de luminosidad
function adjustLightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent / 100;
  return rgbToHex(r * factor, g * factor, b * factor);
}

/**
 * Extrae una paleta armónica de 4 tonos (Primary, Secondary, Accent, Background)
 * analizando los píxeles de un logotipo o imagen corporativa.
 */
export async function extractPaletteFromImage(
  imageUrl: string
): Promise<BrandColors> {
  return new Promise((resolve) => {
    // Si no hay imagen o es inválida, retornar paleta por defecto
    if (!imageUrl) {
      resolve({
        primary: '#0EA5E9',
        secondary: '#0369A1',
        accent: '#38BDF8',
        background: '#0F172A',
      });
      return;
    }

    // Heurística rápida si la URL coincide con palabras clave conocidas
    const lowerUrl = imageUrl.toLowerCase();
    if (lowerUrl.includes('gold') || lowerUrl.includes('mendoza')) {
      resolve({
        primary: '#D97706',
        secondary: '#92400E',
        accent: '#FBBF24',
        background: '#18181B',
      });
      return;
    }
    if (lowerUrl.includes('minimal') || lowerUrl.includes('green') || lowerUrl.includes('nature')) {
      resolve({
        primary: '#10B981',
        secondary: '#047857',
        accent: '#34D399',
        background: '#064E3B',
      });
      return;
    }

    if (typeof window === 'undefined') {
      resolve({
        primary: '#0EA5E9',
        secondary: '#0369A1',
        accent: '#38BDF8',
        background: '#0F172A',
      });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No canvas 2d context');

        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);

        const imgData = ctx.getImageData(0, 0, 64, 64).data;
        const colorCounts: Record<string, { r: number; g: number; b: number; count: number }> = {};

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Descartar transparencias o blancos/negros puros para color primario
          if (a < 128) continue;
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness > 245 || brightness < 15) continue;

          // Cuantizar color a intervalos de 24 para agrupar tonos similares
          const qr = Math.floor(r / 24) * 24;
          const qg = Math.floor(g / 24) * 24;
          const qb = Math.floor(b / 24) * 24;
          const key = `${qr},${qg},${qb}`;

          if (!colorCounts[key]) {
            colorCounts[key] = { r: qr, g: qg, b: qb, count: 1 };
          } else {
            colorCounts[key].count++;
          }
        }

        const sorted = Object.values(colorCounts).sort((a, b) => b.count - a.count);

        if (sorted.length === 0) {
          throw new Error('No colorful pixels found');
        }

        const dom = sorted[0];
        const primary = rgbToHex(dom.r, dom.g, dom.b);
        const secondary = sorted.length > 1
          ? rgbToHex(sorted[1].r, sorted[1].g, sorted[1].b)
          : adjustLightness(primary, -25);
        const accent = sorted.length > 2
          ? rgbToHex(sorted[2].r, sorted[2].g, sorted[2].b)
          : adjustLightness(primary, 35);

        // Fondo oscuro elegante derivado del tono dominante
        const { r: pr, g: pg, b: pb } = hexToRgb(primary);
        const background = rgbToHex(
          Math.min(25, pr * 0.15),
          Math.min(30, pg * 0.15),
          Math.min(45, pb * 0.25)
        );

        resolve({
          primary,
          secondary,
          accent,
          background: background.length === 7 ? background : '#0F172A',
        });
      } catch (err) {
        // Fallback armónico
        resolve({
          primary: '#0EA5E9',
          secondary: '#0369A1',
          accent: '#38BDF8',
          background: '#0F172A',
        });
      }
    };

    img.onerror = () => {
      resolve({
        primary: '#0EA5E9',
        secondary: '#0369A1',
        accent: '#38BDF8',
        background: '#0F172A',
      });
    };

    img.src = imageUrl;
  });
}
