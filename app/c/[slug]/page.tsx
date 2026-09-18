/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FullCard } from '@/lib/types';
import { getCardBySlug, getStoredOrganizations } from '@/lib/data/card-store';
import { DigitalCard } from '@/components/card/DigitalCard';
import { ContactExchangeModal } from '@/components/card/ContactExchangeModal';
import { AlertCircle, ArrowLeft, Radio, ShieldAlert, UserCheck, Download, Clock } from 'lucide-react';
import Link from 'next/link';
import { downloadVCard } from '@/lib/vcard-generator';

import { supabase, isSupabaseEnabled } from '@/lib/supabase';

export default function PublicCardProfilePage() {
  const params = useParams();
  const rawSlug = params?.slug;

  // Resolver el slug inmediatamente sin esperar al render
  const resolveSlug = () => {
    if (typeof rawSlug === 'string') return rawSlug;
    if (Array.isArray(rawSlug) && rawSlug.length > 0) return rawSlug[0];
    if (typeof window !== 'undefined') {
      const segments = window.location.pathname.split('/').filter(Boolean);
      const cIdx = segments.indexOf('c');
      if (cIdx !== -1 && segments[cIdx + 1]) return segments[cIdx + 1];
    }
    return '';
  };

  const getCachedCard = (slugStr: string): FullCard | null => {
    if (!slugStr || typeof window === 'undefined') return null;
    try {
      const cached = sessionStorage.getItem(`proconnect_card_${slugStr}`) || localStorage.getItem(`proconnect_card_${slugStr}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return getCardBySlug(slugStr);
  };

  const initialSlug = resolveSlug();
  const decodedInitial = initialSlug ? decodeURIComponent(initialSlug).toLowerCase().trim() : '';
  const initialFound = decodedInitial ? getCachedCard(decodedInitial) : null;

  const [card, setCard] = useState<FullCard | null>(initialFound);
  const [loading, setLoading] = useState<boolean>(!initialFound);
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  useEffect(() => {
    const activeSlug = resolveSlug();
    if (!activeSlug) {
      setLoading(false);
      return;
    }

    const decoded = decodeURIComponent(activeSlug).toLowerCase().trim();

    const fetchCard = async () => {
      let foundCard: FullCard | null = null;

      // 1. Consulta directa y rápida a Supabase en paralelo
      if (isSupabaseEnabled && supabase) {
        try {
          const { data: directCard, error: directErr } = await supabase
            .from('cards')
            .select('*, links:card_links(*)')
            .ilike('slug', decoded)
            .maybeSingle();

          if (!directErr && directCard) {
            foundCard = directCard;
          } else {
            // Fallback a RPC segura si directCard es bloqueado por RLS anónimo
            const { data: rpcCard } = await supabase.rpc('get_public_card', {
              p_slug: decoded,
            });
            if (rpcCard) foundCard = rpcCard;
          }
        } catch (err) {
          console.warn('Error consultando Supabase en /c/[slug]:', err);
        }
      }

      // 2. Si no respondió la nube, buscar en almacén local
      if (!foundCard) {
        foundCard = getCardBySlug(decoded);
      }

      // 3. Fallback a API del servidor
      if (!foundCard) {
        try {
          const res = await fetch(`/api/cards?slug=${encodeURIComponent(decoded)}`);
          const data = await res.json();
          if (data.success && data.card) {
            foundCard = data.card;
          }
        } catch (err) {
          console.error('Error al consultar tarjeta en servidor:', err);
        }
      }

      // 4. Procesar y guardar en caché instantáneo si se encontró
      if (foundCard) {
        // Deduplicación de seguridad
        if (Array.isArray(foundCard.links)) {
          const seen = new Set<string>();
          foundCard.links = foundCard.links.filter((l: any) => {
            const key = `${l.type}:${(l.url || '').trim().toLowerCase().replace(/\/$/, '')}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }

        setCard(foundCard);
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`proconnect_card_${decoded}`, JSON.stringify(foundCard));
            localStorage.setItem(`proconnect_card_${decoded}`, JSON.stringify(foundCard));
          }
        } catch {}
      }

      setLoading(false);
    };

    fetchCard();
  }, [rawSlug]);

  // Verificar si la empresa matriz está suspendida por falta de pago (Kill Switch)
  const isCompanySuspended = React.useMemo(() => {
    if (!card?.organization_id) return false;
    const orgs = getStoredOrganizations();
    const org = orgs.find((o) => o.id === card.organization_id);
    return org?.subscription_status === 'suspended';
  }, [card]);

  // Verificar si la tarjeta ha expirado por fecha de corte de suscripción (30 días de prueba o fecha programada)
  const isCardExpired = React.useMemo(() => {
    if (!card) return false;
    if (card.expires_at) {
      return new Date(card.expires_at).getTime() < Date.now();
    }
    if (card.created_at) {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      return new Date(card.created_at).getTime() + thirtyDaysMs < Date.now();
    }
    return false;
  }, [card]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4 animate-bounce">
          <Radio className="w-6 h-6 animate-pulse" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Cargando perfil digital NFC...</p>
      </div>
    );
  }

  // Si no se encuentra la tarjeta
  if (!card) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4 border border-red-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold mb-2">Tarjeta no encontrada</h1>
        <p className="text-xs text-slate-400 max-w-sm mb-6">
          No existe una tarjeta digital activa con el identificador &quot;{initialSlug || 'desconocido'}&quot;. Verifica el enlace NFC o el código QR escaneado.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a ProConnect
        </Link>
      </div>
    );
  }

  // Si la empresa matriz está suspendida (Kill Switch Superadmin)
  if (isCompanySuspended) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4 border border-red-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold mb-2">Servicio Temporalmente Suspendido</h1>
        <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
          Esta tarjeta corporativa se encuentra inactiva por motivos administrativos o de suscripción empresarial. Si eres el titular, contacta a la administración de tu empresa o a ProConnect.
        </p>
        <div className="flex gap-2">
          <a
            href="mailto:soporte@proconnect.app?subject=Consulta%20Suscripción%20ProConnect"
            className="px-4 py-2.5 rounded-xl bg-brand-blue text-xs font-semibold text-white hover:bg-brand-mid transition-colors shadow-md shadow-brand-blue/20"
          >
            Contactar a Soporte
          </a>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-white border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            Ir a Inicio
          </Link>
        </div>
      </div>
    );
  }

  // Si la tarjeta está desactivada por el usuario
  if (!card.is_active) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
          <Radio className="w-8 h-8 opacity-60" />
        </div>
        <h1 className="text-xl font-bold mb-2">Tarjeta Temporalmente Inactiva</h1>
        <p className="text-xs text-slate-400 max-w-sm mb-6">
          Este perfil digital ha sido pausado por su titular o por el equipo de administración.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Ir a Inicio
        </Link>
      </div>
    );
  }

  // Si la tarjeta ha expirado por tiempo de suscripción
  if (isCardExpired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20 shadow-lg shadow-amber-500/10">
          <Clock className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-xl font-bold mb-2">Tarjeta Fuera de Línea / Suscripción Expirada</h1>
        <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
          El periodo de suscripción activa para la tarjeta digital de <strong>{card.full_name}</strong> ha culminado. Si eres el titular de este perfil o chip NFC, contacta a la administración de ProConnect para renovar tu licencia de servicio.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <a
            href={`https://wa.me/584141234567?text=${encodeURIComponent(
              `Hola ProConnect, mi tarjeta digital (${card.full_name} - /c/${card.slug}) ha expirado y deseo renovar mi suscripción para reactivarla.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            Renovar por WhatsApp
          </a>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-white border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            Ir a ProConnect
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative pb-28">
      <DigitalCard card={card} />

      {/* Barra Inferior Fija Ergonómica (Dual Sticky Bottom Dock) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4 pointer-events-none">
        <div className="p-2 rounded-2xl bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/70 flex items-center gap-2 pointer-events-auto">
          {/* Botón 1: Guardar en Contactos (.vcf) */}
          <button
            type="button"
            onClick={() => downloadVCard(card)}
            className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-95"
            title="Descargar contacto a la agenda de tu teléfono"
          >
            <Download className="w-4 h-4 shrink-0 text-white" />
            <span className="truncate">Guardar Contacto</span>
          </button>

          {/* Botón 2: Intercambiar Contacto / Dejar Datos */}
          {card.enable_crm_capture !== false && (
            <button
              type="button"
              onClick={() => setShowExchangeModal(true)}
              className="flex-1 py-3 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all hover:scale-[1.02] active:scale-95"
              title="Dejar tus datos para que el asesor te contacte"
            >
              <UserCheck className="w-4 h-4 shrink-0 text-sky-400 animate-pulse" />
              <span className="truncate">Dejar mis datos</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal de Intercambio de Contacto */}
      {showExchangeModal && (
        <ContactExchangeModal
          isOpen={showExchangeModal}
          onClose={() => setShowExchangeModal(false)}
          card={card}
        />
      )}

      {/* Enlaces Legales en Perfil Público */}
      <footer className="w-full py-4 bg-black/40 text-center text-[11px] text-slate-400 space-x-3 border-t border-white/5 mt-8">
        <Link href="/terminos" className="hover:underline">
          Términos de Servicio
        </Link>
        <span>•</span>
        <Link href="/privacidad" className="hover:underline">
          Privacidad
        </Link>
        <span>•</span>
        <span>© ProConnect</span>
      </footer>
    </main>
  );
}
