/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { FullCard, SystemMetrics, User, UserRole, Organization } from '@/lib/types';
import {
  getStoredCards,
  getStoredUsers,
  getStoredOrganizations,
  getSystemMetrics,
  toggleCardActiveStatus,
  updateUserRole,
  toggleOrganizationSubscription,
  createNewOrganization,
  deleteCard,
  renewCardSubscription,
  persistCards,
} from '@/lib/data/card-store';
import {
  MetricsOverview,
  CardManagementTable,
  UserManagementTable,
  OrganizationManagementTable,
} from '@/components/admin/AdminComponents';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { ShieldCheck, RefreshCw, AlertCircle, Filter, CheckCircle2 } from 'lucide-react';

export default function SuperadminPage() {
  const [cards, setCards] = useState<FullCard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [hideDemoData, setHideDemoData] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    totalOrganizations: 0,
    totalCards: 0,
    activeCards: 0,
    totalLinks: 0,
    totalMultimedia: 0,
    totalViews: 0,
    totalLeads: 0,
  });

  const loadData = async () => {
    let realUsers: User[] = [];
    let realCards: FullCard[] = [];
    let realOrgs: Organization[] = [];

    // 1. Cargar datos en vivo de Supabase si está disponible
    if (isSupabaseEnabled && supabase) {
      try {
        const [usersRes, cardsRes, orgsRes] = await Promise.all([
          supabase.from('users').select('*').order('created_at', { ascending: false }),
          supabase.from('cards').select('*, links:card_links(*)').order('created_at', { ascending: false }),
          supabase.from('organizations').select('*').order('created_at', { ascending: false }),
        ]);

        if (usersRes.data && usersRes.data.length > 0) {
          realUsers = usersRes.data;
        }
        if (cardsRes.data && cardsRes.data.length > 0) {
          realCards = cardsRes.data;
        }
        if (orgsRes.data && orgsRes.data.length > 0) {
          realOrgs = orgsRes.data;
        }
      } catch (err) {
        console.warn('Error cargando datos de Supabase en Admin:', err);
      }
    }

    // 2. Cargar datos locales de respaldo
    const localCards = getStoredCards();
    const localUsers = getStoredUsers();
    const localOrgs = getStoredOrganizations();

    // 3. Filtro de Modo Limpio (Excluir semillas ficticias de demostración)
    const demoCardSlugs = new Set(['carlos-fibraconnect', 'elena-rodriguez', 'marcos-tech']);
    const demoUserEmails = new Set(['admin@proconnect.app', 'elena@nexacorp.io']);
    const demoOrgSlugs = new Set(['nexacorp']);

    const finalUsers = hideDemoData
      ? realUsers.length > 0
        ? realUsers.filter((u) => !demoUserEmails.has(u.email?.toLowerCase()))
        : localUsers.filter((u) => !demoUserEmails.has(u.email?.toLowerCase()))
      : [...realUsers, ...localUsers.filter((u) => !realUsers.some((ru) => ru.id === u.id))];

    const finalCards = hideDemoData
      ? realCards.length > 0
        ? realCards.filter((c) => !demoCardSlugs.has(c.slug?.toLowerCase()))
        : localCards.filter((c) => !demoCardSlugs.has(c.slug?.toLowerCase()))
      : [...realCards, ...localCards.filter((c) => !realCards.some((rc) => rc.id === c.id))];

    const finalOrgs = hideDemoData
      ? realOrgs.length > 0
        ? realOrgs.filter((o) => !demoOrgSlugs.has(o.slug?.toLowerCase()))
        : localOrgs.filter((o) => !demoOrgSlugs.has(o.slug?.toLowerCase()))
      : [...realOrgs, ...localOrgs.filter((o) => !realOrgs.some((ro) => ro.id === o.id))];

    setUsers(finalUsers);
    setCards(finalCards);
    setOrganizations(finalOrgs);

    setMetrics({
      totalUsers: finalUsers.length,
      totalOrganizations: finalOrgs.length,
      totalCards: finalCards.length,
      activeCards: finalCards.filter((c) => c.is_active).length,
      totalLinks: finalCards.reduce((acc, c) => acc + (c.links?.length || 0), 0),
      totalMultimedia: 0,
      totalViews: 0,
      totalLeads: 0,
    });
  };

  useEffect(() => {
    loadData();
  }, [hideDemoData]);

  const handleToggleCardActive = async (cardId: string) => {
    toggleCardActiveStatus(cardId);
    if (isSupabaseEnabled && supabase) {
      const card = cards.find((c) => c.id === cardId);
      if (card) {
        await supabase.from('cards').update({ is_active: !card.is_active }).eq('id', cardId);
      }
    }
    loadData();
  };

  const handleRenewCard = async (cardId: string, days: number = 30) => {
    const updated = renewCardSubscription(cardId, days);
    if (isSupabaseEnabled && supabase && updated) {
      try {
        await supabase.from('cards').update({
          expires_at: updated.expires_at,
          is_active: true,
          updated_at: new Date().toISOString(),
        }).eq('id', cardId);
      } catch (err) {
        console.warn('Error renovando tarjeta en Supabase:', err);
      }
    }
    await loadData();
  };

  const handleDeleteCard = async (cardId: string) => {
    deleteCard(cardId);
    setCards((prev) => prev.filter((c) => c.id !== cardId));

    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('cards').delete().eq('id', cardId);
      } catch (e) {}
    }

    try {
      await fetch(`/api/cards?id=${encodeURIComponent(cardId)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error al eliminar tarjeta en servidor:', err);
    }

    loadData();
  };

  const handleUserRoleChange = async (userId: string, newRole: UserRole) => {
    updateUserRole(userId, newRole);
    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('users').update({ role: newRole }).eq('id', userId);
      } catch (e) {}
    }
    loadData();
  };

  const handleToggleOrgSubscription = (orgId: string) => {
    toggleOrganizationSubscription(orgId);
    loadData();
  };

  const handleCreateOrg = async (data: {
    name: string;
    slug: string;
    org_type: 'corporate' | 'restaurant';
    max_cards: number;
    admin_email: string;
    admin_name: string;
  }) => {
    createNewOrganization({
      name: data.name,
      slug: data.slug,
      org_type: data.org_type,
      max_cards: data.max_cards,
    });
    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('organizations').insert({
          name: data.name,
          slug: data.slug,
          org_type: data.org_type,
          max_cards: data.max_cards,
        });
      } catch (e) {}
    }
    loadData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Encabezado Superadmin */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Panel de Superadministrador
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                  Root Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Control de licencias B2B, vigencia mensual, emisión de tarjetas y usuarios.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Toggle Modo Limpio */}
            <button
              type="button"
              onClick={() => setHideDemoData(!hideDemoData)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                hideDemoData
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
              title="Alternar entre ver solo usuarios reales o incluir datos de demostración"
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${hideDemoData ? 'text-emerald-500' : 'text-slate-400'}`} />
              <span>{hideDemoData ? 'Modo Limpio (Solo Datos Reales)' : 'Mostrando Demos'}</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto bg-white dark:bg-slate-900"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualizar Datos</span>
            </button>
          </div>
        </div>

        {/* 1. Métricas Globales del Sistema */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Métricas Globales de la Plataforma
          </h2>
          <MetricsOverview metrics={metrics} />
        </section>

        {/* 2. Empresas, Clientes Corporativos y Restaurantes */}
        <section>
          <OrganizationManagementTable
            organizations={organizations}
            onToggleSubscription={handleToggleOrgSubscription}
            onCreateOrg={handleCreateOrg}
          />
        </section>

        {/* 3. Tabla de Tarjetas NFC */}
        <section>
          <CardManagementTable
            cards={cards}
            onToggleActive={handleToggleCardActive}
            onDeleteCard={handleDeleteCard}
            onRenewCard={handleRenewCard}
          />
        </section>

        {/* 3. Tabla de Usuarios */}
        <section>
          <UserManagementTable
            users={users}
            onRoleChange={handleUserRoleChange}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
