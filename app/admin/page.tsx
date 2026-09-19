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
  deleteStoredOrganization,
  deleteCard,
  renewCardSubscription,
  persistCards,
  getAnalyticsForCard,
  purgeAllDemoData,
  DEMO_CARD_SLUGS,
  DEMO_USER_EMAILS,
  DEMO_ORG_SLUGS,
  DEMO_ORG_IDS,
} from '@/lib/data/card-store';
import {
  MetricsOverview,
  CardManagementTable,
  UserManagementTable,
  OrganizationManagementTable,
  MonthlyGrowthDashboard,
} from '@/components/admin/AdminComponents';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { isSuperAdminEmail } from '@/lib/db-normalize';
import { ShieldCheck, RefreshCw, AlertCircle, Filter, CheckCircle2, Trash2, Database, Check } from 'lucide-react';

export default function SuperadminPage() {
  const [cards, setCards] = useState<FullCard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [purgeToast, setPurgeToast] = useState<boolean>(false);
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

  const handlePurgeDemos = () => {
    purgeAllDemoData();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('proconnect_cards_data_v2');
        localStorage.removeItem('proconnect_orgs_data_v2');
        localStorage.removeItem('proconnect_users_data_v2');
        localStorage.removeItem('proconnect_leads_data_v2');
        localStorage.removeItem('proconnect_analytics_data_v2');
      } catch {}
    }
    setPurgeToast(true);
    setTimeout(() => setPurgeToast(false), 4500);
    loadData();
  };

  const loadData = async () => {
    // 0. Purgar caché demo residual
    purgeAllDemoData();

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
          realUsers = usersRes.data.map((u) => {
            if (isSuperAdminEmail(u.email) && u.role !== 'superadmin') {
              supabase?.from('users').update({ role: 'superadmin' }).eq('id', u.id).then();
              return { ...u, role: 'superadmin' as UserRole };
            }
            return u;
          });
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

    // 1.1 Consultar la API del servidor /api/cards
    try {
      const apiRes = await fetch('/api/cards');
      const apiData = await apiRes.json();
      if (apiData?.success && Array.isArray(apiData.cards)) {
        const existingIds = new Set(realCards.map((c) => c.id));
        const existingSlugs = new Set(realCards.map((c) => c.slug.toLowerCase()));
        for (const card of apiData.cards) {
          if (!existingIds.has(card.id) && !existingSlugs.has(card.slug.toLowerCase())) {
            realCards.push(card);
          }
        }
      }
    } catch (e) {
      console.warn('Error al consultar /api/cards en admin:', e);
    }

    // 2. Cargar datos locales de respaldo (modo estricto sin demos)
    const localCards = getStoredCards(false);
    const localUsers = getStoredUsers(false);
    const localOrgs = getStoredOrganizations(false);

    // 3. Filtrar estrictamente cualquier residuo de demo
    const finalCards = [...realCards, ...localCards.filter((c) => !realCards.some((rc) => rc.id === c.id))]
      .filter((c) => c && c.slug && !DEMO_CARD_SLUGS.has(c.slug.toLowerCase().trim()));

    const finalOrgs = [...realOrgs, ...localOrgs.filter((o) => !realOrgs.some((ro) => ro.id === o.id))]
      .filter((o) => o && !DEMO_ORG_SLUGS.has(o.slug?.toLowerCase().trim()) && !DEMO_ORG_IDS.has(o.id));

    // 4. Sintetizar cuentas de usuario a partir de tarjetas reales si no están en public.users
    const usersMap = new Map<string, User>();
    [...realUsers, ...localUsers].forEach((u) => {
      if (u && u.email && !DEMO_USER_EMAILS.has(u.email.toLowerCase().trim())) {
        usersMap.set(u.id || u.email, u);
      }
    });

    finalCards.forEach((c) => {
      if (c.user_id && !usersMap.has(c.user_id)) {
        const email = (c as any).user_email || (c as any).email || `${c.slug}@proconnect.app`;
        if (!DEMO_USER_EMAILS.has(email.toLowerCase())) {
          usersMap.set(c.user_id, {
            id: c.user_id,
            email: email,
            full_name: c.full_name || 'Usuario ProConnect',
            role: isSuperAdminEmail(email) ? 'superadmin' : 'client',
            created_at: c.created_at || new Date().toISOString(),
          });
        }
      }
    });

    const finalUsers = Array.from(usersMap.values());

    setUsers(finalUsers);
    setCards(finalCards);
    setOrganizations(finalOrgs);

    const totalV = finalCards.reduce((acc, c) => acc + getAnalyticsForCard(c.id).views, 0);
    const totalL = finalCards.reduce(
      (acc, c) => acc + getAnalyticsForCard(c.id).leads + getAnalyticsForCard(c.id).vcardDownloads,
      0
    );

    setMetrics({
      totalUsers: finalUsers.length,
      totalOrganizations: finalOrgs.length,
      totalCards: finalCards.length,
      activeCards: finalCards.filter((c) => c.is_active).length,
      totalLinks: finalCards.reduce((acc, c) => acc + (c.links?.length || 0), 0),
      totalMultimedia: finalCards.reduce((acc, c) => acc + (c.multimedia?.length || 0), 0),
      totalViews: totalV,
      totalLeads: totalL,
    });
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleDeleteUser = async (userId: string) => {
    // 1. Filtrar localmente
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    const userCards = cards.filter((c) => c.user_id === userId);
    setCards((prev) => prev.filter((c) => c.user_id !== userId));
    userCards.forEach((c) => deleteCard(c.id));

    // 2. Eliminar de Supabase si está disponible
    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('cards').delete().eq('user_id', userId);
        await supabase.from('users').delete().eq('id', userId);
      } catch (err) {
        console.warn('Error eliminando usuario de Supabase:', err);
      }
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

  const handleDeleteOrg = async (orgId: string) => {
    deleteStoredOrganization(orgId);
    setOrganizations((prev) => prev.filter((o) => o.id !== orgId));
    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('organizations').delete().eq('id', orgId);
      } catch (err) {
        console.warn('Error eliminando organización en Supabase:', err);
      }
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold shadow-sm">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Datos Reales en Vivo</span>
            </div>

            <button
              type="button"
              onClick={handlePurgeDemos}
              className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Elimina cualquier dato ficticio o semilla demo del caché local del navegador"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purgar Caché Demo</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto bg-white dark:bg-slate-900 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualizar Datos</span>
            </button>
          </div>
        </div>

        {/* Notificación de Purga de Caché */}
        {purgeToast && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>¡Caché demo purgado con éxito! Ahora tu panel solo muestra usuarios, empresas y tarjetas 100% reales.</span>
          </div>
        )}

        {/* 1. Métricas Globales del Sistema */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Métricas Globales de la Plataforma
          </h2>
          <MetricsOverview metrics={metrics} />
        </section>

        {/* 2. Crecimiento Mensual y Adopción */}
        <section>
          <MonthlyGrowthDashboard
            users={users}
            cards={cards}
            organizations={organizations}
          />
        </section>

        {/* 3. Empresas, Clientes Corporativos y Restaurantes */}
        <section>
          <OrganizationManagementTable
            organizations={organizations}
            onToggleSubscription={handleToggleOrgSubscription}
            onCreateOrg={handleCreateOrg}
            onDeleteOrg={handleDeleteOrg}
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
            onDeleteUser={handleDeleteUser}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
