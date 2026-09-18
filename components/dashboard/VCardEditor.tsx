/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

'use client';

import React, { useState } from 'react';
import { FullCard } from '@/lib/types';
import { Contact2, Download, FileCode, Check, Smartphone } from 'lucide-react';
import { generateVCardString, downloadVCard } from '@/lib/vcard-generator';

interface VCardEditorProps {
  card: FullCard;
  onChange: (updated: Partial<FullCard>) => void;
}

export const VCardEditor: React.FC<VCardEditorProps> = ({ card, onChange }) => {
  const [showRawVcf, setShowRawVcf] = useState(false);

  const rawVcf = generateVCardString(card);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Configuración de Contacto vCard (.vcf)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personaliza cómo se guardará tu ficha de contacto directamente en la agenda de iOS y Android.
        </p>
      </div>

      {/* Switch Incluir Foto */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
        <div>
          <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
            Incluir Fotografía en la Agenda
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Adjunta tu foto de perfil para que aparezca en las llamadas y contactos del teléfono.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onChange({ include_photo: !card.include_photo })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            card.include_photo ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
          }`}
          aria-label="Alternar inclusión de foto"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              card.include_photo ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Notas vCard personalizadas */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Notas Adicionales del Contacto (Campo NOTE)
        </label>
        <textarea
          rows={3}
          value={card.custom_vcf_notes || ''}
          onChange={(e) => onChange({ custom_vcf_notes: e.target.value })}
          placeholder="Ej. Contacto verificado en evento tecnológico. Especialista en IA y desarrollo web."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          Este texto se archivará en la sección de notas dentro del contacto del teléfono móvil.
        </p>
      </div>

      {/* Botón de Prueba y Visor RAW */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => downloadVCard(card)}
          className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Probar Descarga de Archivo .vcf</span>
        </button>

        <button
          type="button"
          onClick={() => setShowRawVcf(!showRawVcf)}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>{showRawVcf ? 'Ocultar Código vCard' : 'Inspeccionar Formato vCard 3.0'}</span>
        </button>
      </div>

      {/* Visor de código vCard crudo */}
      {showRawVcf && (
        <div className="p-3.5 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 overflow-x-auto">
          <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed">
            {rawVcf}
          </pre>
        </div>
      )}
    </div>
  );
};
