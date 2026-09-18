// © ProConnect. Todos los derechos reservados.
// Queda prohibida la reproducción, copia o ingeniería inversa de este software.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // En modo demo/local (sin .env.local) se usa localStorage como mock.
  // En producción (Vercel) configura las env vars en Project Settings → Environment Variables.
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    console.log(
      '[ProConnect] NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no están configuradas. ' +
      'La aplicación funcionará en modo demo (localStorage). Para activar Supabase, configura las variables en Vercel.'
    );
  }
}

/**
 * Cliente Supabase singleton — las claves se leen EXCLUSIVAMENTE desde variables de entorno.
 * Retorna null si las variables no están disponibles (modo demo/local).
 */
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** true = Supabase activo; false = modo demo con localStorage */
export const isSupabaseEnabled = !!supabase;
