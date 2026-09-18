// © ProConnect. Todos los derechos reservados.
// Queda prohibida la reproducción, copia o ingeniería inversa de este software.

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Radio, Lock, Mail, ArrowRight, ShieldCheck, User, Building2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { isSupabaseEnabled, supabase } from '@/lib/supabase';

type Mode = 'login' | 'register';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Verificar si ya hay sesión activa
  useEffect(() => {
    if (isSupabaseEnabled && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          if (session.user.email?.toLowerCase() === 'luigicolonico@gmail.com') {
            window.location.href = '/admin';
          } else {
            window.location.href = redirectTo;
          }
        }
      });
    }
  }, [redirectTo]);

  // ──────────────────────────────────────────
  // HANDLERS MODO DEMO (sin Supabase)
  // ──────────────────────────────────────────
  const handleDemoClient = () => router.push('/dashboard');
  const handleDemoOrgAdmin = () => router.push('/org-dashboard');
  const handleDemoAdmin = () => router.push('/admin');

  // ──────────────────────────────────────────
  // SUBMIT: Login o Registro
  // ──────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // ── MODO MOCK: Si Supabase no está configurado ──
      if (!isSupabaseEnabled || !supabase) {
        await new Promise((r) => setTimeout(r, 600));
        router.push(redirectTo);
        return;
      }

      if (mode === 'login') {
        // ── SUPABASE: Iniciar sesión ──
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(
            authError.message === 'Invalid login credentials'
              ? 'Correo o contraseña incorrectos. Verifica tus datos.'
              : authError.message
          );
          return;
        }

        // Obtener rol para redirigir apropiadamente
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          let role = 'client';
          if (user.email?.toLowerCase() === 'luigicolonico@gmail.com') {
            role = 'superadmin';
          } else {
            const { data: profile } = await supabase
              .from('users')
              .select('role')
              .eq('id', user.id)
              .single();
            role = profile?.role ?? 'client';
          }

          if (role === 'superadmin') {
            window.location.href = '/admin';
          } else if (role === 'org_admin') {
            window.location.href = '/org-dashboard';
          } else {
            window.location.href = redirectTo;
          }
        }
      } else {
        // ── SUPABASE: Registro de nuevo usuario ──
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        setSuccess(
          '¡Cuenta creada! Revisa tu correo electrónico para confirmar tu dirección y acceder a ProConnect.'
        );
        setMode('login');
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">

          {/* Header */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center mx-auto mb-3 border border-sky-500/20">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {mode === 'login'
                ? 'Accede a tus tarjetas NFC y códigos QR'
                : 'Únete a ProConnect de forma gratuita'}
            </p>
          </div>

          {/* Toggle Modo */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === m
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {m === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          {/* Alertas */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-sky-500" />
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Ana García López"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-sky-500" />
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                autoComplete="username"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-sky-500" />
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Ingresar a Mi Cuenta' : 'Crear Mi Cuenta'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Accesos Rápidos Demo */}
          {!isSupabaseEnabled && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
                🧪 Modo Demostración (Sin Supabase)
              </span>
              <button
                type="button"
                onClick={handleDemoClient}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-sky-500" />
                <span>Ingresar como Cliente (Elena Rodríguez)</span>
              </button>
              <button
                type="button"
                onClick={handleDemoOrgAdmin}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-violet-500" />
                <span>Ingresar como Admin Corporativo (NexaCorp)</span>
              </button>
              <button
                type="button"
                onClick={handleDemoAdmin}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Ingresar como Superadministrador</span>
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
