/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Shield, Building2, ExternalLink, Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { isSuperAdminEmail } from '@/lib/db-normalize';

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (isSupabaseEnabled && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user || null);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const handleLogout = async () => {
    if (isSupabaseEnabled && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-blue/10 bg-white/90 dark:bg-brand-dark/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* ── Brand Logo ── */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform">
            <Image
              src="/brand/logo.png"
              alt="ProConnect Logo"
              fill
              className="object-contain p-0.5"
              priority
            />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-black tracking-tight brand-gradient-text">
              ProConnect
            </span>
            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 uppercase tracking-widest">
              NFC &amp; B2B
            </span>
          </div>
        </Link>

        {/* ── Desktop Nav ── */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Link href="/#ventajas" className="hover:text-brand-cyan transition-colors">
            Ventajas
          </Link>
          <Link href="/nfc-studio" className="hover:text-brand-cyan transition-colors">
            Tarjetas Físicas &amp; QR
          </Link>
          <Link href="/r/brasa-criolla?mesa=1" target="_blank" className="hover:text-brand-cyan transition-colors flex items-center gap-1">
            <span>🍽️ Gastro NFC</span><ExternalLink className="w-3 h-3 opacity-50" />
          </Link>
          <Link href="/c/carlos-fibraconnect" target="_blank" className="hover:text-brand-cyan transition-colors flex items-center gap-1">
            <span>Demo en Vivo</span><ExternalLink className="w-3 h-3 opacity-50" />
          </Link>
          <Link href="/pricing" className="hover:text-brand-cyan transition-colors text-slate-500">
            Planes
          </Link>
        </nav>

        {/* ── Right Side Action ── */}
        <div className="flex items-center gap-2">
          <Link
            href="/crear"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-black transition-all shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Totalmente Gratis</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href={isSuperAdminEmail(user.email) ? '/admin' : '/dashboard'}
                className="btn-brand text-xs px-3.5 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-brand-blue/20"
                title={`Conectado como ${user.email}`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">{user.email?.split('@')[0]}</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-sm"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-brand text-xs px-4 sm:px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-brand-blue/20"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Acceso al Portal</span>
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menú"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Nav ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-brand-dark px-4 py-3 space-y-1">
          {[
            { href: '/#features', label: 'Características', icon: '✨' },
            { href: '/nfc-studio', label: 'Tarjetas Físicas NFC', icon: '💳' },
            { href: '/r/brasa-criolla?mesa=1', label: 'Demo Restaurante (Gastro)', icon: '🍽️' },
            { href: '/c/carlos-fibraconnect', label: 'Demo Asesor FibraConnect (B2B)', icon: '💼' },
          ].map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <span>{icon}</span><span>{label}</span>
            </Link>
          ))}

          {user ? (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <Link
                href={isSuperAdminEmail(user.email) ? '/admin' : '/dashboard'}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Ir a mi Panel ({user.email})</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <span>🔐</span><span>Ingresar a mi Cuenta</span>
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
