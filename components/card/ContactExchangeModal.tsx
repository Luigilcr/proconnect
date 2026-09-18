/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * MODAL DE INTERCAMBIO DE CONTACTO BIDIRECCIONAL (LEAD CAPTURE CRM)
 * El prospecto ingresa sus datos -> Se registra en el CRM -> Se descarga automáticamente la vCard del asesor.
 */

'use client';

import React, { useState } from 'react';
import { UserCheck, X, Send, Download, CheckCircle2, MessageCircle, Building2, Phone, Mail } from 'lucide-react';
import { FullCard } from '@/lib/types';
import { saveLead, recordAnalyticsEvent } from '@/lib/data/card-store';
import { downloadVCard } from '@/lib/vcard-generator';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';

interface ContactExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: FullCard;
}

export const ContactExchangeModal: React.FC<ContactExchangeModalProps> = ({
  isOpen,
  onClose,
  card,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    // 1. Guardar lead en el almacén local
    const newLead = {
      id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      card_id: card.id,
      organization_id: card.organization_id || null,
      salesperson_name: card.full_name,
      visitor_name: name.trim(),
      subject: notes.trim() || 'Contacto capturado en calle/evento',
      phone_number: phone.trim(),
      email: email.trim() || null,
      company_name: company.trim() || null,
      interest_notes: notes.trim() || null,
      status: 'nuevo' as const,
      created_at: new Date().toISOString(),
    };

    saveLead(newLead);
    recordAnalyticsEvent(card.id, 'whatsapp_lead', { visitor_name: name });

    // 2. Sincronizar en la nube (Supabase whatsapp_leads)
    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('whatsapp_leads').insert({
          card_id: card.id,
          visitor_name: name.trim(),
          phone_number: phone.trim(),
          email: email.trim() || null,
          company_name: company.trim() || null,
          subject: notes.trim() || 'Contacto capturado desde tarjeta NFC',
          status: 'nuevo',
        });
      } catch (err) {
        console.warn('Error guardando lead en Supabase:', err);
      }
    }

    // 3. Descargar vCard (.vcf) del asesor automáticamente
    try {
      downloadVCard(card);
    } catch (err) {
      console.error('Error generating vCard:', err);
    }

    setSubmitted(true);
  };

  const rawAdvisorWa = card.links?.find((l) => l.type === 'whatsapp')?.url || '';
  const cleanAdvisorDigits = rawAdvisorWa.replace(/[^\d]/g, '');
  const leadMsg = encodeURIComponent(
    `Hola ${card.full_name}, soy ${name.trim() || 'un contacto'}. Acabo de dejarte mis datos a través de tu tarjeta digital ProConnect y me gustaría ponerme en contacto contigo.`
  );
  const advisorWhatsAppLink = cleanAdvisorDigits
    ? `https://wa.me/${cleanAdvisorDigits}?text=${leadMsg}`
    : rawAdvisorWa.startsWith('http')
    ? `${rawAdvisorWa}${rawAdvisorWa.includes('?') ? '&' : '?'}text=${leadMsg}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-brand-navy to-brand-blue text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-brand-cyan" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Intercambiar Contacto</h3>
              <p className="text-[11px] text-brand-cyan font-medium">Conecta con {card.full_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-slate-800 dark:text-slate-200">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Déjale tus datos a <strong>{card.full_name}</strong> para que pueda hacerte seguimiento. Al enviar, guardarás su contacto en tu teléfono automáticamente.
            </p>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Tu Nombre y Apellido *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Ing. Roberto Parra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-brand-blue outline-none transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-brand-cyan" /> Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+58 414 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-brand-blue outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-brand-cyan" /> Correo (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-brand-cyan" /> Empresa / Residencia / Cargo
              </label>
              <input
                type="text"
                placeholder="Ej: Res. Los Samanes o Constructora Andes"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-brand-blue outline-none transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                ¿En qué estás interesado?
              </label>
              <textarea
                rows={2}
                placeholder="Ej: Planes de fibra óptica 500Mbps para 24 familias..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-brand-blue outline-none transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-brand-blue hover:bg-brand-mid text-white font-bold text-xs shadow-lg shadow-brand-blue/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Mis Datos y Guardar Asesor</span>
            </button>
          </form>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                ¡Contacto Intercambiado con Éxito!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Tus datos han sido registrados en la libreta comercial de <strong>{card.full_name}</strong> y su tarjeta (.vcf) se ha descargado a tu teléfono.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {advisorWhatsAppLink && (
                <a
                  href={advisorWhatsAppLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Escribirle a {card.full_name} por WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
