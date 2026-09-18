/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Shield, FileText, Lock, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 mb-4 border border-sky-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            Términos y Condiciones de Servicio
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Última actualización: Septiembre 2026 • Plataforma SaaS ProConnect
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-500" />
              1. Aceptación de los Términos
            </h2>
            <p>
              Al acceder, registrarse o utilizar la plataforma SaaS <strong>ProConnect</strong>, sus servicios de perfil digital, generación de vCard, vinculación NFC y códigos QR, usted acepta quedar plenamente vinculado por estos Términos y Condiciones. Si no está de acuerdo con cualquiera de estas cláusulas, debe abstenerse de utilizar el software.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-500" />
              2. Propiedad Intelectual y Restricción de Ingeniería Inversa
            </h2>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-medium">
              © ProConnect. Todos los derechos reservados. Queda expresamente prohibida la reproducción, distribución, copia, ingeniería inversa, descompilación o comercialización no autorizada de este software, su arquitectura y su código fuente.
            </div>
            <p>
              Toda la propiedad intelectual relativa a la plataforma (interfaces visuales, compiladores vCard, lógica de vinculación NFC, código fuente Next.js/React y esquemas de base de datos) pertenece en exclusiva a ProConnect. La suscripción al servicio concede únicamente una licencia de uso personal o corporativa intransferible.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-500" />
              3. Responsabilidad sobre el Contenido Subido por el Usuario
            </h2>
            <p>
              El usuario es el único y exclusivo responsable de la veracidad, legalidad y derechos de autor sobre las imágenes, logotipos, enlaces, catálogos PDF y videos cargados en su perfil digital. ProConnect se reserva el derecho inalienable de suspender o revocar inmediatamente cualquier tarjeta digital (`is_active = false`) que contenga material difamatorio, ilegal o fraudulento.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-500" />
              4. Uso de Chips Físicos NFC y Códigos QR
            </h2>
            <p>
              ProConnect provee el software y enlaces codificados para la escritura de chips NFC tipo NTAG213, NTAG215 y NTAG216. La plataforma no es responsable por daños físicos en hardware de terceros o grabaciones defectuosas ocasionadas por aplicaciones externas de escritura.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-500" />
              5. Limitación de Responsabilidad
            </h2>
            <p>
              El servicio se presta &quot;TAL CUAL&quot; y &quot;SEGÚN DISPONIBILIDAD&quot;. En la máxima medida permitida por la legislación aplicable, ProConnect no garantiza la ausencia total de interrupciones técnicas derivadas de redes de telecomunicaciones de terceros o de plataformas externas vinculadas (WhatsApp, LinkedIn, Instagram).
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
