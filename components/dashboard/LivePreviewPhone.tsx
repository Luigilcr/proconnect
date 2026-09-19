/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

'use client';

import React from 'react';
import { FullCard, PresetTemplate } from '@/lib/types';
import { DigitalCard } from '@/components/card/DigitalCard';
import { PRESET_TEMPLATES } from '@/lib/data/demo-data';
import { Smartphone, ExternalLink, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface LivePreviewPhoneProps {
  card: FullCard;
  onSelectTemplate?: (template: PresetTemplate) => void;
}

export const LivePreviewPhone: React.FC<LivePreviewPhoneProps> = ({ card, onSelectTemplate }) => {
  // Determinar qué plantilla coincide con el card actual o usar el primer preset
  const currentIndex = PRESET_TEMPLATES.findIndex(
    (t) =>
      t.layout_type === card.layout_type &&
      t.colors.primary.toLowerCase() === (card.primary_color || '').toLowerCase()
  );

  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentPreset = PRESET_TEMPLATES[activeIndex];

  const handlePrevTemplate = () => {
    if (!onSelectTemplate) return;
    const prevIdx = (activeIndex - 1 + PRESET_TEMPLATES.length) % PRESET_TEMPLATES.length;
    onSelectTemplate(PRESET_TEMPLATES[prevIdx]);
  };

  const handleNextTemplate = () => {
    if (!onSelectTemplate) return;
    const nextIdx = (activeIndex + 1) % PRESET_TEMPLATES.length;
    onSelectTemplate(PRESET_TEMPLATES[nextIdx]);
  };

  return (
    <div className="flex flex-col items-center sticky top-8 w-full max-w-[360px]">
      {/* Selector de Plantilla Interactivo Rápido (Anterior / Siguiente) */}
      {onSelectTemplate && (
        <div className="w-full max-w-[340px] mb-2.5 p-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handlePrevTemplate}
            className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer shrink-0"
            title="Plantilla Anterior"
          >
            <ChevronLeft className="w-4 h-4 text-sky-500" />
            <span>Anterior</span>
          </button>

          <div className="flex-1 text-center min-w-0 px-1">
            <div className="text-xs font-black text-slate-900 dark:text-white truncate flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">{currentPreset?.name || 'Personalizada'}</span>
            </div>
            <div className="text-[10px] text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider">
              Plantilla {activeIndex + 1} de {PRESET_TEMPLATES.length}
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextTemplate}
            className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer shrink-0"
            title="Plantilla Siguiente"
          >
            <span>Siguiente</span>
            <ChevronRight className="w-4 h-4 text-sky-500" />
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between w-full max-w-[340px] mb-2 px-2">
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
      <div className="relative w-[340px] h-[660px] bg-slate-950 rounded-[48px] p-3.5 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50 flex flex-col justify-between overflow-hidden">
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

      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 text-center">
        Toca <strong>Anterior</strong> o <strong>Siguiente</strong> para probar los 26 estilos en vivo.
      </p>
    </div>
  );
};
