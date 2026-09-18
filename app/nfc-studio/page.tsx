/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * PROCONNECT NFC & QR PRINT STUDIO
 * Simulador de tarjetas físicas de PVC/Metal/Madera, generador vectorial de QR a 300 DPI y asistente NFC.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FullCard } from '@/lib/types';
import { getStoredCards } from '@/lib/data/card-store';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import {
  QrCode,
  Radio,
  Download,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  Layers,
  Palette,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  Cpu,
  Info,
  Sliders,
  FileCheck,
  CreditCard,
} from 'lucide-react';

type CardFinish = 'matte_black' | 'glossy_white' | 'brushed_metal' | 'eco_wood';

export default function NfcStudioPage() {
  const [availableCards, setAvailableCards] = useState<FullCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  const [targetUrl, setTargetUrl] = useState('https://proconnect-pearl.vercel.app/c/carlos-fibraconnect');
  const [cardHolder, setCardHolder] = useState('Carlos Mendoza');
  const [cardRole, setCardRole] = useState('Asesor Comercial de Fibra Óptica');
  const [companyName, setCompanyName] = useState('FibraConnect Telecom');
  const [cardFinish, setCardFinish] = useState<CardFinish>('matte_black');

  // QR Customization
  const [qrColor, setQrColor] = useState('#0A2540');
  const [qrBgColor, setQrBgColor] = useState('#FFFFFF');
  const [includeCenterLogo, setIncludeCenterLogo] = useState(true);

  // Statuses
  const [copied, setCopied] = useState(false);
  const [nfcLog, setNfcLog] = useState<string | null>(null);

  const qrRef = useRef<SVGSVGElement | null>(null);

  // Cargar tarjetas reales dinámicamente
  useEffect(() => {
    async function loadCards() {
      let cardsList: FullCard[] = [];

      // 1. Supabase
      if (isSupabaseEnabled && supabase) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const uid = sessionData?.session?.user?.id;
          if (uid) {
            const { data: sbCards, error } = await supabase
              .from('cards')
              .select('*')
              .eq('user_id', uid);
            if (!error && sbCards && sbCards.length > 0) {
              cardsList = sbCards;
            }
          }
        } catch (err) {
          console.warn('Error fetching cards for NFC Studio:', err);
        }
      }

      // 2. Fallback a local store
      if (cardsList.length === 0) {
        cardsList = getStoredCards();
      }

      setAvailableCards(cardsList);

      if (cardsList.length > 0) {
        const first = cardsList[0];
        setSelectedCardId(first.id);
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://proconnect-pearl.vercel.app';
        setTargetUrl(`${origin}/c/${first.slug}`);
        setCardHolder(first.full_name);
        setCardRole(first.job_title || 'Profesional');
        setCompanyName(first.company_name || 'ProConnect');
        setQrColor(first.primary_color || '#0A2540');
      }
    }

    loadCards();
  }, []);

  const handleSelectCard = (cardId: string) => {
    setSelectedCardId(cardId);
    const found = availableCards.find((c) => c.id === cardId);
    if (found) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://proconnect-pearl.vercel.app';
      setTargetUrl(`${origin}/c/${found.slug}`);
      setCardHolder(found.full_name);
      setCardRole(found.job_title || '');
      setCompanyName(found.company_name || 'ProConnect');
      setQrColor(found.primary_color || '#0A2540');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Descargar SVG Vectorial
  const handleDownloadSVG = () => {
    const svg = document.getElementById('studio-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `proconnect-qr-${cardHolder.toLowerCase().replace(/\s+/g, '-')}-vector.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Descargar PNG Alta Resolución (300 DPI Canvas 2000x2000)
  const handleDownloadHighResPNG = () => {
    const svg = document.getElementById('studio-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 2000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = qrBgColor;
      ctx.fillRect(0, 0, 2000, 2000);
      ctx.drawImage(img, 100, 100, 1800, 1800);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `proconnect-qr-300dpi-${cardHolder.toLowerCase().replace(/\s+/g, '-')}.png`;
      downloadLink.click();
    };
    img.src = url;
  };

  // Grabador Web NFC
  const handleWebNFCWrite = async () => {
    if ('NDEFReader' in window) {
      try {
        setNfcLog('Acerca tu tarjeta o sticker NFC al reverso de tu teléfono...');
        // @ts-ignore
        const ndef = new window.NDEFReader();
        await ndef.write({
          records: [{ recordType: 'url', data: targetUrl }],
        });
        setNfcLog('¡Éxito! Chip NFC grabado satisfactoriamente.');
      } catch (err: any) {
        setNfcLog(`Aviso: ${err.message || 'No se pudo escribir en el chip.'}`);
      }
    } else {
      setNfcLog('La Web NFC API no está disponible en este navegador. Utiliza la app gratuita "NFC Tools" (iOS/Android) como te indicamos abajo.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-brand-cyan/20 selection:text-brand-navy">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

          {/* Encabezado Principal */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-navy/5 border border-brand-navy/10 text-brand-navy text-xs font-bold">
              <Radio className="w-3.5 h-3.5 text-brand-cyan animate-pulse" />
              <span>Centro de Producción Física &amp; Imprenta</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-brand-navy tracking-tight">
              ProConnect NFC &amp; QR{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-cyan">
                Print Studio.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Diseña la maqueta física de tu tarjeta inteligente (PVC, Metal o Madera), descarga los archivos vectoriales a 300 DPI para tu imprenta y aprende a grabar chips NFC en segundos.
            </p>
          </div>

          {/* Panel Principal Dividido (Controles a la izquierda, Simulador a la derecha) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Columna Izquierda: Parámetros de Personalización (5 Cols) */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sliders className="w-4 h-4 text-brand-blue" />
                <h2 className="text-sm font-bold text-brand-navy uppercase tracking-wider">
                  Configuración de la Tarjeta Física
                </h2>
              </div>

              {/* Selector de Tarjeta Guardada */}
              {availableCards.length > 0 && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                    <span>Importar datos de tu Tarjeta Digital</span>
                  </label>
                  <select
                    value={selectedCardId}
                    onChange={(e) => handleSelectCard(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {availableCards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.job_title || 'Tarjeta'}) - /c/{c.slug}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* URL de Destino */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">URL del Perfil ProConnect (Enlace Dinámico)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-cyan font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Copiar URL"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Datos Impresos en la Tarjeta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Nombre del Titular</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Empresa / Marca</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Cargo o Especialidad</label>
                <input
                  type="text"
                  value={cardRole}
                  onChange={(e) => setCardRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                />
              </div>

              {/* Acabado del Material Físico */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-blue" />
                  <span>Material y Acabado de la Tarjeta (CR80)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'matte_black', name: 'PVC Negro Mate', desc: 'Acabado ejecutivo sobrio' },
                    { id: 'glossy_white', name: 'PVC Nieve Premium', desc: 'Blanco pulcro corporativo' },
                    { id: 'brushed_metal', name: 'Titanio Cepillado', desc: 'Efecto metálico de lujo' },
                    { id: 'eco_wood', name: 'Madera / Bambú', desc: 'Ecológico y sustentable' },
                  ].map((mat) => (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => setCardFinish(mat.id as CardFinish)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        cardFinish === mat.id
                          ? 'border-brand-navy bg-brand-navy/5 ring-1 ring-brand-navy font-bold'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs text-brand-navy">{mat.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{mat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Personalización de Colores del Código QR */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Color y Estilo del Código QR</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold">Color del QR</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={qrColor}
                        onChange={(e) => setQrColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <span className="text-xs font-mono font-medium">{qrColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold">Color de Fondo</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={qrBgColor}
                        onChange={(e) => setQrBgColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <span className="text-xs font-mono font-medium">{qrBgColor}</span>
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={includeCenterLogo}
                    onChange={(e) => setIncludeCenterLogo(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-blue focus:ring-brand-cyan"
                  />
                  <span>Incrustar Logo oficial ProConnect al centro del QR</span>
                </label>
              </div>

              {/* Botones de Descarga para Imprenta */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDownloadHighResPNG}
                  className="w-full py-3 px-4 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4 text-brand-cyan" />
                  <span>Descargar QR para Imprenta (PNG 300 DPI)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSVG}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <FileCheck className="w-4 h-4 text-brand-blue" />
                  <span>Descargar Vectorial (SVG sin pérdida)</span>
                </button>
              </div>
            </div>

            {/* Columna Derecha: Simulador Visual de Tarjeta Física (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">

              {/* Contenedor del Mockup Físico de Tarjeta */}
              <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-800 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[460px]">
                
                {/* Fondo con brillo de showroom */}
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-navy/60 via-transparent to-brand-cyan/10 pointer-events-none" />

                <div className="relative z-10 w-full max-w-[420px]">
                  
                  {/* Tarjeta Física Estándar ISO/IEC 7810 ID-1 (CR80: 85.60 x 53.98 mm aspect ratio 1.586) */}
                  <div
                    className={`w-full aspect-[1.586/1] rounded-[22px] p-6 shadow-2xl relative flex flex-col justify-between transition-all duration-500 text-left border select-none ${
                      cardFinish === 'matte_black'
                        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white border-slate-800 shadow-cyan-950/20'
                        : cardFinish === 'glossy_white'
                        ? 'bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900 border-slate-300 shadow-2xl ring-1 ring-white/50'
                        : cardFinish === 'brushed_metal'
                        ? 'bg-gradient-to-tr from-zinc-900 via-neutral-800 to-zinc-700 text-white border-zinc-600 shadow-zinc-950/50'
                        : 'bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-950 text-amber-50 border-amber-950 shadow-amber-950/40'
                    }`}
                  >
                    {/* Chip Holográfico / Contactless Icon */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Simulación de microchip EMV/NFC */}
                        <div className="w-11 h-8 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/60 p-1 flex flex-col justify-between shadow-inner">
                          <div className="w-full h-0.5 bg-amber-700/40 rounded-full" />
                          <div className="flex justify-between">
                            <div className="w-1.5 h-3 bg-amber-700/40 rounded-sm" />
                            <div className="w-1.5 h-3 bg-amber-700/40 rounded-sm" />
                          </div>
                          <div className="w-full h-0.5 bg-amber-700/40 rounded-full" />
                        </div>

                        {/* Símbolo de Radio / Contactless */}
                        <div className="flex items-center gap-1 text-slate-400 opacity-70">
                          <Radio className="w-4 h-4 rotate-90" />
                          <span className="text-[9px] font-mono tracking-widest uppercase">NFC</span>
                        </div>
                      </div>

                      {/* Logotipo de Empresa o ProConnect */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black tracking-wider uppercase opacity-90">
                          {companyName || 'ProConnect'}
                        </span>
                      </div>
                    </div>

                    {/* Centro: Código QR Integrado en la tarjeta */}
                    <div className="flex items-center justify-between gap-4 my-auto">
                      <div className="space-y-1 max-w-[200px]">
                        <p className="text-sm font-black tracking-tight leading-tight line-clamp-1">
                          {cardHolder}
                        </p>
                        <p className="text-[11px] opacity-75 font-medium leading-tight line-clamp-1">
                          {cardRole}
                        </p>
                        <div className="pt-2 flex items-center gap-1 text-[10px] opacity-60">
                          <ShieldCheck className="w-3 h-3 text-brand-cyan" />
                          <span>Identidad Oficial Verificada</span>
                        </div>
                      </div>

                      {/* QR Preview en la tarjeta */}
                      <div className="p-2 rounded-xl bg-white shadow-md flex-shrink-0 border border-slate-200">
                        <QRCodeSVG
                          id="studio-qr-code"
                          value={targetUrl}
                          size={88}
                          fgColor={qrColor}
                          bgColor={qrBgColor}
                          level="Q"
                          includeMargin={false}
                          imageSettings={
                            includeCenterLogo
                              ? {
                                  src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=64',
                                  x: undefined,
                                  y: undefined,
                                  height: 20,
                                  width: 20,
                                  excavate: true,
                                }
                              : undefined
                          }
                        />
                      </div>
                    </div>

                    {/* Footer de la tarjeta con serial y seguridad */}
                    <div className="flex items-center justify-between text-[9px] font-mono tracking-wider opacity-50 pt-2 border-t border-white/10">
                      <span>NTAG216 • ISO 14443-A</span>
                      <span>PROCONNECT SMART ID</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-4">
                    Vista previa de tarjeta física estándar CR80 (85.6 mm × 53.98 mm con esquinas redondeadas).
                  </p>
                </div>
              </div>

              {/* Guía Interactiva: ¿Cómo programar el Chip NFC? */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-brand-cyan" />
                    <h3 className="text-sm font-bold text-brand-navy">
                      ¿Cómo grabar el chip NFC de tu tarjeta?
                    </h3>
                  </div>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                    Toma 10 segundos
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Para que cualquier celular abra tu tarjeta con solo tocarla, el chip NFC debe tener grabada la URL de tu perfil ProConnect. Puedes hacerlo gratis desde cualquier teléfono:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="w-6 h-6 rounded-full bg-brand-navy text-white text-[11px] font-black flex items-center justify-center mb-2">
                      1
                    </div>
                    <div className="text-xs font-bold text-brand-navy">Descarga NFC Tools</div>
                    <div className="text-[11px] text-slate-500 leading-normal">
                      Descarga la app gratuita <strong>NFC Tools</strong> desde Google Play Store o Apple App Store.
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="w-6 h-6 rounded-full bg-brand-navy text-white text-[11px] font-black flex items-center justify-center mb-2">
                      2
                    </div>
                    <div className="text-xs font-bold text-brand-navy">Escribir Registro URL</div>
                    <div className="text-[11px] text-slate-500 leading-normal">
                      Abre la app, toca <strong>Escribir &gt; Añadir un registro &gt; URL/URI</strong> y pega tu enlace copiado.
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="w-6 h-6 rounded-full bg-brand-navy text-white text-[11px] font-black flex items-center justify-center mb-2">
                      3
                    </div>
                    <div className="text-xs font-bold text-brand-navy">Tocar la Tarjeta</div>
                    <div className="text-[11px] text-slate-500 leading-normal">
                      Presiona <strong>Escribir</strong> y acerca la tarjeta física a la cámara trasera del teléfono. ¡Listo!
                    </div>
                  </div>
                </div>

                {/* Opción Directa Web NFC si disponible */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    ¿Usas Chrome en Android? Puedes probar la grabación directa:
                  </div>
                  <button
                    type="button"
                    onClick={handleWebNFCWrite}
                    className="px-4 py-2 bg-brand-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Radio className="w-3.5 h-3.5 text-brand-cyan" />
                    <span>Grabar con Web NFC</span>
                  </button>
                </div>

                {nfcLog && (
                  <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-medium">
                    {nfcLog}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
