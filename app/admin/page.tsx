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
import { ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

export default function SuperadminPage() {
  const [cards, setCards] = useState<FullCard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
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
    // 1. Cargar localmente primero
    const local = getStoredCards();
    setCards(local);
    setUsers(getStoredUsers());
    setOrganizations(getStoredOrganizations());
    setMetrics(getSystemMetrics());

    // 2. Sincronizar con el servidor (/api/cards) para traer cualquier tarjeta en la nube
    try {
      const res = await fetch('/api/cards');
      const data = await res.json();
      if (data.success && Array.isArray(data.cards)) {
        const map = new Map<string, FullCard>();
        local.forEach((c) => map.set(c.slug.toLowerCase().trim(), c));
        data.cards.forEach((c: FullCard) => {
          if (c && c.slug) map.set(c.slug.toLowerCase().trim(), c);
        });
        const merged = Array.from(map.values());
        setCards(merged);
        persistCards(merged);
      }
    } catch (e) {
      console.warn('Error sincronizando tarjetas del servidor:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleCardActive = (cardId: string) => {
    toggleCardActiveStatus(cardId);
    loadData();
  };

  const handleRenewCard = (cardId: string, days: number = 30) => {
    renewCardSubscription(cardId, days);
    loadData();
  };

  const handleDeleteCard = async (cardId: string) => {
    deleteCard(cardId);
    setCards((prev) => prev.filter((c) => c.id !== cardId));

    try {
      await fetch(`/api/cards?id=${encodeURIComponent(cardId)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error al eliminar tarjeta en servidor:', err);
    }

    loadData();
  };

  const handleUserRoleChange = (userId: string, newRole: UserRole) => {
    updateUserRole(userId, newRole);
    loadData();
  };
  const handleToggleOrgSubscription = (orgId: string) => {
    toggleOrganizationSubscription(orgId);
    loadData();
  };

  const handleCreateOrg = (data: {
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

          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar Datos</span>
          </button>
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
