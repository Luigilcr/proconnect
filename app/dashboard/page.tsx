/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { FullCard, CardLink, CatalogMultimedia } from '@/lib/types';
import { getStoredCards, saveCard } from '@/lib/data/card-store';
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
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [cards, setCards] = useState<FullCard[]>([]);
  const [activeCardId, setActiveCardId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'identity' | 'design' | 'links' | 'multimedia' | 'vcard' | 'analytics'
  >('identity');
  const [isSaved, setIsSaved] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  useEffect(() => {
    const loadedCards = getStoredCards();
    setCards(loadedCards);
    if (loadedCards.length > 0) {
      setActiveCardId(loadedCards[0].id);
    }
  }, []);

  const currentCard = cards.find((c) => c.id === activeCardId) || cards[0];

  const handleCardUpdate = (fields: Partial<FullCard>) => {
    if (!currentCard) return;
    const updated = { ...currentCard, ...fields };
    const newCards = cards.map((c) => (c.id === currentCard.id ? updated : c));
    setCards(newCards);
    saveCard(updated);
  };

  const handleLinksUpdate = (newLinks: CardLink[]) => {
    if (!currentCard) return;
    const updated = { ...currentCard, links: newLinks };
    const newCards = cards.map((c) => (c.id === currentCard.id ? updated : c));
    setCards(newCards);
    saveCard(updated);
  };

  const handleMultimediaUpdate = (newItems: CatalogMultimedia[]) => {
    if (!currentCard) return;
    const updated = { ...currentCard, multimedia: newItems };
    const newCards = cards.map((c) => (c.id === currentCard.id ? updated : c));
    setCards(newCards);
    saveCard(updated);
  };

  const handleManualSave = () => {
    if (currentCard) {
      saveCard(currentCard);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    }
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Editor de Tarjeta Digital
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-300 dark:border-emerald-800">
                Sincronización en Vivo
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Personaliza el chip NFC y código QR de:{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {currentCard.full_name}
              </span>{' '}
              ({currentCard.company_name || 'Sin empresa'})
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Acceso a panel de empresa B2B */}
            <Link
              href="/org-dashboard"
              className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Panel B2B Empresa</span>
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
              <span>{showMobilePreview ? 'Ocultar Móvil' : 'Ver Móvil'}</span>
            </button>

            {/* Enlace al perfil público */}
            <a
              href={`/c/${currentCard.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir /c/{currentCard.slug}</span>
            </a>

            {/* Botón Guardar Cambios */}
            <button
              type="button"
              onClick={handleManualSave}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>¡Cambios Guardados!</span>
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
