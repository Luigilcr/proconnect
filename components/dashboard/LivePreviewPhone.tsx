/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

'use client';

import React from 'react';
import { FullCard } from '@/lib/types';
import { DigitalCard } from '@/components/card/DigitalCard';
import { Smartphone, ExternalLink, RefreshCw } from 'lucide-react';

interface LivePreviewPhoneProps {
  card: FullCard;
}

export const LivePreviewPhone: React.FC<LivePreviewPhoneProps> = ({ card }) => {
  return (
    <div className="flex flex-col items-center sticky top-8">
      {/* Header Info */}
      <div className="flex items-center justify-between w-full max-w-[340px] mb-3 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Vista Previa en Vivo
          </span>
        </div>
        <a
          href={`/c/${card.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
        >
          <span>Abrir Perfil</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Smartphone Frame (iPhone Style) */}
      <div className="relative w-[340px] h-[680px] bg-slate-950 rounded-[48px] p-3.5 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50 flex flex-col justify-between overflow-hidden">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-center pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 mr-3" />
          <div className="w-2 h-2 rounded-full bg-sky-950" />
        </div>

        {/* Screen Container with Inner Scroll */}
        <div className="w-full h-full rounded-[38px] overflow-y-auto bg-slate-900 scrollbar-none relative text-left">
          <DigitalCard card={card} isSimulator={true} />
        </div>

        {/* Home Indicator Bar */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full z-40 pointer-events-none" />
      </div>

      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-3 text-center">
        Simulador móvil interactivo: prueba clics, temas y cambios en tiempo real.
      </p>
    </div>
  );
};
