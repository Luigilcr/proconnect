/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { FullCard, CardLink, CatalogMultimedia } from '@/lib/types';
import { getStoredCards, saveCard, renewCardSubscription, persistCards } from '@/lib/data/card-store';
import { saveDashboardDraft, loadDashboardDraft, clearDashboardDraft } from '@/lib/draft-store';
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

  useEffect(() => {
    const loadData = async () => {
      let local = getStoredCards();

      // Verificar si hay borradores temporales no guardados de sesiones previas
      let hasAnyDraft = false;
      local = local.map((c) => {
        const draft = loadDashboardDraft(c.id);
        if (draft && draft.card) {
          hasAnyDraft = true;
          return { ...c, ...draft.card };
        }
        return c;
      });
      if (hasAnyDraft) {
        setDraftRestored(true);
      }
      setCards(local);

      // Priorizar la tarjeta de Luigi o la primera disponible
      const luigiCard = local.find((c) => c.slug === 'luigi-colonico');
      if (luigiCard) {
        setActiveCardId(luigiCard.id);
      } else if (local.length > 0) {
        setActiveCardId(local[0].id);
      }

      // Sincronizar con el servidor en la nube sin pisar cambios locales más recientes
      try {
        const res = await fetch('/api/cards');
        const data = await res.json();
        if (data.success && Array.isArray(data.cards)) {
          const map = new Map<string, FullCard>();
          // Base del servidor
          data.cards.forEach((c: FullCard) => {
            if (c && c.slug) map.set(c.slug.toLowerCase().trim(), c);
          });
          // Proteger borradores locales y ediciones recientes
          local.forEach((c) => {
            const key = c.slug.toLowerCase().trim();
            const serverVersion = map.get(key);
            const hasLocalDraft = !!loadDashboardDraft(c.id);
            if (hasLocalDraft || !serverVersion) {
              map.set(key, c);
            } else {
              const localTime = c.updated_at ? new Date(c.updated_at).getTime() : 0;
              const serverTime = serverVersion.updated_at ? new Date(serverVersion.updated_at).getTime() : 0;
              if (localTime >= serverTime) {
                map.set(key, c);
              }
            }
          });
          const merged = Array.from(map.values());
          setCards(merged);
          persistCards(merged);

          const luigiOnline = merged.find((c) => c.slug === 'luigi-colonico');
          if (luigiOnline) {
            setActiveCardId(luigiOnline.id);
          }
        }
      } catch (e) {
        console.warn('Error sincronizando tarjetas en dashboard:', e);
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

  const handleManualSave = async () => {
    if (!currentCard) return;
    setIsSavingServer(true);
    saveCard(currentCard);
    clearDashboardDraft(currentCard.id);
    setDraftRestored(false);

    try {
      await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card: currentCard }),
      });
    } catch (e) {
      console.warn('Error al guardar en el servidor:', e);
    } finally {
      setIsSavingServer(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-500">Cargando panel de control...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Cabecera del Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Editor de Tarjeta Digital
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-300 dark:border-emerald-800">
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
                onChange={(e) => setActiveCardId(e.target.value)}
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

            {/* Ver en smartphone en móviles */}
            <button
              type="button"
              onClick={() => setShowMobilePreview(!showMobilePreview)}
              className="lg:hidden px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5 text-sky-500" />
              <span>{showMobilePreview ? 'Ocultar' : 'Ver Móvil'}</span>
            </button>

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

            {/* Botón Renovar (+30d) */}
            <button
              type="button"
              onClick={() => handleRenewCurrentCard(30)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                renewSuccess
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border-amber-200 dark:border-amber-800/60'
              }`}
              title="Extender suscripción por 30 días adicionales"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>{renewSuccess ? '¡Renovada +30d!' : 'Renovar +30d'}</span>
            </button>

            {/* Botón Guardar Cambios */}
            <button
              type="button"
              onClick={handleManualSave}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              {isSaved ? (
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
          </div>
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
                <button
                  type="button"
                  onClick={() => handleRenewCurrentCard(30)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors shrink-0"
                >
                  Renovar Ahora (+30 días)
                </button>
              </div>
            );
          }
          return null;
        })()}

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          {/* Columna Izquierda: Pestañas y Formularios de Edición (Col 7/12) */}
          <div className={`lg:col-span-7 ${showMobilePreview ? 'hidden lg:block' : 'block'}`}>
            {/* Navegación por Pestañas */}
            <div className="flex overflow-x-auto gap-2 pb-3 mb-6 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
              <button
                onClick={() => setActiveTab('identity')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === 'identity'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>1. Identidad</span>
              </button>

              <button
                onClick={() => setActiveTab('design')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === 'design'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>2. Motor Visual</span>
              </button>

              <button
                onClick={() => setActiveTab('links')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === 'links'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>3. Enlaces & Redes</span>
              </button>

              <button
                onClick={() => setActiveTab('multimedia')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === 'multimedia'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>4. Multimedia</span>
              </button>

              <button
                onClick={() => setActiveTab('vcard')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === 'vcard'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Contact2 className="w-3.5 h-3.5" />
                <span>5. vCard (.vcf)</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>6. Métricas & Leads</span>
              </button>
            </div>

            {/* Contenedor del Formulario Activo */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
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

          {/* Columna Derecha: Simulador de Smartphone en Vivo (Col 5/12) */}
          <div
            className={`lg:col-span-5 flex justify-center ${
              showMobilePreview ? 'block' : 'hidden lg:flex'
            }`}
          >
            <LivePreviewPhone card={currentCard} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
