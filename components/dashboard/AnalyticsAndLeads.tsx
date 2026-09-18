/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * MÓDULO DE ANALÍTICAS Y CRM DE VENTAS PERSONAL
 * Gestión de prospectos capturados en calle/eventos, cambio de estados (Ganadas/Perdidas) y contacto directo.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { FullCard, WhatsAppLead, LeadStatus } from '@/lib/types';
import { getAnalyticsForCard, getLeadsByCardId, updateLeadStatus } from '@/lib/data/card-store';
import {
  Eye,
  Download,
  MessageCircle,
  TrendingUp,
  ExternalLink,
  Users,
  Calendar,
  Phone,
  Building2,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  FileCheck,
  Search,
} from 'lucide-react';

interface AnalyticsAndLeadsProps {
  card: FullCard;
}

export const AnalyticsAndLeads: React.FC<AnalyticsAndLeadsProps> = ({ card }) => {
  const [leads, setLeads] = useState<WhatsAppLead[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const exportLeadsCSV = () => {
    if (leads.length === 0) return;
    const headers = ['Fecha', 'Nombre', 'Empresa', 'Telefono', 'Email', 'Estado', 'Asunto/Notas'];
    const rows = leads.map((l) => [
      new Date(l.created_at).toISOString().split('T')[0],
      `"${(l.visitor_name || '').replace(/"/g, '""')}"`,
      `"${(l.company_name || '').replace(/"/g, '""')}"`,
      `"${l.phone_number || ''}"`,
      `"${l.email || ''}"`,
      l.status || 'nuevo',
      `"${(l.subject || l.interest_notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `proconnect-leads-${card.slug}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState('');

  const loadLeads = () => {
    setLeads(getLeadsByCardId(card.id));
  };

  useEffect(() => {
    loadLeads();
  }, [card.id]);

  const analytics = getAnalyticsForCard(card.id);

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    updateLeadStatus(leadId, newStatus);
    loadLeads();
  };

  const handleSaveNotes = (leadId: string) => {
    updateLeadStatus(leadId, leads.find((l) => l.id === leadId)?.status || 'nuevo', notesInput);
    setEditingNotesId(null);
    loadLeads();
  };

  // Métricas del embudo de ventas
  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.status === 'ganado').length;
  const lostLeads = leads.filter((l) => l.status === 'perdido').length;
  const inProgressLeads = leads.filter((l) => l.status === 'contactado' || l.status === 'propuesta' || l.status === 'nuevo').length;
  const winRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0';

  const filteredLeads = leads.filter((l) => {
    const matchesStatus = filterStatus === 'all' || (l.status || 'nuevo') === filterStatus;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      l.visitor_name.toLowerCase().includes(term) ||
      (l.company_name && l.company_name.toLowerCase().includes(term)) ||
      (l.phone_number && l.phone_number.includes(term)) ||
      (l.email && l.email.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status?: LeadStatus) => {
    switch (status) {
      case 'ganado':
        return {
          label: 'Venta Ganada',
          bg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
        };
      case 'perdido':
        return {
          label: 'Perdida',
          bg: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800',
          icon: <XCircle className="w-3 h-3 text-red-600" />,
        };
      case 'propuesta':
        return {
          label: 'Cotización Enviada',
          bg: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800',
          icon: <FileCheck className="w-3 h-3 text-blue-600" />,
        };
      case 'contactado':
        return {
          label: 'En Seguimiento',
          bg: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          icon: <Phone className="w-3 h-3 text-amber-600" />,
        };
      default:
        return {
          label: 'Nuevo Prospecto',
          bg: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800',
          icon: <Clock className="w-3 h-3 text-purple-600" />,
        };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-brand-blue" />
          <span>Mi CRM de Prospectos & Métricas de Impacto</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Supervisa el rendimiento de tu tarjeta inteligente NFC y gestiona las ventas capturadas en la calle.
        </p>
      </div>

      {/* 1. Tarjetas KPI de Embudo de Ventas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Prospectos Totales</span>
            <Users className="w-4 h-4 text-brand-blue" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totalLeads}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Capturados en tarjeta</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">En Negociación</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{inProgressLeads}</p>
          <span className="text-[10px] text-amber-600/80 font-semibold mt-1 block">Nuevos & Cotizados</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Ventas Ganadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{wonLeads}</p>
          <span className="text-[10px] text-emerald-500 font-bold mt-1 block">{winRate}% Tasa de Cierre</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Vistas de Tarjeta</span>
            <Eye className="w-4 h-4 text-brand-cyan" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{analytics.views}</p>
          <span className="text-[10px] text-brand-cyan font-semibold mt-1 block">{analytics.vcardDownloads} vCards descargadas</span>
        </div>
      </div>

      {/* 2. Bandeja y Pipeline CRM de Leads */}
      <div className="bg-white dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-4">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-blue" />
              <span>Mis Prospectos & Oportunidades ({leads.length})</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Hazle seguimiento a los clientes que escanearon tu tarjeta en la calle o eventos.
            </p>
          </div>

          {/* Barra de Búsqueda y Exportar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 sm:pt-0">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar prospecto o empresa..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <button
              type="button"
              onClick={exportLeadsCSV}
              disabled={leads.length === 0}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
              title="Descargar en Excel/CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Filtros de Estado */}
        <div className="px-5 pb-2 flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'nuevo', label: 'Nuevos' },
              { id: 'contactado', label: 'En Seguimiento' },
              { id: 'propuesta', label: 'Cotización' },
              { id: 'ganado', label: 'Ganadas' },
              { id: 'perdido', label: 'Perdidas' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFilterStatus(id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                  filterStatus === id
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>


        {filteredLeads.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            No hay prospectos con este filtro. Cuando las personas toquen &quot;Intercambiar Contacto&quot; en tu tarjeta digital, se listarán aquí.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLeads.map((lead) => {
              const badge = getStatusBadge(lead.status);
              const cleanPhone = lead.phone_number.replace(/[^\d]/g, '');

              return (
                <div
                  key={lead.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {lead.visitor_name}
                      </span>
                      {lead.company_name && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          {lead.company_name}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 ml-auto sm:ml-0">
                        <Calendar className="w-3 h-3" />
                        {new Date(lead.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <strong>Interés:</strong> {lead.subject || lead.interest_notes || 'Consulta general'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        <Phone className="w-3 h-3 text-brand-cyan" />
                        {lead.phone_number}
                      </span>
                      {lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {lead.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones del Lead */}
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    {/* Selector de Estado */}
                    <select
                      value={lead.status || 'nuevo'}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                      className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold focus:ring-2 focus:ring-brand-blue outline-none cursor-pointer"
                    >
                      <option value="nuevo">⏳ Nuevo Prospecto</option>
                      <option value="contactado">📞 En Seguimiento</option>
                      <option value="propuesta">📝 Cotización Enviada</option>
                      <option value="ganado">✅ Venta Ganada</option>
                      <option value="perdido">❌ Perdida</option>
                    </select>

                    {/* Botón WhatsApp Directo */}
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                        `Hola ${lead.visitor_name}, te saluda ${card.full_name} de ${card.company_name || 'nuestro equipo'}. Un gusto saludarte respecto a: ${lead.subject || 'tu consulta'}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Botón Llamar */}
                    <a
                      href={`tel:${lead.phone_number}`}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Llamar por teléfono"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
