/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

'use client';

import React, { useState } from 'react';
import { UserPlus, Check } from 'lucide-react';
import { FullCard } from '@/lib/types';
import { downloadVCard } from '@/lib/vcard-generator';

interface VCardDownloadButtonProps {
  card: FullCard;
  publicUrl?: string;
  className?: string;
}

export const VCardDownloadButton: React.FC<VCardDownloadButtonProps> = ({
  card,
  publicUrl,
  className = '',
}) => {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    try {
      // Intentar importar confetti dinámicamente para feedback visual
      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: [card.primary_color || '#0ea5e9', '#10b981', '#ffffff'],
        });
      } catch (e) {
        // Ignorar si confetti falla
      }

      downloadVCard(card, publicUrl);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3500);
    } catch (err) {
      console.error('Error al generar vCard:', err);
    }
  };

  return (
    <button
      onClick={handleDownload}
      style={{
        backgroundColor: card.primary_color || '#0284c7',
      }}
      className={`w-full py-3.5 px-6 rounded-2xl text-white font-semibold flex items-center justify-center gap-3 shadow-xl transition-all duration-300 hover:opacity-95 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.98] ${className}`}
      aria-label="Guardar contacto en la agenda del teléfono"
    >
      {downloaded ? (
        <>
          <Check className="w-5 h-5 text-white animate-in zoom-in duration-200" />
          <span>¡Contacto Descargado!</span>
        </>
      ) : (
        <>
          <UserPlus className="w-5 h-5 text-white" />
          <span>Guardar Contacto</span>
        </>
      )}
    </button>
  );
};
