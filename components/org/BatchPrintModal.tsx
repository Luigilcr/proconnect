'use client';

import React, { useRef } from 'react';
import { Organization, FullCard } from '@/lib/types';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Download, Sparkles, QrCode } from 'lucide-react';

interface BatchPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization;
  cards: FullCard[];
}

export function BatchPrintModal({ isOpen, onClose, organization, cards }: BatchPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const primaryColor = organization.brand_colors?.primary || '#7C3AED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Cabecera del Modal (No se imprime) */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between print:hidden bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Centro de Impresión & Fichas de Tarjetas NFC
              </h3>
              <p className="text-xs text-slate-500">
                Plantilla para impresión de credenciales físicas o códigos QR para {organization.name}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar en PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenedor Imprimible */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6" ref={printRef}>
          <div className="print:hidden p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-3">
            <Sparkles className="w-5 h-5 shrink-0 text-amber-600" />
            <p>
              <strong>Tip para la Imprenta:</strong> Al presionar &ldquo;Imprimir / Guardar en PDF&rdquo;, activa en el diálogo de tu navegador la opción <em>&ldquo;Gráficos de fondo&rdquo;</em> para que los colores corporativos y las líneas de corte se visualicen con máxima fidelidad.
            </p>
          </div>

          {/* Grilla de Fichas de Tarjetas (Formato Estándar CR80 / PVC) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
            {cards.map((card) => {
              const profileUrl = typeof window !== 'undefined'
                ? `${window.location.origin}/c/${card.slug}`
                : `https://proconnect-pearl.vercel.app/c/${card.slug}`;

              return (
                <div
                  key={card.id}
                  className="relative p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 print:border-slate-400 bg-white dark:bg-slate-900 flex flex-col items-center text-center space-y-3 print:break-inside-avoid"
                >
                  {/* Guía de Corte */}
                  <span className="absolute top-1 right-2 text-[9px] font-mono text-slate-400">
                    Corte 85x54mm
                  </span>

                  {/* Logo de Empresa */}
                  {organization.logo_url ? (
                    <img
                      src={organization.logo_url}
                      alt={organization.name}
                      className="h-6 object-contain max-w-[140px]"
                    />
                  ) : (
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {organization.name}
                    </span>
                  )}

                  {/* Código QR de Alta Calidad */}
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                    <QRCodeSVG
                      value={profileUrl}
                      size={130}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  {/* Datos del Colaborador */}
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {card.full_name}
                    </h4>
                    <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                      {card.job_title || 'Colaborador'}
                    </p>
                    <p className="text-[9px] font-mono text-slate-400 pt-1">
                      proconnect.app/c/{card.slug}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
