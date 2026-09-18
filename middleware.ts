// © ProConnect. Todos los derechos reservados.
// Queda prohibida la reproducción, copia o ingeniería inversa de este software.

import { NextRequest, NextResponse } from 'next/server';

/**
 * MIDDLEWARE DE PROTECCIÓN DE RUTAS — ProConnect
 *
 * Si Supabase está configurado (env vars presentes), valida la sesión mediante
 * la cookie `sb-<projectRef>-auth-token` que Supabase inyecta automáticamente.
 * Si no está configurado (modo demo local), deja pasar todas las peticiones.
 *
 * Jerarquía de acceso:
 *   superadmin  → /admin, /org-dashboard, /dashboard
 *   org_admin   → /org-dashboard, /dashboard
 *   client      → /dashboard
 */

const PROTECTED_ROUTES: { pattern: RegExp; roles: string[] }[] = [
  { pattern: /^\/admin(\/|$)/, roles: ['superadmin'] },
  { pattern: /^\/org-dashboard(\/|$)/, roles: ['superadmin', 'org_admin'] },
  { pattern: /^\/dashboard(\/|$)/, roles: ['superadmin', 'org_admin', 'client'] },
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // ¿La ruta requiere protección?
  const matchedRoute = PROTECTED_ROUTES.find(({ pattern }) => pattern.test(pathname));
  if (!matchedRoute) return res;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ── MODO DEMO/LOCAL: sin Supabase → acceso libre ──
  if (!supabaseUrl || !supabaseKey) {
    return res;
  }

  // ── MODO PRODUCCIÓN: verificar sesión via REST API de Supabase ──
  // La sesión se lleva en la cookie `sb-<ref>-auth-token` (base64 JSON).
  // Extraemos el access_token y lo validamos contra la API de Supabase.
  try {
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
    const authCookie =
      req.cookies.get(`sb-${projectRef}-auth-token`)?.value ||
      req.cookies.get('supabase-auth-token')?.value;

    if (!authCookie) {
      return redirectToLogin(req, pathname);
    }

    // Decodificar el token de sesión (array JSON codificado en base64)
    let accessToken: string | null = null;
    try {
      const decoded = JSON.parse(atob(authCookie));
      accessToken = Array.isArray(decoded) ? decoded[0] : decoded?.access_token ?? null;
    } catch {
      return redirectToLogin(req, pathname);
    }

    if (!accessToken) return redirectToLogin(req, pathname);

    // Obtener el usuario actual desde la API de Supabase
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseKey,
      },
    });

    if (!userRes.ok) return redirectToLogin(req, pathname);

    const user = await userRes.json();
    const userId = user?.id;

    if (!userId) return redirectToLogin(req, pathname);

    // Obtener el rol del usuario desde public.users
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=role&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: supabaseKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const profiles = profileRes.ok ? await profileRes.json() : [];
    const userRole: string = profiles?.[0]?.role ?? 'client';

    if (!matchedRoute.roles.includes(userRole)) {
      const fallback = req.nextUrl.clone();
      fallback.pathname = userRole === 'org_admin' ? '/org-dashboard' : '/dashboard';
      return NextResponse.redirect(fallback);
    }

    return res;
  } catch {
    // En caso de error de red, dejar pasar (no bloquear por fallo de infra)
    return res;
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
