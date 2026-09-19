/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { FullCard, CardLink, CatalogMultimedia } from '@/lib/types';
import { getStoredCards, saveCard, renewCardSubscription, persistCards } from '@/lib/data/card-store';
import { saveDashboardDraft, loadDashboardDraft, clearDashboardDraft } from '@/lib/draft-store';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { normalizeCardForDatabase, isSuperAdminEmail, getSupabaseCardPayload, generateUuid, isValidUuid } from '@/lib/db-normalize';
import { IdentityEditor } from '@/components/dashboard/IdentityEditor';
import { DesignCustomizer } from '@/components/dashboard/DesignCustomizer';
import { LinksEditor } from '@/components/dashboard/LinksEditor';
import { MultimediaManager } from '@/components/dashboard/MultimediaManager';
import { VCardEditor } from '@/components/dashboard/VCardEditor';
import { AnalyticsAndLeads } from '@/components/dashboard/AnalyticsAndLeads';
import { LivePreviewPhone } from '@/components/dashboard/LivePreviewPhone';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  User,
  Palette,
  Link2,
  FolderPlus,
  Contact2,
  Save,
  Check,
  ExternalLink,
  Smartphone,
  TrendingUp,
  Building2,
  Calendar,
  CalendarPlus,
  Clock,
  AlertTriangle,
  LogOut,
  Plus,
  Sparkles,
  Copy,
  Wifi,
  Users,
  BarChart3,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { getCardExpirationInfo } from '@/lib/card-lifecycle';

