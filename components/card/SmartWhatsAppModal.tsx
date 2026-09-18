/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

'use client';

import React, { useState } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { recordWhatsAppLead } from '@/lib/data/card-store';

interface SmartWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId?: string;
  recipientName: string;
  rawPhoneNumber: string;
}

export const SmartWhatsAppModal: React.FC<SmartWhatsAppModalProps> = ({
  isOpen,
  onClose,
  cardId,
  recipientName,
  rawPhoneNumber,
}) => {
  const [visitorName, setVisitorName] = useState('');
  const [subject, setSubject] = useState('');

  if (!isOpen) return null;

  const quickSubjects = [
    'Reunión de Negocios',
    'Cotización / Presupuesto',
    'Consultoría Especializada',
    'Alianza Estratégica',
  ];

  const cleanedPhone = rawPhoneNumber.replace(/[^\d]/g, '');

  const generatedMessage = visitorName.trim() || subject.trim()
    ? `Hola ${recipientName}, me llamo ${visitorName.trim() || '[Tu Nombre]'} y te escribo por: ${subject.trim() || '[Asunto]'}.`
    : `Hola ${recipientName}, vi tu tarjeta digital ProConnect y me gustaría ponerme en contacto contigo.`;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    // Guardar lead en la bandeja de leads de la tarjeta
    if (cardId && visitorName.trim()) {
      try {
        recordWhatsAppLead(
          cardId,
          visitorName.trim(),
          subject.trim() || 'Consulta general',
          rawPhoneNumber
        );
      } catch (err) {
        console.error('Error saving lead:', err);
      }
    }

    const finalPhone = cleanedPhone.startsWith('0')
      ? cleanedPhone.substring(1)
      : cleanedPhone;
    const finalUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(
      generatedMessage
    )}`;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">WhatsApp Inteligente</h3>
              <p className="text-xs text-emerald-100">Contacto directo con {recipientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/90"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Tu Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Motivo o Asunto del Mensaje *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej. Consultoría sobre desarrollo SaaS"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          {/* Quick chips */}
          <div>
            <span className="block text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Sugerencias rápidas de motivo:
            </span>
            <div className="flex flex-wrap gap-2">
              {quickSubjects.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSubject(item)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    subject === item
                      ? 'bg-emerald-500 text-white border-emerald-500 font-medium'
                      : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Mensaje generado preview */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block mb-1">
              Vista previa del mensaje a enviar:
            </span>
            <p className="text-xs italic text-emerald-950 dark:text-emerald-100">
              &quot;{generatedMessage}&quot;
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              Enviar a WhatsApp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
