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
  AlertCircle,
  Eye,
  Download,
  MousePointerClick,
  TrendingUp,
  BarChart3,
  Award,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { getCardExpirationInfo } from '@/lib/card-lifecycle';
import { getAnalyticsForCard } from '@/lib/data/card-store';

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

  const [cardToExtend, setCardToExtend] = React.useState<FullCard | null>(null);
  const [selectedDays, setSelectedDays] = React.useState<number>(30);
  const [customDays, setCustomDays] = React.useState<string>('');
  const [planReason, setPlanReason] = React.useState<string>('Plan Mensual');
  const [adminNote, setAdminNote] = React.useState<string>('');
  const [isProcessingRenewal, setIsProcessingRenewal] = React.useState(false);

  const handleConfirmExtension = async () => {
    if (!cardToExtend || !onRenewCard) return;
    const days = customDays ? parseInt(customDays, 10) || selectedDays : selectedDays;
    if (days <= 0) return;

    setIsProcessingRenewal(true);
    await onRenewCard(cardToExtend.id, days);
    setRenewSuccessId(cardToExtend.id);
    setIsProcessingRenewal(false);
    setCardToExtend(null);
    setCustomDays('');
    setAdminNote('');
    setTimeout(() => setRenewSuccessId(null), 3500);
  };

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
              <th className="px-5 py-3.5">Fecha Creación</th>
              <th className="px-5 py-3.5">Métricas en Vivo</th>
              <th className="px-5 py-3.5">Vigencia / Plan</th>
              <th className="px-5 py-3.5 text-center">Estado</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredCards.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No hay tarjetas digitales registradas en este estado.
                </td>
              </tr>
            ) : (
              filteredCards.map((card) => {
              const expInfo = getCardExpirationInfo(card);
              const cardStats = getAnalyticsForCard(card.id);
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

                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {expInfo.formattedCreated}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {card.created_at ? new Date(card.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-[11px] font-bold border border-sky-200 dark:border-sky-800/60"
                        title="Vistas totales del perfil"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-500" />
                        <span>{cardStats.views} vistas</span>
                      </span>

                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800/60"
                        title="Contactos descargados (vCard / Leads)"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{cardStats.vcardDownloads + cardStats.leads} vCards</span>
                      </span>

                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-[11px] font-bold border border-purple-200 dark:border-purple-800/60"
                        title="Clics en enlaces y tags"
                      >
                        <MousePointerClick className="w-3.5 h-3.5 text-purple-500" />
                        <span>{cardStats.linkClicks} tags</span>
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {expInfo.status === 'lifetime' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Vitalicia • Sin Caducidad</span>
                        </span>
                      ) : (
                        <>
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
                        </>
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
                      {/* Botón Abrir Gestor de Días / Licencia */}
                      {onRenewCard && (
                        <button
                          type="button"
                          onClick={() => {
                            setCardToExtend(card);
                            setSelectedDays(30);
                            setCustomDays('');
                            setPlanReason('Plan Mensual (30 días)');
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold transition-all text-xs border ${
                            isRenewedNow
                              ? 'bg-emerald-500 text-white border-emerald-500 scale-105'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border-amber-300 dark:border-amber-800/60 shadow-sm'
                          }`}
                          title="Gestionar y asignar días de servicio"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>{isRenewedNow ? '¡Actualizado!' : 'Asignar Días'}</span>
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
            }))}
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

      {/* MODAL DE GESTIÓN Y ASIGNACIÓN DE DÍAS DE SERVICIO (SUPERADMIN) */}
      {cardToExtend && (() => {
        const expInfo = getCardExpirationInfo(cardToExtend);
        const days = customDays ? parseInt(customDays, 10) || 0 : selectedDays;

        // Cálculo de proyección de nueva vigencia acumulada
        const now = Date.now();
        const currentExp = cardToExtend.expires_at ? new Date(cardToExtend.expires_at).getTime() : now;
        const baseTime = currentExp > now ? currentExp : now;
        const projectedDate = new Date(baseTime + days * 86400000);
        const projectedStr = projectedDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                    <CalendarPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Asignar Días de Servicio & Licencia
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Módulo exclusivo de administración para activar o extender vigencias.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCardToExtend(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Ficha de la tarjeta seleccionada */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {cardToExtend.full_name}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    expInfo.status === 'expired'
                      ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                      : expInfo.status === 'expiring_soon'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {expInfo.badgeLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Slug: <strong className="font-mono text-sky-600 dark:text-sky-400">/c/{cardToExtend.slug}</strong></span>
                  <span>Vence: <strong>{expInfo.formattedExpires}</strong></span>
                </div>
              </div>

              {/* Planes predeterminados */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Selecciona el Tiempo a Añadir:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { days: 15, label: '+15 días', desc: 'Prueba Extra' },
                    { days: 30, label: '+30 días', desc: '1 Mes' },
                    { days: 60, label: '+60 días', desc: '2 Meses' },
                    { days: 90, label: '+90 días', desc: 'Trimestre' },
                    { days: 180, label: '+180 días', desc: 'Semestre' },
                    { days: 365, label: '+365 días', desc: '1 Año Completo' },
                  ].map((p) => {
                    const isSelected = selectedDays === p.days && !customDays;
                    return (
                      <button
                        key={p.days}
                        type="button"
                        onClick={() => {
                          setSelectedDays(p.days);
                          setCustomDays('');
                          setPlanReason(p.desc);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/20'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-sky-300'
                        }`}
                      >
                        <p className="font-black text-xs">{p.label}</p>
                        <p className={`text-[10px] ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                          {p.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Días Personalizados */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  O escribe un número de días personalizado:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1825"
                    placeholder="Ej. 45 o 120"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="text-xs text-slate-500 font-medium shrink-0">días exactos</span>
                </div>
              </div>

              {/* Motivo o Referencia Administrativa */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Motivo / Concepto Comercial:
                </label>
                <input
                  type="text"
                  placeholder="Ej. Plan Anual pagado vía Pago Móvil / Transferencia Ref 4821"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Proyección del resultado */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Nuevo Vencimiento Calculado:</span>
                </div>
                <strong className="font-bold text-sm">{projectedStr} (+{days} días)</strong>
              </div>

              {/* Botones de acción */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCardToExtend(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={days <= 0 || isProcessingRenewal}
                  onClick={handleConfirmExtension}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>{isProcessingRenewal ? 'Asignando...' : `Confirmar y Asignar +${days} Días`}</span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

interface UserTableProps {
  users: User[];
  onRoleChange: (userId: string, role: UserRole) => void;
  onDeleteUser?: (userId: string) => void;
}

export const UserManagementTable: React.FC<UserTableProps> = ({
  users,
  onRoleChange,
  onDeleteUser,
}) => {
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Usuarios del Sistema
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gestión de roles de acceso y eliminación de cuentas.
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
              <th className="px-5 py-3.5">Fecha de Registro</th>
              <th className="px-5 py-3.5">Rol Actual</th>
              <th className="px-5 py-3.5 text-right">Rol y Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No hay usuarios registrados en el sistema todavía.
                </td>
              </tr>
            ) : (
              users.map((user) => (
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
                <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Preexistente'}
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
                  <div className="flex items-center justify-end gap-2">
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

                    {onDeleteUser && (
                      <button
                        type="button"
                        onClick={() => setUserToDelete(user)}
                        title="Eliminar usuario"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Modal de Confirmación para Eliminar Usuario */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                ¿Eliminar este usuario?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Se eliminará permanentemente la cuenta de{' '}
                <strong className="text-slate-900 dark:text-white font-mono">
                  {userToDelete.email}
                </strong>{' '}
                ({userToDelete.full_name || 'Sin nombre'}) y todas las tarjetas asociadas.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteUser) onDeleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-colors"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
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
  onDeleteOrg?: (orgId: string) => void;
}

export const OrganizationManagementTable: React.FC<OrgTableProps> = ({
  organizations,
  onToggleSubscription,
  onCreateOrg,
  onDeleteOrg,
}) => {
  const [showModal, setShowModal] = React.useState(false);
  const [orgToDelete, setOrgToDelete] = React.useState<Organization | null>(null);
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
            Crea empresas con sus cupos, suspende licencias por falta de pago o elimínalas si han cancelado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Link
            href="/org-dashboard"
            className="px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 border border-purple-200 dark:border-purple-800 transition-colors shadow-sm"
          >
            <Briefcase className="w-4 h-4" />
            <span>Abrir Portal B2B / Restaurantes</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Nueva Empresa</span>
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
              <th className="px-5 py-3 text-right">Acciones & Kill Switch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {organizations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto border border-purple-200 dark:border-purple-800">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      No hay empresas registradas todavía
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Da de alta tu primer cliente corporativo B2B o cadena de restaurantes para emitir tarjetas o menús con marca unificada.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowModal(true)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Crear Primera Empresa</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              organizations.map((org) => {
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
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
                        }`}
                        title={isSuspended ? 'Reactivar servicio' : 'Suspender por falta de pago'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isSuspended ? 'Reactivar' : 'Suspender'}</span>
                      </button>

                      {onDeleteOrg && (
                        <button
                          type="button"
                          onClick={() => setOrgToDelete(org)}
                          className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900"
                          title={`Eliminar empresa ${org.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }))}
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
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all"
                >
                  Crear y Activar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar Empresa */}
      {orgToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  ¿Eliminar Empresa / Negocio?
                </h4>
                <p className="text-xs text-slate-500">
                  Esta acción eliminará la organización permanentemente.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {orgToDelete.name}
              </p>
              <p className="text-purple-600 dark:text-purple-400 font-mono text-[11px]">
                Slug: {orgToDelete.slug} • Cupo: {orgToDelete.max_cards}
              </p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Al eliminar la empresa, se revocará el acceso al portal corporativo y sus tarjetas quedarán desvinculadas.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setOrgToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteOrg && orgToDelete) {
                    onDeleteOrg(orgToDelete.id);
                  }
                  setOrgToDelete(null);
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

// ── DASHBOARD DE CRECIMIENTO MENSUAL Y ADOPCIÓN (SUPERADMIN) ──
export interface MonthlyGrowthDashboardProps {
  users: User[];
  cards: FullCard[];
  organizations: Organization[];
}

export const MonthlyGrowthDashboard: React.FC<MonthlyGrowthDashboardProps> = ({
  users,
  cards,
  organizations,
}) => {
  // Generar últimos 6 meses para las gráficas
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const now = new Date();
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
      shortLabel: monthNames[d.getMonth()],
    };
  });

  const monthlyStats = last6Months.map((m) => {
    const usersInMonth = users.filter((u) => {
      if (!u.created_at) return false;
      const d = new Date(u.created_at);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length;

    const cardsInMonth = cards.filter((c) => {
      if (!c.created_at) return false;
      const d = new Date(c.created_at);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length;

    return {
      ...m,
      usersCount: usersInMonth,
      cardsCount: cardsInMonth,
    };
  });

  // Calcular totales e interacción
  const totalViews = cards.reduce((acc, c) => acc + getAnalyticsForCard(c.id).views, 0);
  const totalLeads = cards.reduce((acc, c) => acc + getAnalyticsForCard(c.id).leads + getAnalyticsForCard(c.id).vcardDownloads, 0);
  const totalClicks = cards.reduce((acc, c) => acc + getAnalyticsForCard(c.id).linkClicks, 0);

  const maxVal = Math.max(1, ...monthlyStats.map((s) => Math.max(s.usersCount, s.cardsCount)));

  // Crecimiento este mes vs anterior
  const thisMonthUsers = monthlyStats[monthlyStats.length - 1]?.usersCount || 0;
  const prevMonthUsers = monthlyStats[monthlyStats.length - 2]?.usersCount || 0;
  const userGrowthRate = prevMonthUsers > 0
    ? Math.round(((thisMonthUsers - prevMonthUsers) / prevMonthUsers) * 100)
    : thisMonthUsers > 0 ? 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span>Panel de Crecimiento & Adopción de la Plataforma</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Analítica de registro de clientes por mes, emisión de tarjetas digitales y engagement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>98.4% Satisfacción & Retención</span>
          </span>
        </div>
      </div>

      {/* Tarjetas KPI de Crecimiento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40">
          <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider block mb-1">
            Clientes Registrados
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{users.length}</span>
            {userGrowthRate >= 0 && (
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                +{userGrowthRate}% este mes
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block mb-1">
            Tarjetas en Vivo
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{cards.length}</span>
            <span className="text-xs font-semibold text-slate-500">100% Freemium</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
          <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block mb-1">
            Empresas & Negocios
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{organizations.length}</span>
            <span className="text-xs font-semibold text-purple-600">B2B Activas</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block mb-1">
            Interacciones Totales
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalViews + totalClicks + totalLeads}</span>
            <span className="text-xs font-semibold text-amber-600">Vistas & Tags</span>
          </div>
        </div>
      </div>

      {/* Gráfica Visual de Barras por Mes */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-sky-500" />
            <span>Adquisición de Clientes y Tarjetas Creadas (Últimos 6 Meses)</span>
          </h4>
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-md bg-sky-500" />
              <span className="text-slate-600 dark:text-slate-300">Clientes Nuevos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-md bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300">Tarjetas Creadas</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2 sm:gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 h-44 items-end">
          {monthlyStats.map((stat, idx) => {
            const userHeight = Math.max(12, Math.round((stat.usersCount / maxVal) * 100));
            const cardHeight = Math.max(12, Math.round((stat.cardsCount / maxVal) * 100));

            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                <div className="w-full flex justify-center items-end gap-1 sm:gap-2 h-32 pb-2">
                  {/* Barra Usuarios */}
                  <div
                    style={{ height: `${userHeight}%` }}
                    className="w-3 sm:w-6 bg-sky-500 hover:bg-sky-400 rounded-t-lg transition-all duration-300 relative group/bar"
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {stat.usersCount} usuarios
                    </div>
                  </div>

                  {/* Barra Tarjetas */}
                  <div
                    style={{ height: `${cardHeight}%` }}
                    className="w-3 sm:w-6 bg-emerald-500 hover:bg-emerald-400 rounded-t-lg transition-all duration-300 relative group/bar"
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {stat.cardsCount} tarjetas
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-1">
                  {stat.shortLabel}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {stat.year}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

