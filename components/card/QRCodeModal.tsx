/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, Radio, Copy, Check, Download, Sparkles, Smartphone } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullUrl: string;
  cardName: string;
  companyName?: string | null;
  primaryColor?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  fullUrl,
  cardName,
  companyName,
  primaryColor = '#0ea5e9',
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'nfc'>('qr');
  const [nfcStatus, setNfcStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadQR = () => {
    const svgElement = document.getElementById('proconnect-qr-svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `qr-${cardName.toLowerCase().replace(/\s+/g, '-')}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  // Asistente Web NFC (NDEFReader)
  const handleWriteNFC = async () => {
    if ('NDEFReader' in window) {
      try {
        setNfcStatus('Acerca la tarjeta o chip NFC a la parte trasera de tu smartphone...');
        // @ts-ignore
        const ndef = new window.NDEFReader();
        await ndef.write({
          records: [
            {
              recordType: 'url',
              data: fullUrl,
            },
          ],
        });
        setNfcStatus('¡Éxito! Tarjeta NFC grabada correctamente con tu URL ProConnect.');
      } catch (error: any) {
        setNfcStatus(`Error o permiso cancelado: ${error.message || 'No se pudo escribir'}`);
      }
    } else {
      setNfcStatus(
        'La Web NFC API no está disponible en este navegador. Para programar tu chip NFC físicamente, puedes usar la aplicación gratuita "NFC Tools" en iOS o Android y pegar tu enlace copiado.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              style={{ backgroundColor: primaryColor }}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
            >
              <QrCode className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Compartir y Conectar
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'qr'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Código QR
          </button>
          <button
            onClick={() => setActiveTab('nfc')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'nfc'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            Vincular Chip NFC
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'qr' ? (
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-100 dark:border-slate-800 mb-4">
                <QRCodeSVG
                  id="proconnect-qr-svg"
                  value={fullUrl}
                  size={190}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">
                {cardName}
              </h4>
              {companyName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  {companyName}
                </p>
              )}

              {/* Botón de descarga QR */}
              <button
                onClick={handleDownloadQR}
                className="w-full py-2.5 px-4 mb-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar Código QR (SVG Vectorial)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-2xl p-4 text-center">
                <Smartphone className="w-8 h-8 text-sky-600 dark:text-sky-400 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  Grabación en Tarjeta Física NFC
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Copia tu enlace digital o escribe directamente la URL en tu tarjeta inteligente o chip NTAG213/215/216.
                </p>
              </div>

              <button
                onClick={handleWriteNFC}
                style={{ backgroundColor: primaryColor }}
                className="w-full py-3 px-4 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-opacity"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                Iniciar Grabación Web NFC
              </button>

              {nfcStatus && (
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                  {nfcStatus}
                </div>
              )}
            </div>
          )}

          {/* Copy URL bar */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
              <input
                type="text"
                readOnly
                value={fullUrl}
                className="flex-1 bg-transparent text-xs text-slate-600 dark:text-slate-300 outline-none px-2 truncate"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5 shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
