/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * PÁGINA PRINCIPAL — ENFOQUE EN PRESENTACIÓN, VENTAJAS Y 1 MES GRATIS
 * Estilo ultra-limpio, paleta oficial ProConnect (#0A2540, #1E3A8A, #00B4D8).
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  Check,
  X,
  Smartphone,
  QrCode,
  Radio,
  Share2,
  Users,
  MessageCircle,
  Building2,
  ShieldCheck,
  TrendingUp,
  Download,
  Gift,
  Leaf,
  Clock,
  Layers,
  Phone,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'b2b' | 'executive' | 'creative'>('b2b');

  const previewProfiles = {
    b2b: {
      name: 'Carlos Mendoza',
      role: 'Asesor Comercial de Fibra Óptica',
      company: 'FibraConnect Telecom',
      tag: 'Asesor Comercial B2B',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
      banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
      slug: 'carlos-fibraconnect',
      primaryColor: '#0A2540',
      accentColor: '#00B4D8',
    },
    executive: {
      name: 'Elena Rodríguez',
      role: 'Directora de Tecnología e Innovación',
      company: 'NexaCorp Technologies',
      tag: 'Ejecutiva & Dirección',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
      banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
      slug: 'elena-rodriguez',
      primaryColor: '#1E3A8A',
      accentColor: '#38BDF8',
    },
    creative: {
      name: 'María Silva',
      role: 'Líder de Soporte y Proyectos B2B',
      company: 'FibraConnect Telecom',
      tag: 'Gestión & Proyectos',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      banner: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800',
      slug: 'maria-fibraconnect',
      primaryColor: '#0F172A',
      accentColor: '#10B981',
    },
  };

  const currentProfile = previewProfiles[activeTab];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-brand-cyan/20 selection:text-brand-navy">
      <Navbar />

      <main className="flex-1">
        {/* ==================================================================== */}
        {/* 1. HERO SECTION: PRESENTACIÓN + 1 MES GRATIS (CERO PRESIÓN DE PAGO) */}
        {/* ==================================================================== */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 bg-gradient-to-b from-slate-50/70 via-white to-white border-b border-slate-100">
          <div className="absolute top-0 right-1/4 w-[550px] h-[400px] bg-gradient-to-br from-brand-cyan/10 via-brand-mid/5 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Columna Izquierda: Mensaje y Oferta Libre de Riesgo */}
              <div className="lg:col-span-7 space-y-6 text-left">
                
                {/* Badge Amigable Totalmente Gratis */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
                  <Gift className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                  <span>Tu Tarjeta Digital Totalmente Gratis</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-brand-navy leading-[1.12]">
                  La forma más elegante y moderna de{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-brand-mid to-brand-cyan">
                    compartir quién eres.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed font-normal">
                  Dile adiós para siempre a las tarjetas de papel que se pierden o terminan en la basura. Con <strong>ProConnect</strong>, guardas tu contacto con foto, teléfono, redes y catálogo en el celular de tu cliente en <strong>1 segundo</strong> con solo acercar tu tarjeta o mostrar tu código QR.
                </p>

                {/* Bullets de confianza rápida */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {[
                    'Cero apps requeridas (abre en iPhone y Android al instante)',
                    'El cliente guarda tu contacto y tú recibes sus datos (2-Way)',
                    'Actualizable en vivo: cambia tus datos sin reimprimir nada',
                    'Tu tarjeta digital personal es totalmente gratis',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Botones Principales de Acción */}
                <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                  <Link
                    href="/crear"
                    className="px-8 py-4 rounded-2xl bg-brand-navy hover:bg-brand-blue text-white font-black text-sm shadow-xl shadow-brand-navy/20 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-brand-cyan" />
                    <span>Crear Mi Tarjeta Totalmente Gratis</span>
                  </Link>

                  <Link
                    href="/c/carlos-fibraconnect"
                    className="px-7 py-4 rounded-2xl border-2 border-slate-200 hover:border-brand-cyan bg-white text-brand-navy font-bold text-sm flex items-center justify-center gap-2 transition-all hover:bg-brand-cyan/5 hover:scale-[1.02]"
                  >
                    <span>Ver Demo en Vivo</span>
                    <ArrowRight className="w-4 h-4 text-brand-blue" />
                  </Link>
                </div>

                <p className="text-[11px] text-slate-500 font-medium">
                  ✓ Configuración en 2 minutos &nbsp;•&nbsp; ✓ Sin contratos ni cargos automáticos &nbsp;•&nbsp; ✓ Descarga tu QR de inmediato
                </p>
              </div>

              {/* Columna Derecha: Smartphone Interactivo en Vivo */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                
                {/* Selector de pestañas para cambiar la maqueta */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl mb-4 border border-slate-200 shadow-inner">
                  {(['b2b', 'executive', 'creative'] as const).map((tabKey) => (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => setActiveTab(tabKey)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        activeTab === tabKey
                          ? 'bg-white text-brand-navy shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {previewProfiles[tabKey].tag}
                    </button>
                  ))}
                </div>

                {/* Smartphone iPhone Frame */}
                <div className="relative w-[300px] sm:w-[320px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50">
                  
                  {/* Dynamic Island */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30 flex items-center justify-center pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700 mr-2" />
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-950" />
                  </div>

                  {/* Pantalla Interna */}
                  <div className="w-full bg-slate-50 rounded-[40px] overflow-hidden text-left border border-slate-200">
                    
                    {/* Banner */}
                    <div className="h-28 relative overflow-hidden bg-gradient-to-r from-brand-navy to-brand-blue">
                      <img
                        src={currentProfile.banner}
                        alt="Portada"
                        className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                      />
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[9px] font-bold text-white flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 text-brand-cyan" />
                        <span>NFC Activo</span>
                      </div>
                    </div>

                    {/* Contenido de la Tarjeta */}
                    <div className="px-5 pb-5 -mt-10 relative">
                      {/* Avatar */}
                      <div className="relative inline-block">
                        <img
                          src={currentProfile.avatar}
                          alt={currentProfile.name}
                          className="w-18 h-18 rounded-2xl object-cover border-4 border-white shadow-md"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-cyan text-brand-navy flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </div>

                      {/* Info Personal */}
                      <div className="mt-2 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-black text-brand-navy">{currentProfile.name}</h3>
                          <ShieldCheck className="w-3.5 h-3.5 text-brand-cyan flex-shrink-0" />
                        </div>
                        <p className="text-[11px] font-semibold text-slate-600">{currentProfile.role}</p>
                        <p className="text-[10px] text-brand-blue font-bold flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>{currentProfile.company}</span>
                        </p>
                      </div>

                      {/* Botones de Acción de Contacto */}
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <a
                          href="tel:+584141112233"
                          className="py-2 px-2.5 rounded-xl bg-brand-navy hover:bg-brand-blue text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                        >
                          <Phone className="w-3 h-3 text-brand-cyan" />
                          <span>Llamar</span>
                        </a>
                        <a
                          href="https://wa.me/584141112233?text=Hola%20Carlos,%20vi%20tu%20tarjeta%20digital"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>

                      {/* Botón Principal Guardar vCard / Ver Tarjeta */}
                      <Link
                        href="/c/carlos-fibraconnect"
                        className="mt-2.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Abrir Tarjeta Completa & vCard</span>
                      </Link>

                      {/* Botón Intercambiar Contacto 2-Way */}
                      <Link
                        href="/c/carlos-fibraconnect"
                        className="mt-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Share2 className="w-3 h-3 text-brand-blue" />
                        <span>🤝 Conectar / Dejar Mis Datos</span>
                      </Link>
                    </div>
                  </div>

                  {/* Indicador Home */}
                  <div className="w-24 h-1 bg-white/40 rounded-full mx-auto mt-2" />
                </div>

                {/* Badge Flotante */}
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Smartphone className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Compatible con iPhone, Android, tablets y laptops</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 2. EL PROBLEMA DEL PAPEL VS LA SOLUCIÓN PROCONNECT */}
        {/* ==================================================================== */}
        <section className="py-16 bg-slate-50 border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <span className="text-xs font-black text-brand-blue uppercase tracking-wider">
                ¿Por qué cambiar hoy mismo?
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-brand-navy">
                El fin de las tarjetas de papel tradicionales.
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Las tarjetas de cartulina pertenecen al siglo pasado. Mira la diferencia entre el método obsoleto y la experiencia ProConnect:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Tarjeta de Papel (Problema) */}
              <div className="p-8 rounded-3xl bg-white border border-rose-100 shadow-sm space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                    <X className="w-3.5 h-3.5 text-rose-600" />
                    <span>Tarjeta Tradicional de Papel</span>
                  </div>
                  <span className="text-2xl">🗑️</span>
                </div>

                <div className="space-y-3.5 pt-2">
                  {[
                    'El 88% se botan a la basura en los primeros 7 días.',
                    'Información estática: si cambias de teléfono o cargo, debes tirarlas todas.',
                    'Costo constante: gastos continuos en imprenta cada vez que se agotan.',
                    'Solo tú entregas datos: no tienes forma de saber quién era el cliente ni capturar sus datos.',
                    'Cero métricas: no sabes si alguien la leyó o la tiró a la papelera.',
                    'Tala de árboles y contaminación por tintas y laminados plásticos.',
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tarjeta Inteligente ProConnect (Solución) */}
              <div className="p-8 rounded-3xl bg-white border-2 border-brand-cyan/40 shadow-xl shadow-brand-cyan/5 space-y-5 relative overflow-hidden ring-1 ring-brand-cyan/30">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/20 text-brand-navy text-xs font-black border border-brand-cyan/40">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue" />
                    <span>Tarjeta Inteligente ProConnect</span>
                  </div>
                  <span className="text-2xl">🚀</span>
                </div>

                <div className="space-y-3.5 pt-2">
                  {[
                    'Tu contacto se guarda directo en la libreta del celular del cliente con foto y notas.',
                    '100% actualizable en la nube: si cambias de cargo, tu tarjeta física sigue funcionando.',
                    'Intercambio bidireccional (2-Way): el cliente te deja su WhatsApp y entra a tu CRM.',
                    'Una sola tarjeta dura años (ahorro del 100% en gastos de imprenta futuros).',
                    'Analíticas en tiempo real: cuántas personas te vieron y cuántos guardaron tu vCard.',
                    'Ecológica y sustentable: contribuye a la reducción de huella de carbono.',
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-800 font-semibold">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 3. VENTAJAS CLAVE Y BENEFICIOS PARA EL CLIENTE */}
        {/* ==================================================================== */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-black text-brand-cyan uppercase tracking-wider">
                Tecnología al Servicio de tus Ventas
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-brand-navy">
                Todo lo que ganas al pasarte a ProConnect.
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Diseñado para profesionales independientes, fuerzas comerciales y directores que valoran su tiempo y reputación.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Ventaja 1 */}
              <div className="p-6 rounded-3xl bg-slate-50/70 border border-slate-100 hover:border-brand-cyan/40 hover:bg-white hover:shadow-lg transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-navy text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-6 h-6 text-brand-cyan" />
                </div>
                <h3 className="text-base font-bold text-brand-navy">Primera Impresión Imborrable</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cuando tocas el teléfono de un cliente con tu tarjeta física o le muestras tu QR dinámico, el impacto visual genera una percepción inmediata de éxito y modernidad.
                </p>
              </div>

              {/* Ventaja 2 */}
              <div className="p-6 rounded-3xl bg-slate-50/70 border border-slate-100 hover:border-brand-cyan/40 hover:bg-white hover:shadow-lg transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <Share2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-brand-navy">Intercambio de Contacto 2-Way</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No te vayas con las manos vacías. Tu cliente puede pulsar "Conectar" para dejarte su nombre, teléfono y consulta, almacenándose al instante en tu CRM personal.
                </p>
              </div>

              {/* Ventaja 3 */}
              <div className="p-6 rounded-3xl bg-slate-50/70 border border-slate-100 hover:border-brand-cyan/40 hover:bg-white hover:shadow-lg transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-md">
                  <Smartphone className="w-6 h-6 text-brand-cyan" />
                </div>
                <h3 className="text-base font-bold text-brand-navy">Cero Apps, Cero Fricción</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tu interlocutor no tiene que descargar ninguna aplicación. Funciona con la cámara o el lector NFC nativo de iOS y Android en menos de un segundo.
                </p>
              </div>

              {/* Ventaja 4 */}
              <div className="p-6 rounded-3xl bg-slate-50/70 border border-slate-100 hover:border-brand-cyan/40 hover:bg-white hover:shadow-lg transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-brand-navy">Actualizaciones en Tiempo Real</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ¿Nuevo número de teléfono, ascenso de puesto o nueva oficina? Cambia los datos en tu panel web y tu tarjeta se actualiza de inmediato para todo el mundo.
                </p>
              </div>

              {/* Ventaja 5 */}
              <div className="p-6 rounded-3xl bg-slate-50/70 border border-slate-100 hover:border-brand-cyan/40 hover:bg-white hover:shadow-lg transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-brand-navy">Catálogo &amp; Multimedia</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No te limites a números de teléfono. Añade brochures en PDF, enlaces a presentaciones, portafolio de proyectos y enlaces de pago directo.
                </p>
              </div>

              {/* Ventaja 6 */}
              <div className="p-6 rounded-3xl bg-slate-50/70 border border-slate-100 hover:border-brand-cyan/40 hover:bg-white hover:shadow-lg transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-md">
                  <Leaf className="w-6 h-6 text-emerald-300" />
                </div>
                <h3 className="text-base font-bold text-brand-navy">100% Ecológico &amp; Sostenible</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ayuda a salvar árboles y elimina el plástico desechable. Una sola tarjeta digital puede durar toda tu carrera profesional.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 4. CÓMO FUNCIONA EN 3 PASOS SENCILLOS */}
        {/* ==================================================================== */}
        <section className="py-16 bg-slate-50 border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-black text-brand-blue uppercase tracking-wider">
                Fácil, Rápido y Sin Complicaciones
              </span>
              <h2 className="text-3xl font-black text-brand-navy">¿Cómo empezar en 3 pasos?</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 text-left">
                <div className="w-8 h-8 rounded-full bg-brand-navy text-white text-xs font-black flex items-center justify-center">
                  1
                </div>
                <h3 className="text-sm font-bold text-brand-navy">Crea tu Perfil Gratis</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ingresa tu nombre, cargo, teléfono, foto y redes sociales. Elige entre nuestras plantillas limpias la que mejor se adapte a tu estilo.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 text-left">
                <div className="w-8 h-8 rounded-full bg-brand-blue text-white text-xs font-black flex items-center justify-center">
                  2
                </div>
                <h3 className="text-sm font-bold text-brand-navy">Comparte con un Toque</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Muestra tu código QR dinámico desde tu teléfono o acerca tu tarjeta física NFC a cualquier celular. Se abrirá en su navegador al instante.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 text-left">
                <div className="w-8 h-8 rounded-full bg-brand-cyan text-brand-navy text-xs font-black flex items-center justify-center">
                  3
                </div>
                <h3 className="text-sm font-bold text-brand-navy">Guarda y Conecta</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tu cliente descarga tu vCard directamente a sus contactos y puede enviarte sus datos para que continúes la negociación por WhatsApp.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 5. BANNER FINAL: PRUEBA 1 TARJETA GRATIS POR 1 MES COMPLETO */}
        {/* ==================================================================== */}
        <section className="py-20 bg-brand-navy text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-cyan/10 blur-3xl rounded-full pointer-events-none" />
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-brand-cyan text-xs font-bold">
              <Gift className="w-4 h-4" />
              <span>Totalmente Gratis • Sin Costo</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Empieza hoy mismo y experimenta el poder de conectar sin papel.
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              Crea tu primera tarjeta de presentación digital en minutos. Sin ingresar tarjeta de crédito, sin caducidad. Diseñada para profesionales que buscan causar un impacto inolvidable.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/crear"
                className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-brand-cyan text-brand-navy font-black text-sm hover:bg-sky-300 transition-all shadow-xl shadow-brand-cyan/20 hover:scale-105"
              >
                Crear Mi Tarjeta Totalmente Gratis
              </Link>
              
              <Link
                href="/nfc-studio"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/25 text-white font-bold text-sm hover:bg-white/10 transition-colors"
              >
                Diseñar Tarjeta Física &amp; QR
              </Link>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span>✓ Totalmente Gratis</span>
              <span>✓ QR dinámico descargable</span>
              <span>✓ 100% actualizable</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
