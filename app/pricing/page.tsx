/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * PÁGINA DE PRECIOS & PLANES COMERCIALES (ESTILO HIHELLO & STRIPE)
 * Paleta oficial: Navy (#0A2540), Corporate Blue (#1E3A8A), Electric Cyan (#00B4D8).
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Check,
  ShieldCheck,
  Building2,
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  CreditCard,
  Lock,
  Download,
  Users,
} from 'lucide-react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const plans = [
    {
      id: 'individual',
      name: 'Plan Personal',
      badge: 'Totalmente Gratis',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      priceMonthly: 0,
      priceAnnual: 0,
      description: 'Tu tarjeta digital interactiva personal es totalmente gratuita. Comparte tu perfil profesional al instante sin costos ocultos.',
      popular: false,
      ctaText: 'Crear mi Tarjeta Gratis',
      ctaHref: '/crear',
      features: [
        '1 Tarjeta Digital Interactiva (Totalmente Gratis)',
        'Código QR Dinámico descargable en PNG / SVG',
        'Compatibilidad 100% con chips NFC',
        'Captura de contactos 2-Way (Intercambio)',
        'Analíticas de visitas y clics en tiempo real',
        'Descarga directa de vCard al teléfono',
        'Enlaces ilimitados (WhatsApp, Redes, Web)',
      ],
      notIncluded: [
        'Múltiples tarjetas para colaboradores',
        'Panel administrativo de empresa',
        'Control estricto de marca corporativa (Brand Lock)',
      ],
    },
    {
      id: 'business',
      name: 'Equipos & Empresas B2B',
      badge: 'El Más Elegido por Empresas',
      badgeColor: 'bg-brand-cyan/20 text-brand-navy border-brand-cyan/40',
      priceMonthly: 49,
      priceAnnual: 39, // $39/mo for 5 members
      description: 'Control centralizado, gestión de fuerza de ventas y nutrición automática de prospectos en tu CRM.',
      popular: true,
      ctaText: 'Solicitar Demostración B2B',
      ctaHref: '/org-dashboard',
      features: [
        'Desde 5 hasta 500+ Tarjetas para empleados',
        'Panel Superadmin y Org-Admin centralizado',
        'Control estricto de marca (Brand Lock)',
        'CRM de Leads integrado para toda la fuerza comercial',
        'Descarga y exportación a Excel / CSV',
        'Plantilla corporativa personalizada unificada',
        'Interruptor de suscripción (Kill Switch) para seguridad',
        'Soporte prioritario y asesoría en tarjetas físicas NFC',
      ],
      notIncluded: [],
    },
    {
      id: 'gastro',
      name: 'ProConnect Gastro',
      badge: 'Especial para Restaurantes & Bares',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      priceMonthly: 35,
      priceAnnual: 29,
      description: 'Menús digitales sin contacto para mesas con pedidos directos y recolección de reseñas en Google.',
      popular: false,
      ctaText: 'Ver Demo Gastro NFC',
      ctaHref: '/r/brasa-criolla?mesa=1',
      features: [
        'Mesas inteligentes ilimitadas con códigos QR únicos',
        'Menú digital con fotos, categorías y estados en vivo',
        'Generador de pedidos y comandas sin esperas',
        'Captura de reseñas 5 estrellas para Google Maps',
        'Botón de llamada al mesonero y solicitud de cuenta',
        'Módulo de pago móvil, Zelle y transferencias',
      ],
      notIncluded: [
        'Tarjetas de contacto individuales',
      ],
    },
  ];

  const faqs = [
    {
      q: '¿La persona que recibe mi tarjeta necesita instalar alguna app?',
      a: 'No, en lo absoluto. Al acercar la tarjeta física NFC o escanear el código QR con cualquier iPhone o Android, el perfil se abre de inmediato en el navegador web del teléfono.',
    },
    {
      q: '¿Cómo funciona la captura de datos (CRM) de los prospectos?',
      a: 'Cuando tu asesor comercial comparte su tarjeta, el cliente tiene un botón visible "🤝 Conectar / Dejar Mis Datos". Al pulsar, ingresa su nombre, WhatsApp y correo. Al enviar, el cliente recibe automáticamente la vCard del vendedor y los datos del cliente se guardan en tiempo real en el CRM de tu empresa.',
    },
    {
      q: '¿Puedo actualizar mi información después de comprar o imprimir tarjetas físicas?',
      a: 'Sí. El chip NFC y el código QR apuntan a tu enlace dinámico en la nube. Puedes cambiar tu cargo, número telefónico, enlaces a redes o catálogo tantas veces como quieras y la tarjeta física seguirá funcionando perfectamente.',
    },
    {
      q: '¿Qué es la función de Bloqueo de Marca (Brand Lock)?',
      a: 'Es una función enterprise que garantiza que ningún empleado pueda alterar los colores corporativos, tipografía ni logotipos oficiales de la empresa, manteniendo la imagen de marca 100% homogénea y profesional.',
    },
    {
      q: '¿Dónde puedo conseguir las tarjetas físicas plásticas o metálicas NFC?',
      a: 'Puedes usar nuestro módulo NFC & QR Studio para descargar los archivos de diseño en ultra-alta resolución (300 DPI) para imprimirlas con tu proveedor de confianza, o solicitar nuestro servicio de tarjetas de PVC mate, madera o metal grabadas con chip NTAG213/216.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-brand-cyan/20 selection:text-brand-navy">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="pt-16 pb-12 bg-gradient-to-b from-slate-50 via-white to-white border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-navy/5 border border-brand-navy/10 text-brand-navy text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Planes Claros y Transparentes</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-brand-navy">
              Elige el plan ideal para impulsar tu{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-cyan">
                presencia comercial.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              Desde profesionales independientes hasta corporaciones con cientos de ejecutivos. Ahorra hasta un 20% con facturación anual.
            </p>

            {/* Toggle Mensual / Anual */}
            <div className="pt-6 flex items-center justify-center gap-3">
              <span className={`text-sm font-semibold ${billingCycle === 'monthly' ? 'text-brand-navy' : 'text-slate-500'}`}>
                Facturación Mensual
              </span>
              <button
                type="button"
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                className="w-14 h-8 bg-brand-navy rounded-full p-1 relative transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan"
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                    billingCycle === 'annual' ? 'translate-x-6 bg-brand-cyan' : 'translate-x-0'
                  }`}
                />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-semibold ${billingCycle === 'annual' ? 'text-brand-navy' : 'text-slate-500'}`}>
                  Facturación Anual
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider">
                  Ahorra 20%
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Planes Grid */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {plans.map((plan) => {
                const currentPrice = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
                return (
                  <div
                    key={plan.id}
                    className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
                      plan.popular
                        ? 'bg-slate-900 text-white shadow-2xl ring-2 ring-brand-cyan lg:-translate-y-2'
                        : 'bg-white border border-slate-200 text-slate-900 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-blue to-brand-cyan text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
                        Recomendado para Empresas
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${plan.badgeColor}`}>
                          {plan.badge}
                        </span>
                      </div>

                      <h2 className={`text-2xl font-black mb-2 ${plan.popular ? 'text-white' : 'text-brand-navy'}`}>
                        {plan.name}
                      </h2>
                      <p className={`text-xs mb-6 leading-relaxed ${plan.popular ? 'text-slate-300' : 'text-slate-600'}`}>
                        {plan.description}
                      </p>

                      {/* Precio */}
                      <div className="flex items-baseline gap-1.5 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                        {currentPrice === 0 ? (
                          <>
                            <span className="text-4xl sm:text-5xl font-black tracking-tight text-emerald-600">
                              Gratis
                            </span>
                            <span className={`text-sm font-semibold ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>
                              • Totalmente Gratis
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-4xl sm:text-5xl font-black tracking-tight">
                              ${currentPrice}
                            </span>
                            <span className={`text-sm font-semibold ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>
                              /mes {billingCycle === 'annual' && '(pago anual)'}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Features List */}
                      <div className="space-y-3.5 mb-8">
                        <p className={`text-xs font-bold uppercase tracking-wider ${plan.popular ? 'text-brand-cyan' : 'text-brand-navy'}`}>
                          Qué incluye este plan:
                        </p>
                        {plan.features.map((feat, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-xs">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                plan.popular
                                  ? 'bg-brand-cyan/20 text-brand-cyan'
                                  : 'bg-emerald-100 text-emerald-600'
                              }`}
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span className={plan.popular ? 'text-slate-200' : 'text-slate-700'}>
                              {feat}
                            </span>
                          </div>
                        ))}

                        {plan.notIncluded.length > 0 && (
                          <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
                            {plan.notIncluded.map((feat, i) => (
                              <div key={i} className="flex items-start gap-2.5 text-xs text-slate-400 opacity-60">
                                <span className="w-4 h-4 flex items-center justify-center text-slate-400">×</span>
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botón CTA */}
                    <Link
                      href={plan.ctaHref}
                      className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                        plan.popular
                          ? 'bg-brand-cyan text-brand-navy hover:bg-sky-300 font-extrabold shadow-brand-cyan/20'
                          : 'bg-brand-navy text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>{plan.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Garantías y Seguridad Corporativa */}
        <section className="py-12 bg-slate-50 border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center sm:text-left">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-brand-navy/5 text-brand-navy flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-brand-blue" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-navy">Seguridad &amp; Cero Fugas</h3>
                  <p className="text-xs text-slate-600">Cumplimiento de privacidad y cifrado en tránsito SSL/TLS.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-brand-navy/5 text-brand-navy flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-navy">Pagos Flexibles</h3>
                  <p className="text-xs text-slate-600">Tarjetas internacionales, Zelle, transferencias o Pago Móvil.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-brand-navy/5 text-brand-navy flex items-center justify-center flex-shrink-0">
                  <Download className="w-6 h-6 text-brand-cyan" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-navy">Tus Datos son Tuyos</h3>
                  <p className="text-xs text-slate-600">Exporta todos tus contactos y métricas en Excel en cualquier momento.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección FAQ Acordeón */}
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Resolvemos tus Dudas</span>
              </div>
              <h2 className="text-3xl font-black text-brand-navy">Preguntas Frecuentes</h2>
              <p className="text-sm text-slate-600">
                Todo lo que necesitas saber antes de implementar ProConnect en tu empresa.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-sm text-brand-navy hover:bg-slate-50 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-brand-cyan flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Banner CTA Final */}
        <section className="py-16 bg-brand-navy text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              ¿Listo para modernizar la identidad de tu empresa?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Comienza hoy mismo o agenda una videollamada para configurar el plan empresarial de tu equipo.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/org-dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-cyan text-brand-navy font-bold text-xs hover:bg-sky-300 transition-colors shadow-lg"
              >
                Probar Panel Empresarial B2B
              </Link>
              <Link
                href="/nfc-studio"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/10 transition-colors"
              >
                Diseñar Tarjetas Físicas &amp; QR
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
