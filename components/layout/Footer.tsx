/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

import React from 'react';
import Link from 'next/link';
import { Radio, Shield, Lock, FileText } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-sm">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                ProConnect SaaS Platform
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                © ProConnect. Todos los derechos reservados. Queda prohibida la reproducción, copia o ingeniería inversa de este software.
              </p>
            </div>
          </div>

          {/* Legal & Product Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <Link
              href="/pricing"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-semibold"
            >
              Precios y Planes
            </Link>
            <Link
              href="/nfc-studio"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-semibold"
            >
              NFC &amp; QR Studio
            </Link>
            <Link
              href="/terminos"
              className="hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Términos y Condiciones
            </Link>

            <Link
              href="/privacidad"
              className="hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              Política de Privacidad
            </Link>

            <Link
              href="/admin"
              className="hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1.5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              Acceso Administrativo
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
