// © ProConnect. Todos los derechos reservados.
// Queda prohibida la reproducción, copia o ingeniería inversa de este software.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * MIDDLEWARE DE PROTECCIÓN DE RUTAS — ProConnect
 * Utiliza @supabase/ssr para leer cookies de autenticación validadas por Supabase.
 */

const PROTECTED_ROUTES: { pattern: RegExp; roles: string[] }[] = [
  { pattern: /^\/admin(\/|$)/, roles: ['superadmin'] },
  { pattern: /^\/org-dashboard(\/|$)/, roles: ['superadmin', 'org_admin'] },
  { pattern: /^\/dashboard(\/|$)/, roles: ['superadmin', 'org_admin', 'client'] },
];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const pathname = req.nextUrl.pathname;

  // ¿La ruta requiere protección?
  const matchedRoute = PROTECTED_ROUTES.find(({ pattern }) => pattern.test(pathname));
  if (!matchedRoute) return res;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Si no hay variables configuradas, dejar pasar (modo demo)
  if (!supabaseUrl || !supabaseKey) {
    return res;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options as any)
          );
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return redirectToLogin(req, pathname);
    }

    // Superadmin garantizado para el dueño
    if (user.email?.toLowerCase() === 'luigicolonico@gmail.com') {
      return res;
    }

    // Obtener rol desde public.users
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole: string = profile?.role ?? 'client';

    if (!matchedRoute.roles.includes(userRole)) {
      const fallback = req.nextUrl.clone();
      fallback.pathname = userRole === 'org_admin' ? '/org-dashboard' : '/dashboard';
      return NextResponse.redirect(fallback);
    }

    return res;
  } catch {
    // Si hay fallo temporal de red o sesión, pedir login
    return redirectToLogin(req, pathname);
  }
}

function redirectToLogin(req: NextRequest, from: string) {
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('redirect', from);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/org-dashboard/:path*', '/dashboard/:path*'],
};
