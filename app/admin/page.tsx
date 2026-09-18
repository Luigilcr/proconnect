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

  const loadData = () => {
    setCards(getStoredCards());
    setUsers(getStoredUsers());
    setOrganizations(getStoredOrganizations());
    setMetrics(getSystemMetrics());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleCardActive = (cardId: string) => {
    toggleCardActiveStatus(cardId);
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
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                  Root Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Control de multi-inquilinos, métricas globales del ecosistema y activación de tarjetas NFC.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
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

        {/* 2. Tabla de Tarjetas NFC */}
        <section>
          <CardManagementTable
            cards={cards}
            onToggleActive={handleToggleCardActive}
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