export default function DashboardPage() {
  const [cards, setCards] = useState<FullCard[]>([]);
  const [activeCardId, setActiveCardId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'identity' | 'design' | 'links' | 'multimedia' | 'vcard' | 'analytics'
  >('identity');
  const [isSaved, setIsSaved] = useState(false);
  const [renewSuccess, setRenewSuccess] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);
  const [isSavingServer, setIsSavingServer] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedNfcUrl, setCopiedNfcUrl] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      let loggedUser: any = null;
      let isSuperAdmin = false;

      // 1. Obtener usuario autenticado en Supabase
      if (isSupabaseEnabled && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            loggedUser = session.user;
            setAuthUser(session.user);
            isSuperAdmin = isSuperAdminEmail(session.user.email);
            setIsSuperAdmin(isSuperAdmin);
          } else {
            // Si Supabase está activo y no hay sesión, enviar al login
            window.location.href = '/login';
            return;
          }
        } catch (err) {
          console.warn('Error verificando sesión de usuario:', err);
        }
      }

      // 2. Cargar tarjetas remotas desde Supabase si está disponible
      let sbCards: FullCard[] = [];
      if (isSupabaseEnabled && supabase && loggedUser) {
        try {
          let query = supabase.from('cards').select('*');
          if (!isSuperAdmin) {
            query = query.eq('user_id', loggedUser.id);
          }
          const { data: fetched, error } = await query;
          if (!error && fetched && fetched.length > 0) {
            const cardIds = fetched.map((c: any) => c.id);
            let linksMap: Record<string, CardLink[]> = {};
            if (cardIds.length > 0) {
              const { data: linksData } = await supabase
                .from('card_links')
                .select('*')
                .in('card_id', cardIds)
                .order('position_order', { ascending: true });
              if (linksData) {
                linksData.forEach((l: any) => {
                  if (!linksMap[l.card_id]) linksMap[l.card_id] = [];
                  linksMap[l.card_id].push(l);
                });
              }
            }
            sbCards = fetched.map((c: any) => ({
              ...c,
              links: linksMap[c.id] || [],
            }));
          }
        } catch (e) {
          console.warn('Error obteniendo tarjetas de Supabase:', e);
        }
      }

      // 3. Cargar tarjetas locales y filtrar por usuario
      let local = getStoredCards();
      const userLocal = isSuperAdmin
        ? local
        : loggedUser
        ? local.filter((c) => c.user_id === loggedUser.id)
        : local;

      // 4. Integrar borradores locales pendientes
      let hasAnyDraft = false;
      const localWithDrafts = userLocal.map((c) => {
        const draft = loadDashboardDraft(c.id);
        if (draft && draft.card) {
          hasAnyDraft = true;
          return { ...c, ...draft.card };
        }
        return c;
      });
      if (hasAnyDraft) setDraftRestored(true);

      // 5. Unificar tarjetas de Supabase y locales
      const map = new Map<string, FullCard>();
      sbCards.forEach((c) => {
        if (c?.id) map.set(c.id, c);
      });
      localWithDrafts.forEach((c) => {
        if (c?.id) {
          const existing = map.get(c.id);
          if (existing) {
            const localTime = c.updated_at ? new Date(c.updated_at).getTime() : 0;
            const serverTime = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
            if (localTime >= serverTime) {
              map.set(c.id, c);
            }
          } else {
            map.set(c.id, c);
          }
        }
      });

      const finalCards = Array.from(map.values());
      setCards(finalCards);
      setIsLoading(false);

      // 6. Asignar tarjeta activa
      const savedActiveId = typeof window !== 'undefined' ? localStorage.getItem('proconnect_active_card_id') : null;
      if (savedActiveId && finalCards.some((c) => c.id === savedActiveId)) {
        setActiveCardId(savedActiveId);
      } else if (isSuperAdmin) {
        const luigiCard = finalCards.find((c) => c.slug === 'luigi-colonico');
        if (luigiCard) {
          setActiveCardId(luigiCard.id);
        } else if (finalCards.length > 0) {
          setActiveCardId(finalCards[0].id);
        }
      } else if (finalCards.length > 0) {
        setActiveCardId(finalCards[0].id);
      }
    };

    loadData();
  }, []);

  const currentCard = cards.find((c) => c.id === activeCardId) || cards[0];

  const handleRenewCurrentCard = (days: number = 30) => {
    if (!currentCard) return;
    const renewed = renewCardSubscription(currentCard.id, days);
    if (renewed) {
      setCards((prev) => prev.map((c) => (c.id === currentCard.id ? renewed : c)));
      setRenewSuccess(true);
      setTimeout(() => setRenewSuccess(false), 3000);
    }
  };

  const handleCardUpdate = (fields: Partial<FullCard>) => {
    if (!currentCard) return;
    const updated = { ...currentCard, ...fields, updated_at: new Date().toISOString() };
    const newCards = cards.map((c) => (c.id === currentCard.id ? updated : c));
    setCards(newCards);
    saveCard(updated);
    saveDashboardDraft(currentCard.id, updated);
    setLastAutoSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const handleLinksUpdate = (newLinks: CardLink[]) => {
    if (!currentCard) return;
    const updated = { ...currentCard, links: newLinks, updated_at: new Date().toISOString() };
    const newCards = cards.map((c) => (c.id === currentCard.id ? updated : c));
    setCards(newCards);
    saveCard(updated);
    saveDashboardDraft(currentCard.id, updated);
    setLastAutoSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const handleMultimediaUpdate = (newItems: CatalogMultimedia[]) => {
    if (!currentCard) return;
    const updated = { ...currentCard, multimedia: newItems, updated_at: new Date().toISOString() };
    const newCards = cards.map((c) => (c.id === currentCard.id ? updated : c));
    setCards(newCards);
    saveCard(updated);
    saveDashboardDraft(currentCard.id, updated);
    setLastAutoSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const handleLogout = async () => {
    if (isSupabaseEnabled && supabase) {
      await supabase.auth.signOut();
    }
    window.location.href = '/login';
  };

  const handleManualSave = async () => {
    if (!currentCard) return;
    setIsSavingServer(true);

    // 0. Deduplicación estricta de enlaces antes de persistir
    const seenLinks = new Set<string>();
    const cleanedLinks = (currentCard.links || []).filter((l) => {
      const key = `${l.type}:${(l.url || '').trim().toLowerCase()}`;
      if (seenLinks.has(key)) return false;
      seenLinks.add(key);
      return true;
    });

    const cleanedCard: FullCard = {
      ...currentCard,
      links: cleanedLinks,
      updated_at: new Date().toISOString(),
    };

    setCards((prev) => prev.map((c) => (c.id === cleanedCard.id ? cleanedCard : c)));
    saveCard(cleanedCard);
    clearDashboardDraft(cleanedCard.id);
    setDraftRestored(false);

    try {
      // 1. Sincronizar en Supabase si está activo
      if (isSupabaseEnabled && supabase) {
        try {
          let activeUser = authUser;
          if (!activeUser) {
            const { data: { session } } = await supabase.auth.getSession();
            activeUser = session?.user || null;
            if (activeUser) setAuthUser(activeUser);
          }

          let userEmail = activeUser?.email || (cleanedCard as any).user_email || (cleanedCard as any).email || '';
          let targetUserId = activeUser?.id;

          // Si tenemos email pero no targetUserId o para evitar conflicto de email con otro UUID en public.users
          if (userEmail) {
            const { data: existingUser } = await supabase
              .from('users')
              .select('id')
              .ilike('email', userEmail.trim())
              .maybeSingle();
            if (existingUser?.id) {
              targetUserId = existingUser.id;
            }
          }

          if (!targetUserId) {
            targetUserId = isValidUuid(cleanedCard.user_id) ? cleanedCard.user_id : generateUuid();
          }

          const isSuper = isSuperAdminEmail(userEmail);

          // Asegurar que el usuario existe en public.users
          await supabase.from('users').upsert({
            id: targetUserId,
            email: userEmail || `${cleanedCard.slug}@proconnect.app`,
            full_name: cleanedCard.full_name || 'Usuario ProConnect',
            role: isSuper ? 'superadmin' : 'client',
          }, { onConflict: 'id' });

          // Normalizar tarjeta con el user_id correcto
          const dbCard = normalizeCardForDatabase({ ...cleanedCard, user_id: targetUserId }, targetUserId, userEmail);

          // Si ya existe una tarjeta con el mismo slug, reutilizar su id para evitar error de slug duplicado
          const { data: existingCard } = await supabase
            .from('cards')
            .select('id')
            .ilike('slug', dbCard.slug)
            .maybeSingle();
          if (existingCard?.id) {
            dbCard.id = existingCard.id;
          }

          const cardPayload = getSupabaseCardPayload(dbCard);
          let { error: cardUpsertErr } = await supabase.from('cards').upsert(cardPayload);

          if (cardUpsertErr) {
            console.warn('Upsert directo de cards tuvo advertencia, invocando RPC save_public_card:', cardUpsertErr.message);
            await supabase.rpc('save_public_card', { p_card: dbCard });
          }

          // Sincronizar card_links: borrar anteriores y reinsertar los vigentes limpios
          await supabase.from('card_links').delete().eq('card_id', dbCard.id);
          if (Array.isArray(dbCard.links) && dbCard.links.length > 0) {
            const sanitizedLinks = dbCard.links.map((l) => ({ ...l, card_id: dbCard.id }));
            await supabase.from('card_links').insert(sanitizedLinks);
          }
        } catch (sbErr) {
          console.warn('Error guardando en Supabase:', sbErr);
        }
      }

      // 2. Sincronizar con API local/servidor
      await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card: cleanedCard }),
      });
    } catch (e) {
      console.warn('Error al guardar en el servidor:', e);
    } finally {
      setIsSavingServer(false);
      setIsSaved(true);
      setToastMessage('✅ Cambios y enlaces guardados exitosamente en la nube');
      setTimeout(() => setIsSaved(false), 2500);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleDiscardDashboardDraft = async () => {
    if (!currentCard) return;
    clearDashboardDraft(currentCard.id);
    setDraftRestored(false);
    try {
      const res = await fetch('/api/cards');
      const data = await res.json();
      if (data.success && Array.isArray(data.cards)) {
        const found = data.cards.find((c: FullCard) => c.id === currentCard.id || c.slug === currentCard.slug);
        if (found) {
          setCards((prev) => prev.map((c) => (c.id === currentCard.id ? found : c)));
          saveCard(found);
          return;
        }
      }
    } catch {}
    window.location.reload();
  };

  if (!currentCard) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-500">Cargando panel de control...</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm max-w-md w-full flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                ¡Aún no tienes tarjetas!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Crea tu primera tarjeta de presentación digital con NFC y código QR para comenzar a compartir tus datos.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <Link
                  href="/crear"
                  className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Mi Tarjeta</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-8">
        {/* Cabecera del Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Editor de Tarjeta Digital
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sincronización en Vivo
              </span>
              {currentCard.slug === 'luigi-colonico' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 font-bold border border-sky-500/20">
                  Tu Tarjeta Principal
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Personaliza el chip NFC y código QR de:{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {currentCard.full_name}
              </span>{' '}
              ({currentCard.company_name || 'Sin empresa'})
            </p>

            {/* Ficha de Ciclo de Vida y Vigencia */}
            {(() => {
              const exp = getCardExpirationInfo(currentCard);
              return (
                <div className="flex items-center gap-2 flex-wrap text-xs mt-2.5">
                  <span className="text-slate-500">Registrada el: <strong className="text-slate-700 dark:text-slate-300">{exp.formattedCreated}</strong></span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500">Vencimiento: <strong className="text-slate-700 dark:text-slate-300">{exp.formattedExpires}</strong></span>
                  
                  {exp.status === 'expired' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                      <Clock className="w-3 h-3" />
                      {exp.badgeLabel}
                    </span>
                  )}
                  {exp.status === 'expiring_soon' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      {exp.badgeLabel}
                    </span>
                  )}
                  {exp.status === 'active' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Plan 30 Días: {exp.badgeLabel}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Acceso a panel de empresa B2B */}
            <Link
              href="/org-dashboard"
              className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Panel B2B</span>
            </Link>

            {/* Selector de Tarjeta Demo */}
            {cards.length > 1 && (
              <select
                value={activeCardId}
                onChange={(e) => {
                  setActiveCardId(e.target.value);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('proconnect_active_card_id', e.target.value);
                  }
                }}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.slug === 'luigi-colonico' ? '⭐ (Tú) ' : ''}
                    {c.full_name} ({c.layout_type || 'modern'})
                  </option>
                ))}
              </select>
            )}

            {/* Enlace al perfil público */}
            <a
              href={`/c/${currentCard.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Perfil</span>
            </a>

            {/* Botón Renovar (+30d) - Exclusivo para Superadmin */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => handleRenewCurrentCard(30)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                  renewSuccess
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border-amber-200 dark:border-amber-800/60'
                }`}
                title="Extender suscripción por 30 días adicionales (Superadmin)"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>{renewSuccess ? '¡Renovada +30d!' : 'Renovar +30d (Admin)'}</span>
              </button>
            )}

            {/* Botón Guardar Cambios (Desktop) */}
            <button
              type="button"
              onClick={handleManualSave}
              disabled={isSavingServer}
              className="hidden sm:flex px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-75"
            >
              {isSavingServer ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Guardando...</span>
                </>
              ) : isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-white" />
                  <span>Guardar</span>
                </>
              )}
            </button>

            {/* Botón Cerrar Sesión */}
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Cerrar sesión de usuario"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Selector de Modo Móvil (Segmented Bar) - Solo en Celulares y Tablets */}
        <div className="lg:hidden mt-4 grid grid-cols-2 p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-300/80 dark:border-slate-700/80 shadow-sm">
          <button
            type="button"
            onClick={() => setShowMobilePreview(false)}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              !showMobilePreview
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-md ring-1 ring-black/5 dark:ring-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>✏️ Editar Datos</span>
          </button>
          <button
            type="button"
            onClick={() => setShowMobilePreview(true)}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              showMobilePreview
                ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 Ver Teléfono</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>

        {/* Banner de Advertencia si está por vencer o vencida */}
        {(() => {
          const exp = getCardExpirationInfo(currentCard);
          if (exp.isExpiringSoon || exp.isExpired) {
            return (
              <div className={`mt-4 p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                exp.isExpired
                  ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
              }`}>
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>{exp.isExpired ? '¡Tarjeta Expirada!' : '¡Alerta de Vencimiento Próximo!'}</strong>{' '}
                    {exp.alertMessage}
                  </span>
                </div>
                {isSuperAdmin ? (
                  <Link
                    href="/admin"
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    <span>Gestionar Licencia (Admin)</span>
                  </Link>
                ) : (
                  <a
                    href={`https://wa.me/584141234567?text=${encodeURIComponent(
                      `Hola ProConnect, mi tarjeta digital (${currentCard.full_name}) requiere renovación o extensión de días de servicio. Me gustaría coordinar el plan.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Contactar Administrador para Renovar</span>
                  </a>
                )}
              </div>
            );
          }
          return null;
        })()}

        {/* Banner Enlace NFC Directo y Prominente */}
        <div className="mt-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-sky-200 dark:border-sky-900/50 backdrop-blur-sm shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
                <Wifi className="w-5 h-5 rotate-90" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    Enlace Directo para Grabar Tarjeta NFC
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    En Vivo
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Copia esta URL exacta y grábala en tu tarjeta física con la app <strong>NFC Tools</strong> (Tipo: URL / Enlace web).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const url = `https://proconnect-pearl.vercel.app/c/${currentCard.slug}`;
                  navigator.clipboard.writeText(url);
                  setCopiedNfcUrl(true);
                  setTimeout(() => setCopiedNfcUrl(false), 2500);
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
                  copiedNfcUrl
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20 hover:scale-105 active:scale-95'
                }`}
              >
                {copiedNfcUrl ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Copiado al Portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Enlace NFC</span>
                  </>
                )}
              </button>

              <a
                href={`/c/${currentCard.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Perfil</span>
              </a>

              <Link
                href="/nfc"
                className="px-3.5 py-2.5 rounded-xl border border-sky-300 dark:border-sky-800/60 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>NFC Studio 300 DPI</span>
              </Link>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-sky-100 dark:border-sky-900/30 flex items-center justify-between gap-3 text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-950/40 px-3 py-2 rounded-xl">
            <span className="truncate select-all">https://proconnect-pearl.vercel.app/c/{currentCard.slug}</span>
            <span className="shrink-0 text-slate-400 font-sans text-[10px]">Carga instantánea (0ms caché)</span>
          </div>
        </div>

        {/* Barra de Estado: Autoguardado & Borrador */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 mt-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Autoguardado en tiempo real activo
            </span>
            {lastAutoSaved && (
              <span className="text-slate-400 font-mono text-[11px]">
                (Último cambio: {lastAutoSaved})
              </span>
            )}
          </div>

          {draftRestored && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                Borrador temporal pendiente
              </span>
              <button
                type="button"
                onClick={handleDiscardDashboardDraft}
                className="text-rose-600 dark:text-rose-400 hover:underline font-bold text-[11px]"
              >
                Descartar cambios no guardados
              </button>
            </div>
          )}
        </div>

        {/* Layout en Pantalla Dividida (Split Screen en Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6 items-start">
          {/* Columna Izquierda: Pestañas y Formularios de Edición (Col 7/12) */}
          <div className={`lg:col-span-7 ${showMobilePreview ? 'hidden lg:block' : 'block'}`}>
            {/* Navegación por Pestañas (Scroll horizontal fluido en móviles, sin partirse en 3 líneas) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6 border-b border-slate-200 dark:border-slate-800 -mx-1 px-1">
              <button
                onClick={() => setActiveTab('identity')}
                className={`shrink-0 min-h-[40px] px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === 'identity'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 ring-2 ring-sky-400/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>1. Identidad</span>
              </button>

              <button
                onClick={() => setActiveTab('design')}
                className={`shrink-0 min-h-[40px] px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === 'design'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 ring-2 ring-sky-400/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>2. Motor Visual</span>
              </button>

              <button
                onClick={() => setActiveTab('links')}
                className={`shrink-0 min-h-[40px] px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === 'links'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 ring-2 ring-sky-400/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>3. Enlaces & Redes</span>
              </button>

              <button
                onClick={() => setActiveTab('multimedia')}
                className={`shrink-0 min-h-[40px] px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === 'multimedia'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 ring-2 ring-sky-400/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>4. Multimedia</span>
              </button>

              <button
                onClick={() => setActiveTab('vcard')}
                className={`shrink-0 min-h-[40px] px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === 'vcard'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 ring-2 ring-sky-400/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Contact2 className="w-3.5 h-3.5" />
                <span>5. vCard (.vcf)</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`shrink-0 min-h-[40px] px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 ring-2 ring-sky-400/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>6. Métricas & Leads</span>
              </button>
            </div>

            {/* Contenido Dinámico de la Pestaña Activa */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              {activeTab === 'identity' && (
                <IdentityEditor card={currentCard} onChange={handleCardUpdate} />
              )}
              {activeTab === 'design' && (
                <DesignCustomizer card={currentCard} onChange={handleCardUpdate} />
              )}
              {activeTab === 'links' && (
                <LinksEditor
                  links={currentCard.links || []}
                  cardId={currentCard.id}
                  onChange={handleLinksUpdate}
                />
              )}
              {activeTab === 'multimedia' && (
                <MultimediaManager
                  items={currentCard.multimedia || []}
                  cardId={currentCard.id}
                  onChange={handleMultimediaUpdate}
                />
              )}
              {activeTab === 'vcard' && (
                <VCardEditor card={currentCard} onChange={handleCardUpdate} />
              )}
              {activeTab === 'analytics' && (
                <AnalyticsAndLeads card={currentCard} />
              )}
            </div>
          </div>

          {/* Columna Derecha: Simulador de Smartphone en Vivo */}
          <div
            className={`lg:col-span-5 sticky top-24 self-start flex flex-col items-center ${
              showMobilePreview ? 'flex w-full' : 'hidden lg:flex'
            }`}
          >
            <LivePreviewPhone card={currentCard} />

            {/* En móvil: botón prominente para volver al editor de datos */}
            <div className="lg:hidden mt-4 w-full max-w-[340px] px-2">
              <button
                type="button"
                onClick={() => setShowMobilePreview(false)}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
              >
                <User className="w-4 h-4 text-sky-400 dark:text-sky-600" />
                <span>← Volver al Editor de Datos</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Barra Flotante Inferior Móvil Fija (Garantiza que NUNCA se pierda el botón de guardar ni el simulador) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl safe-bottom">
        <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="flex-1 py-3 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            {showMobilePreview ? (
              <>
                <User className="w-4 h-4 text-sky-500" />
                <span>✏️ Editor</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 text-sky-500" />
                <span>📱 Ver Tarjeta</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleManualSave}
            disabled={isSavingServer}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-black shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-75"
          >
            {isSavingServer ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Guardando...</span>
              </>
            ) : isSaved ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>¡Guardado!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerta flotante Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-2xl border border-slate-800 dark:border-slate-200 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Footer />
    </div>
  );
}
