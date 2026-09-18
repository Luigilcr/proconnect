/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Lock, ShieldCheck, CheckCircle2, EyeOff, Database } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4 border border-emerald-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            Política de Privacidad y Protección de Datos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Compromiso de Privacidad y Seguridad • ProConnect SaaS
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Destacado: No Venta de Datos */}
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
            <EyeOff className="w-6 h-6 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm mb-1">
                Garantía Estricta: Jamás Vendemos Tus Datos a Terceros
              </h3>
              <p className="text-xs">
                En ProConnect tu privacidad y la de tus contactos es primordial. Bajo ninguna circunstancia comercializamos, alquilamos, monetizamos ni transferimos bases de datos de perfiles, teléfonos o correos electrónicos a empresas de publicidad o intermediarios de datos.
              </p>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              1. Información que Recopilamos
            </h2>
            <p>
              Recopilamos únicamente la información estrictamente necesaria para prestar el servicio de tarjetas inteligentes:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li><strong>Datos de Cuenta:</strong> Correo electrónico y contraseña segura gestionada a través de Supabase Auth.</li>
              <li><strong>Datos de Perfil Público:</strong> Nombre profesional, puesto, empresa, biografía, enlaces a redes sociales y archivos multimedia autorizados expresamente para su visualización pública.</li>
              <li><strong>Métricas de Contacto:</strong> Contadores agregados y anónimos de interacción para análisis interno en el dashboard.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              2. Procesamiento de vCard (.vcf) y WhatsApp
            </h2>
            <p>
              La generación de la ficha de contacto en formato <strong>.vcf (vCard 3.0)</strong> se compila del lado del cliente en el propio navegador web del visitante mediante Blobs de memoria locales. Los mensajes de WhatsApp inteligente se transfieren directamente a los servidores oficiales de WhatsApp (Meta) sin almacenar el texto de las conversaciones en bases de datos intermedias.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              3. Seguridad y Almacenamiento (Supabase PostgreSQL)
            </h2>
            <p>
              Todos los datos se almacenan en clústeres seguros de PostgreSQL alojados en la nube con cifrado en reposo (AES-256) y en tránsito (TLS/SSL). Aplicamos políticas estrictas de <strong>Row Level Security (RLS)</strong> que garantizan que únicamente el titular autenticado de una cuenta pueda modificar sus tarjetas y catálogos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              4. Derechos ARCO y GDPR
            </h2>
            <p>
              Usted tiene derecho en cualquier momento a acceder, rectificar, cancelar u oponerse al tratamiento de sus datos personales, así como a solicitar la eliminación definitiva de su cuenta y todas sus tarjetas digitales asociadas enviando un correo a <span className="font-semibold text-sky-500">privacidad@proconnect.app</span>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
