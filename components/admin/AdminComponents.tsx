/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { FullCard, SystemMetrics, User, UserRole, Organization, OrgType } from '@/lib/types';
import {
  Users,
  CreditCard,
  CheckCircle,
  Link2,
  FileText,
  ExternalLink,
  Shield,
  Search,
  Building2,
  Plus,
  UtensilsCrossed,
  Power,
  X,
  Briefcase,
  Trash2,
  Calendar,
  CalendarPlus,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { getCardExpirationInfo } from '@/lib/card-lifecycle';

interface MetricsOverviewProps {
  metrics: SystemMetrics;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics }) => {
  const cards = [
    {
      label: 'Usuarios Registrados',
      value: metrics.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-500',
    },
    {
      label: 'Tarjetas Digitales Creadas',
      value: metrics.totalCards,
      icon: CreditCard,
      color: 'from-sky-500 to-cyan-600',
      textColor: 'text-sky-500',
    },
    {
      label: 'Tarjetas Activas en Red',
      value: metrics.activeCards,
      icon: CheckCircle,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-500',
    },
    {
      label: 'Enlaces & Redes Vinculadas',
      value: metrics.totalLinks,
      icon: Link2,
      color: 'from-purple-500 to-violet-600',
      textColor: 'text-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {card.label}
              </p>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                {card.value}
              </h4>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-md`}
            >
              <Icon className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface CardTableProps {
  cards: FullCard[];
  onToggleActive: (id: string) => void;
  onDeleteCard?: (id: string) => void;
  onRenewCard?: (id: string, days?: number) => void;
}

export const CardManagementTable: React.FC<CardTableProps> = ({
  cards,
  onToggleActive,
  onDeleteCard,
  onRenewCard,
}) => {
  const [cardToDelete, setCardToDelete] = React.useState<FullCard | null>(null);
  const [renewSuccessId, setRenewSuccessId] = React.useState<string | null>(null);
  const [filterTab, setFilterTab] = React.useState<'all' | 'expiring' | 'expired' | 'active'>('all');

  const expiringCount = cards.filter((c) => getCardExpirationInfo(c).isExpiringSoon).length;
  const expiredCount = cards.filter((c) => getCardExpirationInfo(c).isExpired).length;
  const activeCount = cards.filter((c) => getCardExpirationInfo(c).status === 'active').length;

  const filteredCards = cards.filter((c) => {
    const info = getCardExpirationInfo(c);
    if (filterTab === 'expiring') return info.isExpiringSoon;
    if (filterTab === 'expired') return info.isExpired;
    if (filterTab === 'active') return info.status === 'active';
    return true;
  });

  const handleRenew = (cardId: string) => {
    if (onRenewCard) {
      onRenewCard(cardId, 30);
      setRenewSuccessId(cardId);
      setTimeout(() => setRenewSuccessId(null), 3000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Tarjetas NFC & Perfiles Públicos
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {cards.length} total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registro cronológico, control de vigencia mensual/anual y alertas preventivas.
          </p>
        </div>

        {/* Pestañas de filtrado por vencimiento */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
              filterTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todas ({cards.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('expiring')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              filterTab === 'expiring'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Por Vencer ({expiringCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('expired')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              filterTab === 'expired'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-red-600 dark:text-red-400 hover:bg-red-500/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Vencidas ({expiredCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('active')}
            className={`px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
              filterTab === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Activas ({activeCount})
          </button>
        </div>
      </div>

      {/* Banner de Alerta Preventiva si hay tarjetas por vencer o vencidas */}
      {(expiringCount > 0 || expiredCount > 0) && filterTab === 'all' && (
        <div className="mx-5 my-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-amber-700 dark:text-amber-400">
              Control Preventivo de Vencimiento de Tarjetas
            </p>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5">
              {expiringCount > 0 && (
                <span>⚠️ Hay <strong>{expiringCount} tarjeta(s)</strong> que vencen en 7 días o menos. </span>
              )}
              {expiredCount > 0 && (
                <span>🔴 Hay <strong>{expiredCount} tarjeta(s)</strong> que ya han cumplido su periodo mensual. </span>
              )}
              Puedes extender o renovar su vigencia en 30 días usando el botón <strong>+30d</strong> en cada fila.
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Titular / Empresa</th>
              <th className="px-5 py-3.5">Slug Público</th>
              <th className="px-5 py-3.5">Registro</th>
              <th className="px-5 py-3.5">Vencimiento & Alerta</th>
              <th className="px-5 py-3.5 text-center">Estado</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredCards.map((card) => {
              const expInfo = getCardExpirationInfo(card);
              const isRenewedNow = renewSuccessId === card.id;

              return (
                <tr
                  key={card.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          card.profile_photo_url ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
                        }
                        alt={card.full_name}
                        className="w-9 h-9 rounded-xl object-cover shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 dark:text-white text-xs">
                            {card.full_name}
                          </p>
                          {card.slug === 'luigi-colonico' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 font-bold border border-sky-500/20">
                              Tu Tarjeta
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                          {card.job_title || card.company_name || 'Sin empresa'}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 font-mono text-[11px] text-sky-600 dark:text-sky-400">
                    /c/{card.slug}
                  </td>

                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {expInfo.formattedCreated}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {expInfo.formattedExpires}
                      </p>
                      {expInfo.status === 'expired' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                          <Clock className="w-3 h-3" />
                          {expInfo.badgeLabel}
                        </span>
                      )}
                      {expInfo.status === 'expiring_soon' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          {expInfo.badgeLabel}
                        </span>
                      )}
                      {expInfo.status === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {expInfo.badgeLabel}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleActive(card.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        card.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      title={card.is_active ? 'Desactivar tarjeta' : 'Activar tarjeta'}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          card.is_active ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Botón Renovar (+30 días) */}
                      {onRenewCard && (
                        <button
                          type="button"
                          onClick={() => handleRenew(card.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold transition-all text-xs border ${
                            isRenewedNow
                              ? 'bg-emerald-500 text-white border-emerald-500 scale-105'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border-amber-200 dark:border-amber-800/60'
                          }`}
                          title="Renovar suscripción por +30 días"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>{isRenewedNow ? '¡Renovada!' : '+30d'}</span>
                        </button>
                      )}

                      <a
                        href={`/c/${card.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-semibold hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
                      >
                        <span>Ver Perfil</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {onDeleteCard && (
                        <button
                          type="button"
                          onClick={() => setCardToDelete(card)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
                          title={`Eliminar tarjeta de ${card.full_name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>


      {/* Modal de Confirmación de Eliminación */}
      {cardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  ¿Eliminar Tarjeta Digital?
                </h4>
                <p className="text-xs text-slate-500">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {cardToDelete.full_name}
              </p>
              <p className="text-sky-600 dark:text-sky-400 font-mono text-[11px]">
                /c/{cardToDelete.slug}
              </p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              El perfil digital dejará de estar disponible de inmediato y el enlace público o chip NFC mostrará un mensaje de tarjeta no encontrada.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteCard && cardToDelete) {
                    onDeleteCard(cardToDelete.id);
                  }
                  setCardToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors shadow-md shadow-red-600/20"
              >
                Sí, Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface UserTableProps {
  users: User[];
  onRoleChange: (userId: string, role: UserRole) => void;
}

export const UserManagementTable: React.FC<UserTableProps> = ({
  users,
  onRoleChange,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Usuarios del Sistema
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gestión de roles de acceso (Administrador o Cliente).
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {users.length} usuarios
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Nombre</th>
              <th className="px-5 py-3.5">Email</th>
              <th className="px-5 py-3.5">Rol Actual</th>
              <th className="px-5 py-3.5 text-right">Modificar Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                  {user.full_name || 'Sin nombre'}
                </td>
                <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                  {user.email}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                      user.role === 'superadmin'
                        ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800'
                        : user.role === 'org_admin'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {(user.role === 'superadmin' || user.role === 'org_admin') && <Shield className="w-3 h-3" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <select
                    value={user.role}
                    onChange={(e) =>
                      onRoleChange(user.id, e.target.value as UserRole)
                    }
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="client">Cliente</option>
                    <option value="org_admin">Admin Org.</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── TABLA DE GESTIÓN DE ORGANIZACIONES Y KILL SWITCH DE SUSCRIPCIÓN ──
export interface OrgTableProps {
  organizations: Organization[];
  onToggleSubscription: (orgId: string) => void;
  onCreateOrg: (data: {
    name: string;
    slug: string;
    org_type: 'corporate' | 'restaurant';
    max_cards: number;
    admin_email: string;
    admin_name: string;
  }) => void;
}

export const OrganizationManagementTable: React.FC<OrgTableProps> = ({
  organizations,
  onToggleSubscription,
  onCreateOrg,
}) => {
  const [showModal, setShowModal] = React.useState(false);
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [orgType, setOrgType] = React.useState<'corporate' | 'restaurant'>('corporate');
  const [maxCards, setMaxCards] = React.useState(15);
  const [adminEmail, setAdminEmail] = React.useState('');
  const [adminName, setAdminName] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !adminEmail.trim()) return;
    onCreateOrg({
      name,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      org_type: orgType,
      max_cards: Number(maxCards),
      admin_email: adminEmail,
      admin_name: adminName || name + ' Admin',
    });
    setName('');
    setSlug('');
    setAdminEmail('');
    setAdminName('');
    setShowModal(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-500" />
            <span>Empresas y Restaurantes Registrados ({organizations.length})</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Control de suscripciones, cupos de tarjetas/mesas y suspensión inmediata por falta de pago.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Link
            href="/org-dashboard"
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 border border-purple-200 dark:border-purple-800 transition-colors shadow-sm"
          >
            <Briefcase className="w-4 h-4" />
            <span>Abrir Portal B2B / Restaurantes</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn-brand text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Empresa / Negocio</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            <tr>
              <th className="px-5 py-3">Empresa / Negocio</th>
              <th className="px-5 py-3">Tipo de Contrato</th>
              <th className="px-5 py-3">Cupo Asignado</th>
              <th className="px-5 py-3">Estado Suscripción</th>
              <th className="px-5 py-3 text-right">Interruptor (Kill Switch)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {organizations.map((org) => {
              const isSuspended = org.subscription_status === 'suspended';
              const isRestaurant = org.org_type === 'restaurant' || org.slug === 'brasa-criolla';

              return (
                <tr
                  key={org.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 overflow-hidden flex-shrink-0">
                        {org.logo_url ? (
                          <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
                        ) : (
                          org.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                          {org.name}
                        </p>
                        <p className="text-[11px] font-mono text-purple-500 mt-0.5">
                          /{isRestaurant ? 'r' : 'c'}/{org.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                      isRestaurant
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-purple-100 text-purple-700 border border-purple-200'
                    }`}>
                      {isRestaurant ? <UtensilsCrossed className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                      {isRestaurant ? 'Restaurante Gastro' : 'Corporativo B2B'}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">
                    {org.max_cards} {isRestaurant ? 'mesas' : 'tarjetas NFC'}
                  </td>

                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border ${
                      isSuspended
                        ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isSuspended ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                      {isSuspended ? 'Suspendida (Falta de Pago)' : 'Suscripción Activa'}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/org-dashboard?org=${org.slug}`}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold text-xs transition-colors flex items-center gap-1 border border-purple-200 dark:border-purple-800 shadow-sm"
                      >
                        <span>Gestionar</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => onToggleSubscription(org.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm ${
                          isSuspended
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-950/30 dark:border-red-800'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isSuspended ? 'Reactivar' : 'Suspender'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Creación de Empresa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-blue" />
                <span>Registrar Nueva Empresa / Restaurante</span>
              </h4>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Empresa o Restaurante *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: FibraConnect Telecom o Prisma Eventos"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                  }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-blue outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Slug / URL pública *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej: fibraconnect"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-blue outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Módulo
                  </label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-blue outline-none font-semibold"
                  >
                    <option value="corporate">Corporativo B2B (Tarjetas NFC)</option>
                    <option value="restaurant">Restaurante Gastro (Mesas NFC)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cupo de Tarjetas o Mesas Contratadas
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={maxCards}
                  onChange={(e) => setMaxCards(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-blue outline-none font-medium"
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <p className="text-[11px] font-bold text-brand-blue dark:text-brand-cyan mb-2 uppercase tracking-wider">
                  Credenciales del Administrador de la Empresa
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Nombre del Encargado
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Lic. Carlos Gómez"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-blue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Correo de Acceso *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@empresa.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-blue outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-brand text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Crear y Activar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
