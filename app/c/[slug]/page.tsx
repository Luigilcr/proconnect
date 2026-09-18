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
import { AlertCircle, ArrowLeft, Radio, ShieldAlert, UserCheck } from 'lucide-react';
import Link from 'next/link';

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

  const initialSlug = resolveSlug();
  const initialFound = initialSlug ? getCardBySlug(decodeURIComponent(initialSlug).toLowerCase().trim()) : null;

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
      // 1. Intentar consultar Supabase en tiempo real (Nube)
      if (isSupabaseEnabled && supabase) {
        try {
          // Intentar primero con la RPC segura
          const { data: rpcCard, error: rpcErr } = await supabase.rpc('get_public_card', {
            p_slug: decoded,
          });

          if (!rpcErr && rpcCard) {
            setCard(rpcCard);
            setLoading(false);
            return;
          }

          // Consulta directa fallback a Supabase
          const { data: directCard, error: directErr } = await supabase
            .from('cards')
            .select('*, links:card_links(*)')
            .ilike('slug', decoded)
            .maybeSingle();

          if (!directErr && directCard) {
            setCard(directCard);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Error consultando Supabase en /c/[slug]:', err);
        }
      }

      // 2. Intentar buscar en almacenamiento local (para preview o creador)
      const localCard = getCardBySlug(decoded);
      if (localCard) {
        setCard(localCard);
        setLoading(false);
        return;
      }

      // 3. Fallback: Consultar API del servidor
      try {
        const res = await fetch(`/api/cards?slug=${encodeURIComponent(decoded)}`);
        const data = await res.json();
        if (data.success && data.card) {
          setCard(data.card);
        }
      } catch (err) {
        console.error('Error al consultar tarjeta en servidor:', err);
      } finally {
        setLoading(false);
      }
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

  return (
    <main className="min-h-screen relative pb-20">
      <DigitalCard card={card} />

      {/* Botón flotante para Intercambio de Contacto (Lead Capture / CRM Opcional) */}
      {card.enable_crm_capture !== false && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-xs px-4">
          <button
            type="button"
            onClick={() => setShowExchangeModal(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-brand-blue hover:bg-brand-mid text-white font-black text-xs shadow-2xl shadow-brand-blue/50 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 border border-white/20"
          >
            <UserCheck className="w-4 h-4 text-brand-cyan animate-pulse" />
            <span>🤝 Conectar / Dejar Mis Datos</span>
          </button>
        </div>
      )}

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
