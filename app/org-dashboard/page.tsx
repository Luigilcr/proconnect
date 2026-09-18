/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * PANEL CORPORATIVO B2B MULTI-EMPRESA (/org-dashboard)
 * Gestión de marca, extracción de colores con IA, tarjetas de colaboradores y exportación masiva QR.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Organization,
  FullCard,
  BrandColors,
  RestaurantTable,
  MenuCategory,
  MenuItem,
  TableOrder,
  OrderStatus,
  WhatsAppLead,
  LeadStatus,
} from '@/lib/types';
import {
  getStoredOrganizations,
  getCardsByOrganizationId,
  saveOrganization,
  toggleCardActiveStatus,
  saveCard,
  getLeadsByOrgId,
  updateLeadStatus,
} from '@/lib/data/card-store';
import {
  getRestaurantTables,
  addRestaurantTable,
  toggleTableStatus,
  getMenuCategories,
  getMenuItems,
  addMenuCategory,
  addMenuItem,
  saveMenuItem,
  getAllOrdersByOrg,
  updateOrderStatus,
  getPaymentInfo,
  savePaymentInfo,
} from '@/lib/data/restaurant-store';
import { BRASA_CRIOLLA_ORG_ID } from '@/lib/data/demo-data';
import { extractPaletteFromImage } from '@/lib/color-extractor';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { QRCodeSVG } from 'qrcode.react';
import {
  Building2,
  Briefcase,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  MessageCircle,
  Phone,
  Mail,
  Sparkles,
  Shield,
  Lock,
  Unlock,
  Users,
  QrCode,
  Download,
  Plus,
  ExternalLink,
  Check,
  TrendingUp,
  Image as ImageIcon,
  Palette,
  Printer,
  RefreshCw,
  UtensilsCrossed,
  Table2,
  ChefHat,
  ClipboardList,
  ToggleLeft,
  ToggleRight,
  Edit3,
  Eye,
} from 'lucide-react';


