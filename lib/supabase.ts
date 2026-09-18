// © ProConnect. Todos los derechos reservados.
// Queda prohibida la reproducción, copia o ingeniería inversa de este software.

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    console.log(
      '[ProConnect] NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no están configuradas.'
    );
  }
}

/**
 * Cliente Supabase universal:
 * En navegador usa createBrowserClient (@supabase/ssr) para sincronizar cookies de sesión.
 * En servidor usa createClient básico.
 */
export const supabase = supabaseUrl && supabaseAnonKey
  ? (typeof window !== 'undefined'
      ? createBrowserClient(supabaseUrl, supabaseAnonKey)
      : createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        }))
  : null;

/** true = Supabase activo; false = modo demo con localStorage */
export const isSupabaseEnabled = !!supabase;