export default function OrgDashboardPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [cards, setCards] = useState<FullCard[]>([]);
  const [orgLeads, setOrgLeads] = useState<WhatsAppLead[]>([]);
  const [crmFilterSalesperson, setCrmFilterSalesperson] = useState<string>('all');
  const [crmFilterStatus, setCrmFilterStatus] = useState<string>('all');

  const loadOrgLeads = useCallback((orgId: string) => {
    if (orgId) {
      setOrgLeads(getLeadsByOrgId(orgId));
    }
  }, []);

  const [isExtracting, setIsExtracting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showBatchQRModal, setShowBatchQRModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'brand' | 'team' | 'restaurant'>('brand');

  // Formulario de marca
  const [logoInput, setLogoInput] = useState('');
  const [colors, setColors] = useState<BrandColors>({
    primary: '#0EA5E9',
    secondary: '#0369A1',
    accent: '#38BDF8',
    background: '#0F172A',
  });

  // Restaurante
  const [restTables, setRestTables] = useState<RestaurantTable[]>([]);
  const [restCategories, setRestCategories] = useState<MenuCategory[]>([]);
  const [restItems, setRestItems] = useState<MenuItem[]>([]);
  const [restOrders, setRestOrders] = useState<TableOrder[]>([]);
  const [activeRestTab, setActiveRestTab] = useState<'tables' | 'menu' | 'orders'>('tables');
  const [showQRTable, setShowQRTable] = useState<RestaurantTable | null>(null);

  const loadRestaurantData = useCallback(() => {
    const orgId = BRASA_CRIOLLA_ORG_ID;
    setRestTables(getRestaurantTables(orgId));
    setRestCategories(getMenuCategories(orgId));
    setRestItems(getMenuItems(orgId));
    setRestOrders(getAllOrdersByOrg(orgId));
  }, []);

  const loadOrgData = () => {
    const orgs = getStoredOrganizations();
    setOrganizations(orgs);
    if (orgs.length > 0) {
      const currentOrg = orgs.find((o) => o.id === selectedOrgId) || orgs[0];
      setSelectedOrgId(currentOrg.id);
      setLogoInput(currentOrg.logo_url || '');
      setColors(currentOrg.brand_colors);
      const teamCards = getCardsByOrganizationId(currentOrg.id);
      setCards(teamCards);
      loadOrgLeads(currentOrg.id);
    }
  };

  useEffect(() => {
    loadOrgData();
    loadRestaurantData();
  }, [selectedOrgId, loadRestaurantData]);

  const currentOrg =
    organizations.find((o) => o.id === selectedOrgId) || organizations[0];

  // Extraer paleta por análisis de logotipo con IA heurística
  const handleExtractPalette = async () => {
    if (!logoInput.trim()) return;
    setIsExtracting(true);
    try {
      const extracted = await extractPaletteFromImage(logoInput.trim());
      setColors(extracted);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExtracting(false);
    }
  };

  // Guardar configuración de marca de la organización
  const handleSaveBrand = () => {
    if (!currentOrg) return;
    const updated: Organization = {
      ...currentOrg,
      logo_url: logoInput.trim() || null,
      brand_colors: colors,
    };
    saveOrganization(updated);

    // Si Brand Lock está activo, sincronizar los colores y logos a todas las tarjetas del equipo
    if (currentOrg.enforce_brand_lock) {
      cards.forEach((c) => {
        saveCard({
          ...c,
          primary_color: colors.primary,
          secondary_color: colors.secondary,
          accent_color: colors.accent,
          background_color: colors.background,
          logo_url: logoInput.trim() || c.logo_url,
        });
      });
    }

    loadOrgData();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Alternar Brand Lock
  const handleToggleBrandLock = () => {
    if (!currentOrg) return;
    const updated: Organization = {
      ...currentOrg,
      enforce_brand_lock: !currentOrg.enforce_brand_lock,
    };
    saveOrganization(updated);
    loadOrgData();
  };

  // Alternar estado de tarjeta de empleado
  const handleToggleCard = (cardId: string) => {
    toggleCardActiveStatus(cardId);
    loadOrgData();
  };

  // Añadir colaborador rápido
  const handleAddEmployee = () => {
    if (!currentOrg) return;
    const count = cards.length + 1;
    const newEmployeeCard: FullCard = {
      id: 'c_' + Date.now(),
      user_id: 'a0000000-0000-0000-0000-000000000002',
      organization_id: currentOrg.id,
      slug: `colaborador-${count}-${Date.now().toString().slice(-4)}`,
      is_active: true,
      full_name: `Colaborador ${count}`,
      job_title: 'Especialista Corporativo',
      company_name: currentOrg.name,
      bio: `Miembro del equipo profesional en ${currentOrg.name}.`,
      profile_photo_url:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=600',
      cover_photo_url:
        'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1200',
      logo_url: currentOrg.logo_url,
      layout_type: 'banner_header',
      avatar_position: 'header_floating',
      button_style: 'gradient',
      border_radius: 'lg',
      primary_color: currentOrg.brand_colors.primary,
      secondary_color: currentOrg.brand_colors.secondary,
      accent_color: currentOrg.brand_colors.accent,
      background_color: currentOrg.brand_colors.background,
      font_family: currentOrg.font_family,
      font_weight: 'semibold',
      include_photo: true,
      custom_vcf_notes: `Contacto oficial verificado por ${currentOrg.name}.`,
      created_at: new Date().toISOString(),
      links: [
        {
          id: 'l_emp_' + Date.now(),
          card_id: 'c_' + Date.now(),
          type: 'email',
          label: 'Correo de Oficina',
          url: `contacto@${currentOrg.slug}.com`,
          icon_name: 'Mail',
          is_active: true,
          position_order: 1,
        },
      ],
      multimedia: [],
    };

    saveCard(newEmployeeCard);
    loadOrgData();
  };

  const handlePrintBatch = () => {
    window.print();
  };

  if (!currentOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-500">Cargando datos corporativos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Cabecera del Panel B2B */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  Panel Corporativo B2B
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-800">
                  Plan Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Control centralizado de marca, tarjetas de empleados y generación masiva de códigos QR.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Selector de Organización */}
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold shadow-sm"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowBatchQRModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-md flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <QrCode className="w-4 h-4" />
              <span>Exportar Códigos QR en Lote</span>
            </button>
          </div>
        </div>

        {/* 1. Métricas Globales de la Empresa */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Cupo de Tarjetas NFC
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {cards.length}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                / {currentOrg.max_cards} asignadas
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{
                  width: `${Math.min(100, (cards.length / currentOrg.max_cards) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Escaneos Totales del Equipo
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                1,845
              </span>
              <span className="text-xs text-emerald-500 font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +24%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Visitas registradas vía NFC/QR</p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Contactos Guardados (.vcf)
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              438
            </p>
            <p className="text-[11px] text-slate-400 mt-2">vCards descargadas a agendas</p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Leads WhatsApp Capturados
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              96
            </p>
            <p className="text-[11px] text-emerald-500 font-semibold mt-2">
              Leads calificados en bandeja
            </p>
          </div>
        </div>

        {/* 2. Módulo de Marca Corporativa & Extracción de Colores con IA */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-500" />
                <span>Gestión de Marca Corporativa & Extractor de Colores IA</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Define la identidad visual estandarizada para todos los miembros de {currentOrg.name}.
              </p>
            </div>

            {/* Switch Brand Lock */}
            <div className="flex items-center gap-3 p-2 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Brand Lock (Congelar Marca)
                </span>
                <span className="text-[10px] text-slate-500">
                  {currentOrg.enforce_brand_lock
                    ? 'Los empleados no pueden modificar colores ni logo'
                    : 'Permitir a los colaboradores personalizar colores'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleBrandLock}
                className={`p-2 rounded-xl transition-colors ${
                  currentOrg.enforce_brand_lock
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}
                title="Alternar bloqueo de marca"
              >
                {currentOrg.enforce_brand_lock ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Formulario Logotipo y Botón IA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                  URL del Logotipo Corporativo Oficial
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={logoInput}
                    onChange={(e) => setLogoInput(e.target.value)}
                    placeholder="https://tu-empresa.com/logo.png"
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    disabled={isExtracting || !logoInput.trim()}
                    onClick={handleExtractPalette}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-all hover:scale-105"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isExtracting ? 'Analizando...' : 'Extraer Paleta IA'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  El algoritmo analiza los píxeles del logo y calcula una cuádrupla de colores armónica de alto contraste.
                </p>
              </div>

              {/* Previsualización de Logotipo */}
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white p-2 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                  {logoInput ? (
                    <img
                      src={logoInput}
                      alt="Logo de empresa"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    {currentOrg.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Slug: /org/{currentOrg.slug}
                  </p>
                </div>
              </div>
            </div>

            {/* Paleta Extraída / Configurada */}
            <div className="lg:col-span-6 space-y-4">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Paleta Corporativa Estandarizada
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Primario
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colors.primary}
                      onChange={(e) =>
                        setColors({ ...colors, primary: e.target.value })
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={colors.primary}
                      onChange={(e) =>
                        setColors({ ...colors, primary: e.target.value })
                      }
                      className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Secundario
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colors.secondary}
                      onChange={(e) =>
                        setColors({ ...colors, secondary: e.target.value })
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={colors.secondary}
                      onChange={(e) =>
                        setColors({ ...colors, secondary: e.target.value })
                      }
                      className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Acento
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colors.accent}
                      onChange={(e) =>
                        setColors({ ...colors, accent: e.target.value })
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={colors.accent}
                      onChange={(e) =>
                        setColors({ ...colors, accent: e.target.value })
                      }
                      className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Fondo
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colors.background}
                      onChange={(e) =>
                        setColors({ ...colors, background: e.target.value })
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={colors.background}
                      onChange={(e) =>
                        setColors({ ...colors, background: e.target.value })
                      }
                      className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Botón Guardar Cambios de Marca */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveBrand}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>¡Marca Sincronizada con Éxito!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Aplicar a Toda la Empresa</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Gestión de Tarjetas de Colaboradores del Equipo */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                <span>Tarjetas del Equipo ({cards.length})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Colaboradores con credencial inteligente activa en {currentOrg.name}.
              </p>
            </div>

            <button
              onClick={handleAddEmployee}
              disabled={cards.length >= currentOrg.max_cards}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Colaborador</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Colaborador / Puesto</th>
                  <th className="px-5 py-3.5">Enlace Público</th>
                  <th className="px-5 py-3.5">Layout Asignado</th>
                  <th className="px-5 py-3.5 text-center">Estado Tarjeta</th>
                  <th className="px-5 py-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cards.map((card) => (
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
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">
                            {card.full_name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {card.job_title}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-[11px] text-sky-600 dark:text-sky-400">
                      /c/{card.slug}
                    </td>

                    <td className="px-5 py-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold font-mono text-[10px]">
                        {card.layout_type || 'modern'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleCard(card.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          card.is_active
                            ? 'bg-emerald-500'
                            : 'bg-slate-300 dark:bg-slate-700'
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
                      <a
                        href={`/c/${card.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 font-semibold hover:bg-purple-100 transition-colors"
                      >
                        <span>Ver Perfil</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Importación Masiva de Colaboradores por CSV */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📥</span>
              <span>Importación Masiva de Colaboradores (CSV)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Carga un archivo CSV con columnas: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">nombre,cargo,email,telefono</code>. Se creará una tarjeta por fila.
            </p>
          </div>

          <div className="p-5 space-y-4">
            {/* Zona de upload CSV */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label
                htmlFor="csv-upload"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-400 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                <span>📂</span>
                <span>Seleccionar archivo CSV / Excel</span>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file || !currentOrg) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const text = ev.target?.result as string;
                      const lines = text.trim().split(/\r?\n/);
                      const header = lines[0].toLowerCase();
                      const startIdx = header.includes('nombre') || header.includes('name') ? 1 : 0;
                      let created = 0;
                      lines.slice(startIdx).forEach((line, idx) => {
                        const cols = line.split(/,|;|\t/);
                        const name = cols[0]?.trim();
                        if (!name) return;
                        const title = cols[1]?.trim() || 'Colaborador';
                        const email = cols[2]?.trim() || '';
                        const phone = cols[3]?.trim() || '';
                        const slug = `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now().toString().slice(-4)}-${idx}`;
                        const card: FullCard = {
                          id: 'c_csv_' + Date.now() + '_' + idx,
                          user_id: 'a0000000-0000-0000-0000-000000000002',
                          organization_id: currentOrg.id,
                          slug,
                          is_active: true,
                          full_name: name,
                          job_title: title,
                          company_name: currentOrg.name,
                          bio: `Miembro del equipo profesional en ${currentOrg.name}.`,
                          profile_photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=600',
                          cover_photo_url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1200',
                          logo_url: currentOrg.logo_url,
                          layout_type: 'banner_header',
                          avatar_position: 'header_floating',
                          button_style: 'gradient',
                          border_radius: 'lg',
                          primary_color: currentOrg.brand_colors.primary,
                          secondary_color: currentOrg.brand_colors.secondary,
                          accent_color: currentOrg.brand_colors.accent,
                          background_color: currentOrg.brand_colors.background,
                          font_family: currentOrg.font_family,
                          font_weight: 'semibold',
                          include_photo: true,
                          custom_vcf_notes: `Contacto verificado por ${currentOrg.name}.`,
                          created_at: new Date().toISOString(),
                          links: [
                            ...(email ? [{ id: 'l_csv_e_' + idx, card_id: 'c_csv_' + idx, type: 'email' as const, label: 'Correo', url: `mailto:${email}`, icon_name: 'Mail', is_active: true, position_order: 0 }] : []),
                            ...(phone ? [{ id: 'l_csv_p_' + idx, card_id: 'c_csv_' + idx, type: 'phone' as const, label: 'Teléfono', url: `tel:${phone}`, icon_name: 'Phone', is_active: true, position_order: 1 }] : []),
                          ],
                          multimedia: [],
                        };
                        saveCard(card);
                        created++;
                      });
                      alert(`✅ ${created} tarjeta(s) importada(s) correctamente desde CSV.`);
                      loadOrgData();
                      e.target.value = '';
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>

              <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                <p className="font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Formato esperado:</p>
                <code className="block font-mono bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-[10px]">
                  nombre,cargo,email,telefono<br />
                  Ana García,Directora,ana@empresa.com,+34600000000<br />
                  Carlos López,Gerente,carlos@empresa.com,
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Generador de Firma de Email Corporativa */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>✉️</span>
              <span>Generador de Firma de Email Corporativa</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Genera una firma HTML lista para copiar y pegar en Gmail, Outlook u otro cliente de correo.
            </p>
          </div>

          <div className="p-5 space-y-4">
            {cards.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                No hay colaboradores registrados. Añade tarjetas para generar firmas.
              </p>
            ) : (
              cards.map((card) => {
                const profileUrl = typeof window !== 'undefined'
                  ? `${window.location.origin}/c/${card.slug}`
                  : `https://proconnect.app/c/${card.slug}`;
                const emailLink = card.links?.find((l) => l.type === 'email');
                const phoneLink = card.links?.find((l) => l.type === 'phone');

                const signatureHtml = `<!-- ProConnect Email Signature — ${card.full_name} -->
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:13px;color:#334155;max-width:480px;border-collapse:collapse;">
  <tr>
    <td style="padding-right:16px;vertical-align:top;border-right:3px solid ${currentOrg.brand_colors.primary};">
      <img src="${card.profile_photo_url || ''}" alt="${card.full_name}" width="72" height="72" style="border-radius:50%;object-fit:cover;display:block;" />
    </td>
    <td style="padding-left:16px;vertical-align:top;">
      <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#0f172a;">${card.full_name}</p>
      <p style="margin:0 0 2px;font-size:12px;color:#64748b;">${card.job_title || ''}</p>
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:${currentOrg.brand_colors.primary};">${card.company_name || currentOrg.name}</p>
      ${emailLink ? `<p style="margin:0 0 2px;font-size:12px;"><a href="${emailLink.url}" style="color:#0ea5e9;text-decoration:none;">📧 ${emailLink.url.replace('mailto:', '')}</a></p>` : ''}
      ${phoneLink ? `<p style="margin:0 0 2px;font-size:12px;"><a href="${phoneLink.url}" style="color:#0ea5e9;text-decoration:none;">📱 ${phoneLink.url.replace('tel:', '')}</a></p>` : ''}
      <p style="margin:8px 0 0;font-size:11px;"><a href="${profileUrl}" style="color:${currentOrg.brand_colors.primary};font-weight:600;text-decoration:none;">🔗 Ver mi Tarjeta Digital ProConnect →</a></p>
      ${currentOrg.logo_url ? `<p style="margin:8px 0 0;"><img src="${currentOrg.logo_url}" alt="${currentOrg.name}" height="28" style="max-height:28px;object-fit:contain;" /></p>` : ''}
    </td>
  </tr>
</table>`.trim();

                return (
                  <div key={card.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={card.profile_photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                          alt={card.full_name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{card.full_name}</p>
                          <p className="text-[10px] text-slate-500">{card.job_title}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(signatureHtml).then(() => {
                            alert(`✅ Firma de ${card.full_name} copiada al portapapeles. Pégala en tu cliente de email en modo HTML.`);
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Copiar HTML</span>
                      </button>
                    </div>

                    {/* Vista previa de la firma */}
                    <div
                      className="p-4 bg-white"
                      dangerouslySetInnerHTML={{ __html: signatureHtml }}
                    />
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* MODAL DE EXPORTACIÓN EN LOTE DE CÓDIGOS QR */}
      {showBatchQRModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowBatchQRModal(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Hoja de Códigos QR Corporativos - {currentOrg.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Listo para imprimir en pliego adhesivo o programar en chips NFC físicos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintBatch}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Hoja</span>
                </button>
                <button
                  onClick={() => setShowBatchQRModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Grid de Códigos QR para Imprimir */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 print:grid-cols-3">
              {cards.map((c) => {
                const url = typeof window !== 'undefined'
                  ? `${window.location.origin}/c/${c.slug}`
                  : `https://proconnect.app/c/${c.slug}`;

                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center flex flex-col items-center justify-between"
                  >
                    <div className="p-2 bg-white rounded-xl shadow-inner mb-2">
                      <QRCodeSVG value={url} size={110} level="M" includeMargin={true} />
                    </div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[140px]">
                      {c.full_name}
                    </h5>
                    <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                      {c.job_title}
                    </p>
                    <span className="text-[9px] font-mono text-purple-500 mt-1">
                      /c/{c.slug}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      
        {/* ════════════════════════════════════════════════════════════
            MÓDULO CRM CORPORATIVO — GESTIÓN DE LEADS & EQUIPO DE VENTAS
        ════════════════════════════════════════════════════════════ */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-6">
          {/* Header CRM */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    CRM Corporativo & Embudo de Ventas
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Equipo Comercial
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Prospectos recolectados en la calle por tus asesores mediante tarjetas inteligentes NFC.
                </p>
              </div>
            </div>

            {/* Exportar a CSV */}
            <button
              type="button"
              onClick={() => {
                const headers = ['Nombre', 'Empresa', 'Telefono', 'Correo', 'Asesor_Comercial', 'Estado', 'Interes_Notas', 'Fecha'];
                const rows = orgLeads.map((l) => [
                  `"${l.visitor_name}"`,
                  `"${l.company_name || ''}"`,
                  `"${l.phone_number}"`,
                  `"${l.email || ''}"`,
                  `"${l.salesperson_name || 'Asesor'}"`,
                  `"${l.status || 'nuevo'}"`,
                  `"${(l.subject || l.interest_notes || '').replace(/"/g, '""')}"`,
                  `"${new Date(l.created_at).toLocaleDateString('es-ES')}"`,
                ]);
                const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
                const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `leads_${currentOrg.slug || 'empresa'}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 self-start sm:self-auto transition-all hover:scale-105"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar a Excel / CSV ({orgLeads.length})</span>
            </button>
          </div>

          {/* Métricas Globales de Conversión de la Empresa */}
          {(() => {
            const total = orgLeads.length;
            const won = orgLeads.filter((l) => l.status === 'ganado').length;
            const lost = orgLeads.filter((l) => l.status === 'perdido').length;
            const inProgress = orgLeads.filter((l) => l.status === 'contactado' || l.status === 'propuesta' || l.status === 'nuevo').length;
            const winRate = total > 0 ? ((won / total) * 100).toFixed(1) : '0.0';

            return (
              <div className="px-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500">Leads Capturados</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{total}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Por todo el equipo</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">En Negociación</span>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{inProgress}</p>
                  <span className="text-[10px] text-amber-600/80 mt-1 block">Contactados / Cotizados</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Ventas Ganadas</span>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{won}</p>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 block">{winRate}% Tasa de Cierre</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-red-500">Oportunidades Perdidas</span>
                  <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{lost}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Requiere seguimiento</span>
                </div>
              </div>
            );
          })()}

          {/* Tabla de Rendimiento por Asesor Comercial */}
          <div className="px-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brand-blue" />
              <span>Rendimiento del Equipo Comercial</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {cards.map((c) => {
                const sellerLeads = orgLeads.filter((l) => l.card_id === c.id || l.salesperson_name === c.full_name);
                const sellerWon = sellerLeads.filter((l) => l.status === 'ganado').length;
                const sellerRate = sellerLeads.length > 0 ? Math.round((sellerWon / sellerLeads.length) * 100) : 0;

                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center gap-3"
                  >
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                      {c.profile_photo_url ? (
                        <img src={c.profile_photo_url} alt={c.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                          {c.full_name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{c.full_name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{c.job_title || 'Asesor Comercial'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-black text-brand-blue">{sellerLeads.length} leads</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                          {sellerWon} ganadas ({sellerRate}%)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabla de Prospectos con Filtros */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
            <div className="px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Detalle de Prospectos ({orgLeads.length})
              </h4>

              {/* Filtros de Vendedor y Estado */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={crmFilterSalesperson}
                  onChange={(e) => setCrmFilterSalesperson(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  <option value="all">Todos los Vendedores</option>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>

                <select
                  value={crmFilterStatus}
                  onChange={(e) => setCrmFilterStatus(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="nuevo">Nuevos</option>
                  <option value="contactado">En Seguimiento</option>
                  <option value="propuesta">Cotizaciones</option>
                  <option value="ganado">Ganadas</option>
                  <option value="perdido">Perdidas</option>
                </select>
              </div>
            </div>

            {/* Listado de Prospectos */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Prospecto / Empresa</th>
                    <th className="px-6 py-3">Asesor Responsable</th>
                    <th className="px-6 py-3">Interés / Solicitud</th>
                    <th className="px-6 py-3">Contacto</th>
                    <th className="px-6 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orgLeads
                    .filter((l) => {
                      if (crmFilterSalesperson !== 'all' && l.card_id !== crmFilterSalesperson) return false;
                      if (crmFilterStatus !== 'all' && (l.status || 'nuevo') !== crmFilterStatus) return false;
                      return true;
                    })
                    .map((lead) => {
                      const cleanPhone = lead.phone_number.replace(/[^\d]/g, '');
                      return (
                        <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{lead.visitor_name}</p>
                            {lead.company_name && (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3 text-brand-blue" />
                                {lead.company_name}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                            {lead.salesperson_name || 'Asesor de ventas'}
                          </td>
                          <td className="px-6 py-4 max-w-xs text-slate-600 dark:text-slate-300 text-xs">
                            {lead.subject || lead.interest_notes || 'Consulta comercial'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 transition-colors"
                                title="WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                              <span className="font-mono text-[11px]">{lead.phone_number}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={lead.status || 'nuevo'}
                              onChange={(e) => {
                                updateLeadStatus(lead.id, e.target.value as LeadStatus);
                                loadOrgLeads(currentOrg.id);
                              }}
                              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold outline-none"
                            >
                              <option value="nuevo">⏳ Nuevo</option>
                              <option value="contactado">📞 En Seguimiento</option>
                              <option value="propuesta">📝 Cotización</option>
                              <option value="ganado">✅ Ganada</option>
                              <option value="perdido">❌ Perdida</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      {/* ════════════════════════════════════════════════════════════
          MÓDULO GASTRO — PANEL DE RESTAURANTE
      ════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200/60 dark:border-amber-900/30 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-white text-lg">ProConnect Gastro</h2>
                  <p className="text-amber-100 text-xs font-medium">Brasa Criolla — Mesas Inteligentes NFC</p>
                </div>
              </div>
              <a href="/r/brasa-criolla?mesa=1" target="_blank"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition-colors">
                <Eye className="w-3.5 h-3.5" /><span>Vista Comensal</span>
              </a>
            </div>

            {/* Subtabs */}
            <div className="flex gap-2 mt-4">
              {([
                { id: 'tables', icon: <Table2 className="w-4 h-4" />, label: 'Mesas & QR' },
                { id: 'menu', icon: <ChefHat className="w-4 h-4" />, label: 'Menú' },
                { id: 'orders', icon: <ClipboardList className="w-4 h-4" />, label: 'Comandas en Vivo' },
              ] as const).map(({ id, icon, label }) => (
                <button key={id} onClick={() => setActiveRestTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeRestTab === id ? 'bg-white text-amber-600 shadow-sm' : 'text-white hover:bg-white/20'
                  }`}>
                  {icon}<span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── MESAS & QR ── */}
          {activeRestTab === 'tables' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {restTables.length} mesas configuradas
                </p>
                <button
                  onClick={() => { addRestaurantTable(BRASA_CRIOLLA_ORG_ID, 'brasa-criolla'); loadRestaurantData(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-colors">
                  <Plus className="w-3.5 h-3.5" /><span>Nueva Mesa</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {restTables.map((table) => {
                  const qrUrl = typeof window !== 'undefined'
                    ? `${window.location.origin}/r/${table.slug}?mesa=${table.table_number}`
                    : `https://proconnect.app/r/${table.slug}?mesa=${table.table_number}`;
                  return (
                    <div key={table.id}
                      className={`p-4 rounded-2xl border-2 text-center flex flex-col items-center gap-2 transition-all ${
                        table.is_active ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50 opacity-60'
                      }`}>
                      <div className="p-2 bg-white rounded-xl shadow-inner">
                        <QRCodeSVG value={qrUrl} size={90} level="M" includeMargin />
                      </div>
                      <div className="w-full">
                        <p className="font-black text-slate-900 text-xs">{table.name}</p>
                        <p className="text-[10px] text-slate-500">{table.capacity} personas</p>
                      </div>
                      <div className="flex gap-1 w-full">
                        <button
                          onClick={() => { toggleTableStatus(table.id); loadRestaurantData(); }}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                            table.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}>
                          {table.is_active ? 'Activa' : 'Inactiva'}
                        </button>
                        <a href={qrUrl} target="_blank"
                          className="px-2 py-1 rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── MENÚ ── */}
          {activeRestTab === 'menu' && (
            <div className="p-6 space-y-5">
              {restCategories.map((cat) => {
                const catItems = restItems.filter((i) => i.category_id === cat.id);
                return (
                  <div key={cat.id} className="space-y-2">
                    <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                      <span>{cat.icon}</span>{cat.name}
                      <span className="text-xs font-normal text-slate-400">({catItems.length} platos)</span>
                    </h3>
                    <div className="space-y-2">
                      {catItems.map((item) => (
                        <div key={item.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                          {item.image_url && (
                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200">
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{item.name}</p>
                            {item.description && <p className="text-xs text-slate-500 truncate">{item.description}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-black text-amber-600 text-sm">${item.price.toFixed(2)}</span>
                            <button
                              onClick={() => {
                                const updated = { ...item, status: (item.status === 'available' ? 'unavailable' : 'available') as any };
                                saveMenuItem(updated); loadRestaurantData();
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                                item.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                              }`}>
                              {item.status === 'available' ? 'Disponible' : 'No disponible'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── COMANDAS EN VIVO ── */}
          {activeRestTab === 'orders' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {restOrders.filter((o) => o.status !== 'paid' && o.status !== 'cancelled').length} órdenes activas
                </p>
                <button onClick={loadRestaurantData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /><span>Actualizar</span>
                </button>
              </div>

              {restOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No hay comandas activas</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {restOrders.map((order) => {
                    const statusColors: Record<string, string> = {
                      pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
                      preparing: 'bg-blue-100 text-blue-700 border-blue-200',
                      ready:     'bg-emerald-100 text-emerald-700 border-emerald-200',
                      delivered: 'bg-purple-100 text-purple-700 border-purple-200',
                      paid:      'bg-slate-100 text-slate-500 border-slate-200',
                      cancelled: 'bg-red-100 text-red-600 border-red-200',
                    };
                    const statusLabels: Record<string, string> = {
                      pending: '⏳ Pendiente', preparing: '👨‍🍳 Preparando',
                      ready: '✅ Listo', delivered: '🍽️ Entregado',
                      paid: '💳 Pagado', cancelled: '❌ Cancelado',
                    };
                    const nextStatus: Record<string, OrderStatus | null> = {
                      pending: 'preparing', preparing: 'ready', ready: 'delivered',
                      delivered: 'paid', paid: null, cancelled: null,
                    };
                    const nextLabel: Record<string, string> = {
                      pending: 'Iniciar', preparing: 'Listo', ready: 'Entregado',
                      delivered: 'Cobrado', paid: '', cancelled: '',
                    };
                    return (
                      <div key={order.id}
                        className={`rounded-2xl border-2 p-4 space-y-3 ${statusColors[order.status] || 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center justify-between">
                          <p className="font-black text-slate-900 text-sm">{order.table_name}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[order.status]}`}>
                            {statusLabels[order.status]}
                          </span>
                        </div>

                        {order.waiter_called && (
                          <div className="text-xs font-bold text-amber-700 bg-amber-100 rounded-lg px-2 py-1 flex items-center gap-1">
                            🔔 Mesero solicitado
                          </div>
                        )}

                        <div className="space-y-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs text-slate-700">
                              <span>{item.qty}x {item.name}</span>
                              <span>${item.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="border-t border-current/20 pt-1 flex justify-between font-black text-sm">
                            <span>Total</span><span>${order.total.toFixed(2)}</span>
                          </div>
                        </div>

                        {nextStatus[order.status] && (
                          <button
                            onClick={() => { updateOrderStatus(order.id, nextStatus[order.status]!); loadRestaurantData(); }}
                            className="w-full py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors">
                            → {nextLabel[order.status]}
                          </button>
                        )}

                        <p className="text-[10px] text-slate-400">
                          {new Date(order.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
