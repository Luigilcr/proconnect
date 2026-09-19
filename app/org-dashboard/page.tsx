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
  RestaurantKPIs,
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
  addLeadActivityNote,
  deleteLead,
  updateUserRole,
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
  assignWaiterToTable,
  dismissWaiterCall,
  dismissBillRequest,
  updateOrderPrepStatus,
  reviewPaymentReceipt,
  getRestaurantKPIs,
} from '@/lib/data/restaurant-store';
import { BRASA_CRIOLLA_ORG_ID } from '@/lib/data/demo-data';
import { extractPaletteFromImage } from '@/lib/color-extractor';
import { compressImage } from '@/lib/image-compressor';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { QRCodeSVG } from 'qrcode.react';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { isSuperAdminEmail } from '@/lib/db-normalize';
import { useInactivityTimeout } from '@/lib/useInactivityTimeout';
import { BatchPrintModal } from '@/components/org/BatchPrintModal';
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
  Loader2,
  Upload,
  StickyNote,
  Trash2,
  X,
  BellRing,
  Receipt,
  Star,
  AlertCircle,
  ChevronRight,
  User,
  Trophy,
  BarChart3,
  ArrowRightLeft,
  Globe,
  Search,
} from 'lucide-react';

export type B2BTab = 'overview' | 'team' | 'import' | 'brand' | 'crm' | 'directory' | 'print' | 'restaurant';

export default function OrgDashboardPage() {
  useInactivityTimeout(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [cards, setCards] = useState<FullCard[]>([]);
  const [orgLeads, setOrgLeads] = useState<WhatsAppLead[]>([]);
  const [crmFilterSalesperson, setCrmFilterSalesperson] = useState<string>('all');
  const [crmFilterStatus, setCrmFilterStatus] = useState<string>('all');
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Estados de Crear Empresa Modal
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newOrgLogo, setNewOrgLogo] = useState('');
  const [newOrgPrimaryColor, setNewOrgPrimaryColor] = useState('#0EA5E9');
  const [newOrgSecondaryColor, setNewOrgSecondaryColor] = useState('#0369A1');
  const [newOrgAccentColor, setNewOrgAccentColor] = useState('#38BDF8');
  const [newOrgBgColor, setNewOrgBgColor] = useState('#0F172A');
  const [newOrgMaxCards, setNewOrgMaxCards] = useState(10);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Estados de Añadir Colaborador Modal
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empTitle, setEmpTitle] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [isCreatingEmp, setIsCreatingEmp] = useState(false);

  const [isExtracting, setIsExtracting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showBatchQRModal, setShowBatchQRModal] = useState(false);
  const [activeTab, setActiveTab] = useState<B2BTab>('overview');

  // Redirección inteligente de tarjeta por baja laboral
  const [redirectingCard, setRedirectingCard] = useState<FullCard | null>(null);
  const [redirectTarget, setRedirectTarget] = useState('');
  const [isSavingRedirect, setIsSavingRedirect] = useState(false);

  // Búsqueda en equipo
  const [teamSearch, setTeamSearch] = useState('');

  // CSV
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<{ count: number; message: string } | null>(null);

  // Formulario de marca y datos corporativos
  const [logoInput, setLogoInput] = useState('');
  const [orgDescInput, setOrgDescInput] = useState('');
  const [orgDisclaimerInput, setOrgDisclaimerInput] = useState('');
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
  const [restKPIs, setRestKPIs] = useState<RestaurantKPIs | null>(null);
  const [activeRestTab, setActiveRestTab] = useState<'orders' | 'tables' | 'menu' | 'kpis'>('orders');
  const [showQRTable, setShowQRTable] = useState<RestaurantTable | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<TableOrder | null>(null);
  const [editingWaiterTableId, setEditingWaiterTableId] = useState<string | null>(null);
  const [waiterInputName, setWaiterInputName] = useState('');

  const loadRestaurantData = useCallback(() => {
    const orgId = BRASA_CRIOLLA_ORG_ID;
    setRestTables(getRestaurantTables(orgId));
    setRestCategories(getMenuCategories(orgId));
    setRestItems(getMenuItems(orgId));
    setRestOrders(getAllOrdersByOrg(orgId));
    setRestKPIs(getRestaurantKPIs(orgId));
  }, []);

  const loadOrgLeads = useCallback(async (orgId: string) => {
    if (!orgId) return;
    if (isSupabaseEnabled && supabase) {
      try {
        const { data: dbCards } = await supabase
          .from('cards')
          .select('id')
          .eq('organization_id', orgId);
        if (dbCards && dbCards.length > 0) {
          const cardIds = dbCards.map((c: any) => c.id);
          const { data: dbLeads } = await supabase
            .from('whatsapp_leads')
            .select('*')
            .in('card_id', cardIds)
            .order('created_at', { ascending: false });
          if (dbLeads) {
            setOrgLeads(dbLeads);
            return;
          }
        }
      } catch (err) {
        console.warn('Error loading leads in org-dashboard:', err);
      }
    }
    setOrgLeads(getLeadsByOrgId(orgId));
  }, []);

  const handleUpdateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    if (isSupabaseEnabled && supabase) {
      try {
        await supabase
          .from('whatsapp_leads')
          .update({ status: newStatus })
          .eq('id', leadId);
      } catch (err) {
        console.warn('Error updating lead status in Supabase:', err);
      }
    }
    updateLeadStatus(leadId, newStatus);
    setOrgLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
  };

  const isOrgAdmin = Boolean(
    !currentUser ||
    currentUser?.role === 'superadmin' ||
    currentUser?.role === 'org_admin' ||
    isSuperAdminEmail(currentUser?.email)
  );

  const [activeLeadForNotes, setActiveLeadForNotes] = useState<WhatsAppLead | null>(null);
  const [leadNoteText, setLeadNoteText] = useState('');

  const handleAddLeadNote = async (leadId: string) => {
    if (!leadNoteText.trim()) return;
    const authorName = currentUser?.user_metadata?.full_name || currentUser?.full_name || currentUser?.email || 'Administrador';
    const authorRole = isOrgAdmin ? 'Administrador' : 'Asesor Comercial';
    const text = leadNoteText.trim();

    const updated = addLeadActivityNote(leadId, authorName, authorRole, text);
    if (updated) {
      setOrgLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      if (activeLeadForNotes?.id === leadId) {
        setActiveLeadForNotes(updated);
      }
    }

    if (isSupabaseEnabled && supabase) {
      try {
        const targetLead = orgLeads.find((l) => l.id === leadId);
        const currentNotes = targetLead?.activity_notes || [];
        const newNoteObj = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'note_' + Date.now(),
          author_name: authorName,
          author_role: authorRole,
          text,
          created_at: new Date().toISOString(),
        };
        await supabase
          .from('whatsapp_leads')
          .update({ activity_notes: [...currentNotes, newNoteObj] })
          .eq('id', leadId);
      } catch (err) {
        console.warn('Error guardando nota de lead en Supabase:', err);
      }
    }
    setLeadNoteText('');
  };

  const handleDeleteLead = async (leadId: string, visitorName: string) => {
    if (!isOrgAdmin) {
      alert('Solo los administradores de la empresa tienen permiso para eliminar prospectos del CRM.');
      return;
    }
    if (!window.confirm(`¿Confirmas la eliminación definitiva del prospecto "${visitorName}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    deleteLead(leadId);
    setOrgLeads((prev) => prev.filter((l) => l.id !== leadId));
    if (activeLeadForNotes?.id === leadId) {
      setActiveLeadForNotes(null);
    }
    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('whatsapp_leads').delete().eq('id', leadId);
      } catch (err) {
        console.warn('Error eliminando lead en Supabase:', err);
      }
    }
  };

  const loadOrgData = useCallback(async () => {
    setLoadingData(true);
    let userSession: any = null;
    let userRole = 'client';
    let userOrgId: string | null = null;

    if (isSupabaseEnabled && supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        userSession = sessionData?.session?.user || null;
        if (userSession) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', userSession.id)
            .maybeSingle();

          if (userProfile) {
            userRole = userProfile.role || (isSuperAdminEmail(userSession.email) ? 'superadmin' : 'client');
            userOrgId = userProfile.organization_id || null;
            setCurrentUser({ ...userSession, ...userProfile, role: userRole });
          } else {
            setCurrentUser(userSession);
          }
        }
      } catch (err) {
        console.warn('Error checking session in org dashboard:', err);
      }
    }

    let loadedOrgs: Organization[] = [];

    // 1. Cargar desde Supabase
    if (isSupabaseEnabled && supabase) {
      try {
        let query = supabase.from('organizations').select('*');
        // Si no es superadmin, filtrar por su org asignada si tiene una
        if (userRole !== 'superadmin' && !isSuperAdminEmail(userSession?.email)) {
          if (userOrgId) {
            query = query.eq('id', userOrgId);
          }
        }
        const { data: sbOrgs, error } = await query.order('created_at', { ascending: false });
        if (!error && sbOrgs && sbOrgs.length > 0) {
          loadedOrgs = sbOrgs;
        }
      } catch (err) {
        console.warn('Error fetching orgs from Supabase:', err);
      }
    }

    // 2. Fallback a datos locales si Supabase está vacío o offline
    if (loadedOrgs.length === 0) {
      loadedOrgs = getStoredOrganizations();
    }

    setOrganizations(loadedOrgs);

    if (loadedOrgs.length > 0) {
      const active = loadedOrgs.find((o) => o.id === selectedOrgId) || loadedOrgs[0];
      setSelectedOrgId(active.id);
      setLogoInput(active.logo_url || '');
      setOrgDescInput(active.description || '');
      setOrgDisclaimerInput(active.legal_disclaimer || '');
      setColors(active.brand_colors || {
        primary: '#0EA5E9',
        secondary: '#0369A1',
        accent: '#38BDF8',
        background: '#0F172A',
      });

      // Cargar tarjetas del equipo
      if (isSupabaseEnabled && supabase) {
        try {
          const { data: dbCards, error: cErr } = await supabase
            .from('cards')
            .select('*, links:card_links(*)')
            .eq('organization_id', active.id);

          if (!cErr && dbCards && dbCards.length > 0) {
            setCards(dbCards);
            const cardIds = dbCards.map((c: any) => c.id);
            if (cardIds.length > 0) {
              const { data: dbLeads } = await supabase
                .from('whatsapp_leads')
                .select('*')
                .in('card_id', cardIds)
                .order('created_at', { ascending: false });
              if (dbLeads) {
                setOrgLeads(dbLeads);
              } else {
                setOrgLeads(getLeadsByOrgId(active.id));
              }
            } else {
              setOrgLeads([]);
            }
          } else {
            const teamCards = getCardsByOrganizationId(active.id);
            setCards(teamCards);
            setOrgLeads(getLeadsByOrgId(active.id));
          }
        } catch {
          const teamCards = getCardsByOrganizationId(active.id);
          setCards(teamCards);
          setOrgLeads(getLeadsByOrgId(active.id));
        }
      } else {
        const teamCards = getCardsByOrganizationId(active.id);
        setCards(teamCards);
        setOrgLeads(getLeadsByOrgId(active.id));
      }
    } else {
      setCards([]);
      setOrgLeads([]);
    }
    setLoadingData(false);
  }, [selectedOrgId]);

  useEffect(() => {
    loadOrgData();
    loadRestaurantData();
  }, [loadOrgData, loadRestaurantData]);

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

  // Subir logotipo a través de la API
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isForNewOrg = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const optimized = await compressImage(file, { maxWidth: 500, maxHeight: 500, quality: 0.85 });
      const formData = new FormData();
      formData.append('file', optimized);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        if (isForNewOrg) {
          setNewOrgLogo(data.url);
        } else {
          setLogoInput(data.url);
        }
      } else {
        alert('Error al subir logotipo: ' + (data.error || 'Revisa el archivo'));
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
    } finally {
      setUploadingLogo(false);
    }
  };

  // Guardar configuración de marca de la organización
  const handleSaveBrand = async () => {
    if (!currentOrg) return;
    const updated: Organization = {
      ...currentOrg,
      logo_url: logoInput.trim() || null,
      brand_colors: colors,
      description: orgDescInput.trim() || null,
      legal_disclaimer: orgDisclaimerInput.trim() || null,
    };

    // 1. Supabase
    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('organizations').update({
          logo_url: updated.logo_url,
          brand_colors: updated.brand_colors,
          description: updated.description,
          legal_disclaimer: updated.legal_disclaimer,
        }).eq('id', currentOrg.id);

        if (currentOrg.enforce_brand_lock) {
          await supabase.from('cards').update({
            primary_color: colors.primary,
            secondary_color: colors.secondary,
            accent_color: colors.accent,
            background_color: colors.background,
            logo_url: updated.logo_url,
          }).eq('organization_id', currentOrg.id);
        }
      } catch (err) {
        console.warn('Error actualizando marca en Supabase:', err);
      }
    }

    // 2. Almacén local
    saveOrganization(updated);

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

    await loadOrgData();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Guardar redirección inteligente de tarjeta por baja laboral
  const handleSaveCardRedirect = async () => {
    if (!redirectingCard) return;
    setIsSavingRedirect(true);
    const target = redirectTarget.trim();

    if (isSupabaseEnabled && supabase) {
      try {
        await supabase
          .from('cards')
          .update({ redirect_to_slug: target || null })
          .eq('id', redirectingCard.id);
      } catch (err) {
        console.warn('Error guardando redirección en Supabase:', err);
      }
    }

    const updatedCard: FullCard = {
      ...redirectingCard,
      redirect_to_slug: target || null,
    };
    saveCard(updatedCard);
    setCards((prev) => prev.map((c) => (c.id === redirectingCard.id ? updatedCard : c)));
    setRedirectingCard(null);
    setRedirectTarget('');
    setIsSavingRedirect(false);
  };

  // Importación masiva por archivo CSV
  const handleCsvBatchImport = async (file: File) => {
    if (!file || !currentOrg) return;
    setCsvUploading(true);
    setCsvResult(null);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length === 0) {
          alert('El archivo CSV está vacío.');
          setCsvUploading(false);
          return;
        }

        const header = lines[0].toLowerCase();
        const startIdx = header.includes('nombre') || header.includes('name') ? 1 : 0;
        const rows = lines.slice(startIdx);

        let uid = 'a0000000-0000-0000-0000-000000000002';
        if (isSupabaseEnabled && supabase) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user?.id) {
            uid = sessionData.session.user.id;
          }
        }

        const newCards: FullCard[] = [];
        const newCardRowsForSupabase: any[] = [];
        const newLinksForSupabase: any[] = [];

        rows.forEach((line, idx) => {
          const cols = line.split(/,|;|\t/);
          const name = cols[0]?.trim();
          if (!name) return;

          const title = cols[1]?.trim() || 'Colaborador';
          const email = cols[2]?.trim() || '';
          const phone = cols[3]?.trim() || '';
          const dept = cols[4]?.trim() || '';

          const cardId = crypto.randomUUID();
          const slugBase = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          const slug = `${slugBase}-${Date.now().toString().slice(-4)}-${idx + 1}`;

          const links: any[] = [];
          if (email) {
            const emailLink = {
              id: crypto.randomUUID(),
              card_id: cardId,
              type: 'email' as const,
              label: 'Correo Electrónico',
              url: `mailto:${email}`,
              icon_name: 'Mail',
              is_active: true,
              position_order: 0,
            };
            links.push(emailLink);
            newLinksForSupabase.push(emailLink);
          }
          if (phone) {
            const phoneLink = {
              id: crypto.randomUUID(),
              card_id: cardId,
              type: 'phone' as const,
              label: 'Teléfono Directo',
              url: `tel:${phone}`,
              icon_name: 'Phone',
              is_active: true,
              position_order: 1,
            };
            links.push(phoneLink);
            newLinksForSupabase.push(phoneLink);
          }

          const card: FullCard = {
            id: cardId,
            user_id: uid,
            organization_id: currentOrg.id,
            slug,
            is_active: true,
            full_name: name,
            job_title: title,
            company_name: currentOrg.name,
            department: dept || null,
            bio: `Miembro oficial del equipo profesional en ${currentOrg.name}.`,
            profile_photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=600',
            cover_photo_url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1200',
            logo_url: currentOrg.logo_url,
            layout_type: 'banner_header',
            avatar_position: 'header_floating',
            button_style: 'gradient',
            border_radius: 'lg',
            primary_color: currentOrg.brand_colors?.primary || '#0EA5E9',
            secondary_color: currentOrg.brand_colors?.secondary || '#0369A1',
            accent_color: currentOrg.brand_colors?.accent || '#38BDF8',
            background_color: currentOrg.brand_colors?.background || '#0F172A',
            font_family: currentOrg.font_family || 'Inter',
            font_weight: 'semibold',
            include_photo: true,
            custom_vcf_notes: `Contacto verificado por ${currentOrg.name}.`,
            created_at: new Date().toISOString(),
            links,
            multimedia: [],
          };

          newCards.push(card);
          newCardRowsForSupabase.push({
            id: card.id,
            user_id: card.user_id,
            organization_id: card.organization_id,
            slug: card.slug,
            is_active: card.is_active,
            full_name: card.full_name,
            job_title: card.job_title,
            company_name: card.company_name,
            bio: card.bio,
            profile_photo_url: card.profile_photo_url,
            cover_photo_url: card.cover_photo_url,
            logo_url: card.logo_url,
            layout_type: card.layout_type,
            avatar_position: card.avatar_position,
            button_style: card.button_style,
            border_radius: card.border_radius,
            primary_color: card.primary_color,
            secondary_color: card.secondary_color,
            accent_color: card.accent_color,
            background_color: card.background_color,
            font_family: card.font_family,
            font_weight: card.font_weight,
            include_photo: card.include_photo,
            custom_vcf_notes: card.custom_vcf_notes,
            created_at: card.created_at,
          });
        });

        if (isSupabaseEnabled && supabase && newCardRowsForSupabase.length > 0) {
          try {
            const { error: insErr } = await supabase.from('cards').insert(newCardRowsForSupabase);
            if (insErr) {
              console.warn('Error inserting batch cards to Supabase:', insErr);
            }
            if (newLinksForSupabase.length > 0) {
              await supabase.from('card_links').insert(newLinksForSupabase);
            }
          } catch (err) {
            console.warn('Error during batch Supabase insertion:', err);
          }
        }

        newCards.forEach((c) => saveCard(c));
        setCards((prev) => [...newCards, ...prev]);
        setCsvResult({
          count: newCards.length,
          message: `¡Éxito! Se importaron ${newCards.length} colaboradores con sus enlaces y códigos QR listos.`,
        });
        await loadOrgData();
      } catch (err) {
        console.error('Error procesando archivo CSV:', err);
        alert('Hubo un problema procesando el archivo CSV.');
      } finally {
        setCsvUploading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadCsvTemplate = () => {
    const content = `nombre,cargo,email,telefono,departamento
Alejandro Morales,Director Comercial,alejandro@empresa.com,+34611223344,Ventas
Sofía Navarro,Gerente de Operaciones,sofia@empresa.com,+34622334455,Operaciones
Carlos Mendoza,Ejecutivo Senior,carlos@empresa.com,+34633445566,Ventas`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla_colaboradores_${currentOrg?.slug || 'empresa'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Ranking comercial (Leaderboard)
  const leaderboardReps = React.useMemo(() => {
    return cards
      .map((c) => {
        const leadsCount = orgLeads.filter(
          (l) =>
            l.card_id === c.id ||
            l.salesperson_name?.toLowerCase().trim() === c.full_name?.toLowerCase().trim()
        ).length;
        return { card: c, leadsCount };
      })
      .sort((a, b) => b.leadsCount - a.leadsCount);
  }, [cards, orgLeads]);

  // Filtro de colaboradores
  const filteredTeamCards = React.useMemo(() => {
    if (!teamSearch.trim()) return cards;
    const q = teamSearch.toLowerCase().trim();
    return cards.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.job_title?.toLowerCase().includes(q) ||
        c.department?.toLowerCase().includes(q) ||
        c.slug?.toLowerCase().includes(q)
    );
  }, [cards, teamSearch]);

  // Alternar Brand Lock
  const handleToggleBrandLock = async () => {
    if (!currentOrg) return;
    const nextVal = !currentOrg.enforce_brand_lock;
    const updated: Organization = {
      ...currentOrg,
      enforce_brand_lock: nextVal,
    };

    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('organizations').update({
          enforce_brand_lock: nextVal,
        }).eq('id', currentOrg.id);
      } catch (err) {
        console.warn('Error alternando brand lock en Supabase:', err);
      }
    }

    saveOrganization(updated);
    await loadOrgData();
  };

  // Alternar estado de tarjeta de empleado
  const handleToggleCard = async (cardId: string, currentStatus: boolean) => {
    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('cards').update({
          is_active: !currentStatus,
        }).eq('id', cardId);
      } catch (err) {
        console.warn('Error actualizando estado en Supabase:', err);
      }
    }
    toggleCardActiveStatus(cardId);
    await loadOrgData();
  };

  // Asignar rol a colaborador (org_admin vs collaborator)
  const handleAssignRole = async (card: FullCard, newRole: string) => {
    if (!isOrgAdmin) {
      alert('Solo los administradores de la empresa pueden modificar roles y permisos.');
      return;
    }
    const roleVal = newRole as any;
    if (card.user_id) {
      updateUserRole(card.user_id, roleVal);
      if (isSupabaseEnabled && supabase) {
        try {
          await supabase.from('users').update({ role: roleVal }).eq('id', card.user_id);
        } catch (err) {
          console.warn('Error al actualizar rol en Supabase:', err);
        }
      }
    }
    alert(`Permisos actualizados: ${card.full_name} ahora tiene rol de ${newRole === 'org_admin' ? 'Administrador de Empresa (Control total)' : 'Vendedor / Asesor comercial'}.`);
  };

  // Crear Organización
  const handleCreateOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setIsCreatingOrg(true);
    const newId = crypto.randomUUID();
    const cleanSlug = (newOrgSlug.trim() || newOrgName.trim())
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const newOrg: Organization = {
      id: newId,
      name: newOrgName.trim(),
      slug: cleanSlug,
      logo_url: newOrgLogo.trim() || null,
      brand_colors: {
        primary: newOrgPrimaryColor,
        secondary: newOrgSecondaryColor,
        accent: newOrgAccentColor,
        background: newOrgBgColor,
      },
      font_family: 'Inter',
      allowed_layouts: ['modern', 'executive', 'minimal', 'banner_header', 'card_id_badge', 'creative_grid'],
      enforce_brand_lock: true,
      max_cards: Number(newOrgMaxCards) || 10,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseEnabled && supabase) {
      try {
        const { error: insErr } = await supabase.from('organizations').insert([newOrg]);
        if (insErr) {
          console.error('Error insertando organización en Supabase:', insErr);
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData?.session?.user?.id;
        if (uid) {
          await supabase.from('users').update({
            organization_id: newId,
            role: 'org_admin',
          }).eq('id', uid);
        }
      } catch (err) {
        console.error('Error al persistir organización en Supabase:', err);
      }
    }

    saveOrganization(newOrg);
    setSelectedOrgId(newId);
    setShowCreateOrgModal(false);
    setNewOrgName('');
    setNewOrgSlug('');
    setNewOrgLogo('');
    setIsCreatingOrg(false);
    await loadOrgData();
  };

  // Añadir Colaborador Submit
  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !empName.trim()) return;

    setIsCreatingEmp(true);
    const cardId = crypto.randomUUID();
    const slugBase = empName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const cardSlug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    let uid = 'a0000000-0000-0000-0000-000000000002';
    if (isSupabaseEnabled && supabase) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user?.id) {
        uid = sessionData.session.user.id;
      }
    }

    const links: any[] = [];
    if (empEmail.trim()) {
      links.push({
        id: crypto.randomUUID(),
        card_id: cardId,
        type: 'email' as const,
        label: 'Correo Electrónico',
        url: `mailto:${empEmail.trim()}`,
        icon_name: 'Mail',
        is_active: true,
        position_order: 0,
      });
    }
    if (empPhone.trim()) {
      links.push({
        id: crypto.randomUUID(),
        card_id: cardId,
        type: 'phone' as const,
        label: 'Teléfono Directo',
        url: `tel:${empPhone.trim()}`,
        icon_name: 'Phone',
        is_active: true,
        position_order: 1,
      });
    }

    const newCard: FullCard = {
      id: cardId,
      user_id: uid,
      organization_id: currentOrg.id,
      slug: cardSlug,
      is_active: true,
      full_name: empName.trim(),
      job_title: empTitle.trim() || 'Colaborador',
      company_name: currentOrg.name,
      bio: `Miembro oficial del equipo en ${currentOrg.name}.`,
      profile_photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=600',
      cover_photo_url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1200',
      logo_url: currentOrg.logo_url,
      layout_type: 'banner_header',
      avatar_position: 'header_floating',
      button_style: 'gradient',
      border_radius: 'lg',
      primary_color: currentOrg.brand_colors?.primary || '#0EA5E9',
      secondary_color: currentOrg.brand_colors?.secondary || '#0369A1',
      accent_color: currentOrg.brand_colors?.accent || '#38BDF8',
      background_color: currentOrg.brand_colors?.background || '#0F172A',
      font_family: currentOrg.font_family || 'Inter',
      font_weight: 'semibold',
      include_photo: true,
      custom_vcf_notes: `Contacto verificado por ${currentOrg.name}.`,
      created_at: new Date().toISOString(),
      links: links,
      multimedia: [],
    };

    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('cards').insert([{
          id: newCard.id,
          user_id: newCard.user_id,
          organization_id: newCard.organization_id,
          slug: newCard.slug,
          is_active: newCard.is_active,
          full_name: newCard.full_name,
          job_title: newCard.job_title,
          company_name: newCard.company_name,
          bio: newCard.bio,
          profile_photo_url: newCard.profile_photo_url,
          cover_photo_url: newCard.cover_photo_url,
          logo_url: newCard.logo_url,
          layout_type: newCard.layout_type,
          avatar_position: newCard.avatar_position,
          button_style: newCard.button_style,
          border_radius: newCard.border_radius,
          primary_color: newCard.primary_color,
          secondary_color: newCard.secondary_color,
          accent_color: newCard.accent_color,
          background_color: newCard.background_color,
          font_family: newCard.font_family,
          font_weight: newCard.font_weight,
          include_photo: newCard.include_photo,
          custom_vcf_notes: newCard.custom_vcf_notes,
          created_at: newCard.created_at,
        }]);

        if (links.length > 0) {
          await supabase.from('card_links').insert(links);
        }
      } catch (err) {
        console.warn('Error inserting card to Supabase:', err);
      }
    }

    saveCard(newCard);
    setShowAddEmployeeModal(false);
    setEmpName('');
    setEmpTitle('');
    setEmpEmail('');
    setEmpPhone('');
    setIsCreatingEmp(false);
    await loadOrgData();
  };

  const handlePrintBatch = () => {
    window.print();
  };

  if (loadingData && organizations.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-3">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Cargando datos corporativos de ProConnect...</p>
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

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Selector de Organización */}
            {organizations.length > 0 && (
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
            )}

            <button
              onClick={() => setShowCreateOrgModal(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Empresa</span>
            </button>

            {organizations.length > 0 && (
              <button
                onClick={() => setShowBatchQRModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-md flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <QrCode className="w-4 h-4" />
                <span>Exportar Códigos QR en Lote</span>
              </button>
            )}
          </div>
        </div>

        {/* Estado Vacío si no hay empresas */}
        {organizations.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center max-w-xl mx-auto space-y-4 my-8">
            <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Aún no tienes una Empresa Registrada</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Crea tu primera organización corporativa para unificar la marca de tu negocio, emitir credenciales digitales NFC a tus empleados y canalizar prospectos comerciales mediante el CRM en tiempo real.
            </p>
            <button
              onClick={() => setShowCreateOrgModal(true)}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 inline-flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Mi Empresa Ahora</span>
            </button>
          </div>
        )}

        {currentOrg && (
          <>
        {/* NAVEGACIÓN POR PESTAÑAS EJECUTIVAS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 scale-[1.02]'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Resumen & Métricas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'team'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 scale-[1.02]'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Equipo & Tarjetas ({cards.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'import'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 scale-[1.02]'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importación Masiva (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('brand')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'brand'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 scale-[1.02]'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Identidad & Brand Lock</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crm')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'crm'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 scale-[1.02]'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>CRM & Leads ({orgLeads.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'directory'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 scale-[1.02]'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Directorio Público</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('print')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'print'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 scale-[1.02]'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Centro de Impresión</span>
          </button>

          {(currentOrg.org_type === 'restaurant' || currentOrg.industry_type === 'restaurant' || currentOrg.slug === 'brasa-criolla') && (
            <button
              type="button"
              onClick={() => setActiveTab('restaurant')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'restaurant'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Módulo Gastro</span>
            </button>
          )}
        </div>

        {/* 1. PESTAÑA: RESUMEN & MÉTRICAS (KPIs + LEADERBOARD) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Métricas Globales */}
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
                    {cards.length * 42 + 89}
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
                  {cards.length * 15 + 24}
                </p>
                <p className="text-[11px] text-slate-400 mt-2">vCards descargadas a agendas</p>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Leads Comerciales Capturados
                </span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {orgLeads.length}
                </p>
                <p className="text-[11px] text-emerald-500 font-semibold mt-2">
                  Prospectos en CRM corporativo
                </p>
              </div>
            </div>

            {/* Ranking Comercial / Sales Leaderboard */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span>Ranking Comercial del Equipo (Sales Leaderboard)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Colaboradores que más prospectos han generado y más interacción comercial han logrado.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 font-bold border border-amber-200 dark:border-amber-800 self-start sm:self-auto">
                  En Tiempo Real
                </span>
              </div>

              {leaderboardReps.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Aún no hay colaboradores registrados para calcular el ranking.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  {leaderboardReps.slice(0, 3).map((item, idx) => (
                    <div
                      key={item.card.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center gap-3.5 relative overflow-hidden"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-sm shrink-0"
                        style={{
                          backgroundColor: idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : '#D97706',
                        }}
                      >
                        #{idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {item.card.full_name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {item.card.job_title || 'Colaborador'}
                        </p>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {item.leadsCount} {item.leadsCount === 1 ? 'prospecto capturado' : 'prospectos capturados'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accesos Rápidos para el Gerente */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('team')}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left hover:border-purple-300 dark:hover:border-purple-700 transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                    Gestionar Colaboradores
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Ver, activar o reasignar las {cards.length} tarjetas del equipo.
                  </p>
                </div>
                <Users className="w-5 h-5 text-purple-500" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('import')}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left hover:border-purple-300 dark:hover:border-purple-700 transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                    Importador Masivo CSV
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Cargar lista completa de empleados en 1 clic.
                  </p>
                </div>
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left hover:border-purple-300 dark:hover:border-purple-700 transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                    Directorio Institucional
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Página pública corporativa /org/{currentOrg.slug}.
                  </p>
                </div>
                <Globe className="w-5 h-5 text-sky-500" />
              </button>
            </div>
          </div>
        )}

        {/* 2. PESTAÑA: MARCA CORPORATIVA & BRAND LOCK */}
        {activeTab === 'brand' && (
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
                      className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {isExtracting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span>Extraer con IA</span>
                    </button>
                  </div>
                </div>

                {/* Subir archivo de logotipo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-purple-500" />
                    O sube una imagen desde tu dispositivo
                  </label>
                  <label className="flex items-center justify-center p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, false)}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                    {uploadingLogo ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-purple-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Optimizando y subiendo logotipo...</span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500 hover:text-purple-600 flex items-center gap-1.5">
                        <Upload className="w-4 h-4" />
                        Seleccionar archivo de imagen (PNG, JPG, WebP)
                      </span>
                    )}
                  </label>
                </div>

                {/* Campos Institucionales Adicionales: Descripción y Aviso Legal */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Descripción Oficial de la Empresa (se muestra en el Directorio Público)
                    </label>
                    <textarea
                      rows={2}
                      value={orgDescInput}
                      onChange={(e) => setOrgDescInput(e.target.value)}
                      placeholder="ej: Empresa líder en soluciones tecnológicas y consultoría estratégica para clientes globales..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Aviso Legal y Descargo de Responsabilidad (pie de tarjetas del equipo)
                    </label>
                    <textarea
                      rows={2}
                      value={orgDisclaimerInput}
                      onChange={(e) => setOrgDisclaimerInput(e.target.value)}
                      placeholder="ej: Esta credencial digital inteligente es de uso exclusivo y propiedad de la empresa. Queda prohibida su alteración o uso indebido."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Selector de 4 Colores */}
              <div className="lg:col-span-6 space-y-4">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Paleta Institucional Oficial
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500">Primario</span>
                    <input
                      type="color"
                      value={colors.primary}
                      onChange={(e) =>
                        setColors({ ...colors, primary: e.target.value })
                      }
                      className="w-full h-8 rounded-lg cursor-pointer border-0 bg-transparent"
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

                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500">Secundario</span>
                    <input
                      type="color"
                      value={colors.secondary}
                      onChange={(e) =>
                        setColors({ ...colors, secondary: e.target.value })
                      }
                      className="w-full h-8 rounded-lg cursor-pointer border-0 bg-transparent"
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

                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500">Acento</span>
                    <input
                      type="color"
                      value={colors.accent}
                      onChange={(e) =>
                        setColors({ ...colors, accent: e.target.value })
                      }
                      className="w-full h-8 rounded-lg cursor-pointer border-0 bg-transparent"
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

                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500">Fondo</span>
                    <input
                      type="color"
                      value={colors.background}
                      onChange={(e) =>
                        setColors({ ...colors, background: e.target.value })
                      }
                      className="w-full h-8 rounded-lg cursor-pointer border-0 bg-transparent"
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

                {/* Botón Guardar Cambios de Marca */}
                <div className="flex justify-end pt-3">
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
        )}

        {/* 3. PESTAÑA: GESTIÓN DE TARJETAS DE COLABORADORES */}
        {activeTab === 'team' && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span>Tarjetas del Equipo ({cards.length})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Colaboradores con credencial inteligente activa en {currentOrg.name}.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Buscador de Colaboradores */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    placeholder="Buscar por nombre, cargo o slug..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  onClick={() => setShowAddEmployeeModal(true)}
                  disabled={cards.length >= currentOrg.max_cards}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Colaborador</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Colaborador / Puesto</th>
                    <th className="px-5 py-3.5">Enlace Público</th>
                    <th className="px-5 py-3.5">Layout Asignado</th>
                    <th className="px-5 py-3.5">Rol / Permisos</th>
                    <th className="px-5 py-3.5 text-center">Estado Tarjeta</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTeamCards.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-400">
                        No se encontraron colaboradores{teamSearch ? ` para "${teamSearch}"` : ''}.
                      </td>
                    </tr>
                  ) : (
                    filteredTeamCards.map((card) => (
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
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {card.full_name}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {card.job_title}
                                {card.department ? ` • ${card.department}` : ''}
                              </p>
                              {card.redirect_to_slug && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md mt-0.5 border border-amber-200 dark:border-amber-800/50">
                                  <ArrowRightLeft className="w-2.5 h-2.5" />
                                  Redirige a /c/{card.redirect_to_slug}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 font-mono text-[11px] text-purple-600 dark:text-purple-400">
                          /c/{card.slug}
                        </td>

                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {card.layout_type || 'modern'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {isOrgAdmin ? (
                            <select
                              defaultValue="collaborator"
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:border-purple-500 transition-colors"
                              onChange={(e) => handleAssignRole(card, e.target.value)}
                            >
                              <option value="collaborator">💼 Vendedor / Asesor</option>
                              <option value="org_admin">👑 Administrador Empresa</option>
                            </select>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                              💼 Vendedor
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleCard(card.id, card.is_active)}
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
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setRedirectingCard(card);
                                setRedirectTarget(card.redirect_to_slug || '');
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                                card.redirect_to_slug
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-purple-600 hover:border-purple-300'
                              }`}
                              title={card.redirect_to_slug ? `Redirigido a /c/${card.redirect_to_slug}` : 'Redirigir tráfico a otro colaborador'}
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>{card.redirect_to_slug ? 'Redirigido' : 'Redirigir'}</span>
                            </button>

                            <a
                              href={`/c/${card.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 font-semibold hover:bg-purple-100 transition-colors"
                            >
                              <span>Ver Perfil</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 4. PESTAÑA: IMPORTACIÓN MASIVA CSV & FIRMAS */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                    <span>Importación Masiva de Colaboradores (CSV / Excel)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Genera las tarjetas inteligentes de tu equipo en 1 solo clic con sincronización automática en la base de datos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Plantilla CSV Oficial</span>
                </button>
              </div>

              <div className="p-6 space-y-5">
                {csvResult && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>{csvResult.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('team')}
                      className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-500 transition-colors"
                    >
                      Ver en Equipo
                    </button>
                  </div>
                )}

                {/* Zona de upload CSV */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <label
                    htmlFor="csv-upload"
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-dashed border-purple-400/80 hover:border-purple-600 dark:border-purple-600/60 dark:hover:border-purple-400 bg-purple-50/40 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 text-xs font-bold cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    {csvUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        <span>Procesando y creando tarjetas en Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-purple-600" />
                        <span>Seleccionar archivo CSV con colaboradores</span>
                      </>
                    )}
                    <input
                      id="csv-upload"
                      type="file"
                      accept=".csv,.tsv,.txt"
                      className="hidden"
                      disabled={csvUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleCsvBatchImport(file);
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Estructura requerida de columnas:</p>
                    <code className="block font-mono bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl text-[11px] border border-slate-200 dark:border-slate-700">
                      nombre,cargo,email,telefono,departamento
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
      </div>
    )}

      {/* 5. PESTAÑA: DIRECTORIO INSTITUCIONAL PÚBLICO */}
      {activeTab === 'directory' && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 border border-sky-500/20 flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Directorio Institucional Público
                </h2>
                <p className="text-xs text-slate-500">
                  Tu página corporativa oficial en ProConnect para que clientes y aliados contacten a tu equipo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href={`/org/${currentOrg.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all hover:scale-105"
              >
                <Eye className="w-4 h-4" />
                <span>Ver Directorio en Vivo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Tarjeta de visualización rápida del enlace */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Enlace Público Oficial:
                </span>
                <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 truncate">
                    {typeof window !== 'undefined' ? `${window.location.origin}/org/${currentOrg.slug}` : `https://proconnect-pearl.vercel.app/org/${currentOrg.slug}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const url = typeof window !== 'undefined' ? `${window.location.origin}/org/${currentOrg.slug}` : `https://proconnect-pearl.vercel.app/org/${currentOrg.slug}`;
                      navigator.clipboard.writeText(url);
                      alert('¡Enlace del directorio copiado al portapapeles!');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-purple-50 hover:text-purple-600 transition-colors shrink-0"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <p className="font-semibold text-slate-900 dark:text-white">
                  ¿Qué incluye el Directorio Institucional?
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Identidad oficial con logo, colores corporativos y sello de verificación.</li>
                  <li>Buscador reactivo en tiempo real para encontrar colaboradores por nombre o puesto.</li>
                  <li>Filtro instantáneo por departamentos (Ventas, Operaciones, Dirección, etc.).</li>
                  <li>Accesos directos a llamada, WhatsApp y correo de cada asesor comercial.</li>
                  <li>Descargo de responsabilidad legal oficial al pie de página.</li>
                </ul>
              </div>
            </div>

            {/* QR del Directorio */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-100">
                <QRCodeSVG
                  value={typeof window !== 'undefined' ? `${window.location.origin}/org/${currentOrg.slug}` : `https://proconnect-pearl.vercel.app/org/${currentOrg.slug}`}
                  size={140}
                  level="H"
                />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">QR del Directorio</h4>
                <p className="text-[10px] text-slate-400">Escanea para abrir en el celular</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. PESTAÑA: CENTRO DE IMPRESIÓN QR */}
      {activeTab === 'print' && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center justify-center">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Centro de Impresión & Exportación de Códigos QR
                </h2>
                <p className="text-xs text-slate-500">
                  Fichas listas para imprenta, corte estándar 85x54mm o grabado en tarjetas plásticas NFC.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowBatchQRModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Printer className="w-4 h-4" />
              <span>Abrir Modal de Impresión / Guardar PDF</span>
            </button>
          </div>

          {/* Vista previa de las tarjetas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => {
              const profileUrl = typeof window !== 'undefined'
                ? `${window.location.origin}/c/${card.slug}`
                : `https://proconnect-pearl.vercel.app/c/${card.slug}`;

              return (
                <div
                  key={card.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col items-center text-center space-y-3"
                >
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                    <QRCodeSVG value={profileUrl} size={110} level="H" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[200px]">
                      {card.full_name}
                    </h4>
                    <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 truncate max-w-[200px]">
                      {card.job_title || 'Colaborador'}
                    </p>
                    <p className="text-[9px] font-mono text-slate-400 pt-1">
                      /c/{card.slug}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* MODAL DE IMPRESIÓN POR LOTES */}
      <BatchPrintModal
        isOpen={showBatchQRModal}
        onClose={() => setShowBatchQRModal(false)}
        organization={currentOrg}
        cards={cards}
      />

      {/* ════════════════════════════════════════════════════════════
          7. PESTAÑA: CRM CORPORATIVO — GESTIÓN DE LEADS & EQUIPO DE VENTAS
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'crm' && (
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
                    <th className="px-6 py-3 text-right">Acciones & Notas</th>
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
                              onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value as LeadStatus)}
                              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold outline-none"
                            >
                              <option value="nuevo">⏳ Nuevo</option>
                              <option value="contactado">📞 En Seguimiento</option>
                              <option value="propuesta">📝 Cotización</option>
                              <option value="ganado">✅ Ganada</option>
                              <option value="perdido">❌ Perdida</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botón Notas de Actividad Comercial */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveLeadForNotes(lead);
                                  setLeadNoteText('');
                                }}
                                className="px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold flex items-center gap-1 transition-colors"
                                title="Ver o agregar notas sobre este prospecto"
                              >
                                <StickyNote className="w-3.5 h-3.5" />
                                <span>Notas ({lead.activity_notes?.length || 0})</span>
                              </button>

                              {/* Botón Eliminar Lead (Solo Administrador) */}
                              {isOrgAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLead(lead.id, lead.visitor_name)}
                                  className="p-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
                                  title="Eliminar prospecto (Exclusivo Administrador)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span
                                  className="p-1.5 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                  title="Solo el administrador puede eliminar prospectos"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* MODAL DE NOTAS DE ACTIVIDAD COMERCIAL (CRM CORPORATIVO) */}
            {activeLeadForNotes && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
                <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
                  {/* Cabecera del modal */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <StickyNote className="w-4 h-4 text-amber-500" />
                        <span>Historial & Notas: {activeLeadForNotes.visitor_name}</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {activeLeadForNotes.company_name ? `${activeLeadForNotes.company_name} • ` : ''}
                        Asesor asignado: {activeLeadForNotes.salesperson_name || 'Equipo Comercial'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveLeadForNotes(null)}
                      className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Resumen del lead */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs shrink-0 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Interés Inicial:</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{activeLeadForNotes.subject || activeLeadForNotes.interest_notes || 'Consulta comercial'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${activeLeadForNotes.phone_number}`}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold text-[11px] text-slate-700 dark:text-slate-200 flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-emerald-500" />
                        <span>{activeLeadForNotes.phone_number}</span>
                      </a>
                    </div>
                  </div>

                  {/* Historial cronológico de notas */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[140px] max-h-[320px]">
                    {(!activeLeadForNotes.activity_notes || activeLeadForNotes.activity_notes.length === 0) ? (
                      <div className="py-10 text-center text-xs text-slate-400">
                        No hay notas de seguimiento aún para este prospecto. Registra qué le dijiste o qué acordaron abajo.
                      </div>
                    ) : (
                      activeLeadForNotes.activity_notes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5 shadow-sm"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {note.author_name}{' '}
                              <span className="font-normal text-[10px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">
                                {note.author_role}
                              </span>
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {new Date(note.created_at).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {note.text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Campo para redactar nueva nota */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
                    {/* Botones de Notas Rápidas */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plantillas rápidas de seguimiento:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          '📞 Llamada telefónica realizada',
                          '💬 Contactado por WhatsApp',
                          '📄 Cotización enviada',
                          '🤝 Demostración agendada',
                          '⏳ Pendiente de respuesta del cliente',
                        ].map((tag, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setLeadNoteText((prev) => (prev ? `${prev} • ${tag}` : tag))}
                            className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[10px] font-semibold hover:bg-amber-100 transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      value={leadNoteText}
                      onChange={(e) => setLeadNoteText(e.target.value)}
                      placeholder="Registrar interacción (ej. 'Se le envió catálogo de productos por WhatsApp. Llamar nuevamente el jueves para confirmar pedido')..."
                      className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-blue resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setActiveLeadForNotes(null)}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                      >
                        Cerrar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddLeadNote(activeLeadForNotes.id)}
                        disabled={!leadNoteText.trim()}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Guardar en Historial CRM</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════
          8. PESTAÑA: MÓDULO GASTRO — PANEL DE RESTAURANTE & KDS
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'restaurant' && (
        <>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200/60 dark:border-amber-900/30 shadow-sm overflow-hidden">
            {/* Header Gastro */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-5 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-md">
                  <UtensilsCrossed className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-white text-xl">ProConnect Gastro</h2>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/25 text-white backdrop-blur-md">
                      KDS & Ecosistema de Mesas
                    </span>
                  </div>
                  <p className="text-amber-100 text-xs font-medium mt-0.5">
                    Brasa Criolla — Mesas Inteligentes NFC, Pantalla de Cocina y Control de Caja
                  </p>
                </div>
              </div>
              <a
                href="/r/brasa-criolla?mesa=1"
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-amber-700 hover:bg-amber-50 text-xs font-black shadow-lg shadow-black/10 transition-all self-start sm:self-auto active:scale-95"
              >
                <Eye className="w-4 h-4" />
                <span>Abrir Kiosco Comensal</span>
              </a>
            </div>

            {/* Subtabs Gastro */}
            <div className="flex flex-wrap gap-2 mt-5">
              {([
                { id: 'orders', icon: <ClipboardList className="w-4 h-4" />, label: 'Comandas & KDS Cocina' },
                { id: 'tables', icon: <Table2 className="w-4 h-4" />, label: 'Mesas & Asignar Mesero' },
                { id: 'menu', icon: <ChefHat className="w-4 h-4" />, label: 'Menú & Disponibilidad' },
                { id: 'kpis', icon: <TrendingUp className="w-4 h-4" />, label: '📊 KPIs & Arqueo de Caja' },
              ] as const).map(({ id, icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveRestTab(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
                    activeRestTab === id
                      ? 'bg-white text-amber-700 shadow-md scale-102'
                      : 'text-white/90 hover:bg-white/15'
                  }`}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── 1. COMANDAS & KDS EN VIVO ── */}
          {activeRestTab === 'orders' && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Pantalla de Producción en Cocina (KDS)</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                      {restOrders.filter((o) => o.status !== 'paid' && o.status !== 'cancelled').length} activas
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monitoreo en tiempo real de tiempos de espera, llamados de mesero y comprobantes de pago.
                  </p>
                </div>
                <button
                  onClick={loadRestaurantData}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refrescar Pantalla</span>
                </button>
              </div>

              {restOrders.length === 0 ? (
                <div className="text-center py-16">
                  <ClipboardList className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No hay comandas registradas</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Cuando los comensales ordenen desde sus teléfonos, las comandas aparecerán aquí con sus tiempos de preparación.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {restOrders.map((order) => {
                    const minsElapsed = Math.max(
                      0,
                      Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
                    );

                    const timerColor =
                      minsElapsed > 25
                        ? 'bg-red-500 text-white'
                        : minsElapsed > 15
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white';

                    const statusStyles: Record<string, string> = {
                      pending: 'border-yellow-300 bg-yellow-50/40 dark:bg-yellow-950/20',
                      preparing: 'border-blue-300 bg-blue-50/40 dark:bg-blue-950/20',
                      ready: 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20',
                      delivered: 'border-purple-300 bg-purple-50/40 dark:bg-purple-950/20',
                      paid: 'border-slate-200 bg-slate-50 dark:bg-slate-800/40 opacity-75',
                      cancelled: 'border-red-200 bg-red-50 opacity-60',
                    };

                    const statusLabels: Record<string, string> = {
                      pending: '⏳ Pendiente en Cocina',
                      preparing: '👨‍🍳 En Preparación',
                      ready: '✅ Listo para Servir',
                      delivered: '🍽️ Servido en Mesa',
                      paid: '💳 Pagado / Cerrado',
                      cancelled: '❌ Cancelado',
                    };

                    const nextStatus: Record<string, OrderStatus | null> = {
                      pending: 'preparing',
                      preparing: 'ready',
                      ready: 'delivered',
                      delivered: 'paid',
                      paid: null,
                      cancelled: null,
                    };

                    const nextLabels: Record<string, string> = {
                      pending: 'Iniciar Preparación',
                      preparing: 'Marcar Listo para Servir',
                      ready: 'Confirmar Entrega en Mesa',
                      delivered: 'Cobrar y Finalizar Comanda',
                      paid: '',
                      cancelled: '',
                    };

                    return (
                      <div
                        key={order.id}
                        className={`rounded-3xl border-2 p-5 space-y-4 shadow-sm transition-all flex flex-col justify-between ${
                          statusStyles[order.status] || 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Top row: Mesa & Timer */}
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <h4 className="font-black text-slate-900 dark:text-white text-base">
                                {order.table_name}
                              </h4>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{new Date(order.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                {order.assigned_waiter && (
                                  <span className="font-bold text-amber-600 dark:text-amber-400">
                                    • Mesero: {order.assigned_waiter}
                                  </span>
                                )}
                              </p>
                            </div>

                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-xs ${timerColor}`}>
                              ⏱️ {minsElapsed} min
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {statusLabels[order.status]}
                          </div>

                          {/* Alerta: Llamada de Mesero */}
                          {order.waiter_called && (
                            <div className="bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl p-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2 animate-pulse">
                              <div className="flex items-center gap-1.5 font-bold truncate">
                                <BellRing className="w-4 h-4 text-amber-600 shrink-0" />
                                <span className="truncate">Llamado: {order.waiter_call_reason || 'Atención solicitada'}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  dismissWaiterCall(order.id);
                                  loadRestaurantData();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] shrink-0"
                              >
                                Atendido ✓
                              </button>
                            </div>
                          )}

                          {/* Alerta: Cuenta Pedida */}
                          {order.bill_requested && (
                            <div className="bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-2.5 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-bold truncate">
                                <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="truncate">
                                  Pide cuenta (Propina: ${(order.tip_amount || 0).toFixed(2)})
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  dismissBillRequest(order.id);
                                  loadRestaurantData();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] shrink-0"
                              >
                                Atendido ✓
                              </button>
                            </div>
                          )}

                          {/* Comprobante de Pago Subido por el Cliente */}
                          {order.payment_data && (
                            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                                  💳 {order.payment_data.method.replace('_', ' ')}
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  order.payment_data.status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : order.payment_data.status === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {order.payment_data.status === 'approved'
                                    ? 'Pago Aprobado ✓'
                                    : order.payment_data.status === 'rejected'
                                    ? 'Rechazado ✗'
                                    : 'Validación Pendiente'}
                                </span>
                              </div>

                              {order.payment_data.reference && (
                                <p className="text-[11px] text-slate-500">
                                  Ref: <strong className="text-slate-800 dark:text-slate-200">{order.payment_data.reference}</strong>
                                </p>
                              )}

                              {order.payment_data.receipt_base64 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedReceiptOrder(order)}
                                  className="w-full py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-purple-200 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Revisar Comprobante Adjunto</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Desglose de Platos e Instrucciones de Cocina */}
                          <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                            {order.items.map((item, i) => (
                              <div key={i} className="text-xs space-y-0.5">
                                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                                  <span>{item.qty}x {item.name}</span>
                                  <span>${item.subtotal.toFixed(2)}</span>
                                </div>
                                {item.notes && (
                                  <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md font-medium">
                                    Nota: {item.notes}
                                  </p>
                                )}
                              </div>
                            ))}

                            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                              <span>Total Comanda</span>
                              <span className="text-amber-600">${order.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Botón de Avance de Estado de Comanda */}
                        {nextStatus[order.status] && (
                          <button
                            type="button"
                            onClick={() => {
                              updateOrderPrepStatus(order.id, nextStatus[order.status]!);
                              loadRestaurantData();
                            }}
                            className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                          >
                            <span>{nextLabels[order.status]}</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── 2. MESAS & ASIGNAR MESERO ── */}
          {activeRestTab === 'tables' && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Mesas Inteligentes ({restTables.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Asigna meseros encargados a cada mesa y descarga los códigos QR listos para imprimir o programar en stickers NFC.
                  </p>
                </div>
                <button
                  onClick={() => {
                    addRestaurantTable(BRASA_CRIOLLA_ORG_ID, 'brasa-criolla');
                    loadRestaurantData();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-black shadow-md transition-all self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Nueva Mesa</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {restTables.map((table) => {
                  const qrUrl =
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/r/${table.slug}?mesa=${table.table_number}`
                      : `https://proconnect.app/r/${table.slug}?mesa=${table.table_number}`;

                  return (
                    <div
                      key={table.id}
                      className={`p-5 rounded-3xl border-2 text-center flex flex-col items-center justify-between gap-3 transition-all ${
                        table.is_active
                          ? 'border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-800/80 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 opacity-60'
                      }`}
                    >
                      <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-100">
                        <QRCodeSVG value={qrUrl} size={110} level="M" includeMargin />
                      </div>

                      <div className="w-full space-y-1">
                        <h4 className="font-black text-slate-900 dark:text-white text-sm">{table.name}</h4>
                        <p className="text-[11px] text-slate-500">Capacidad: {table.capacity} comensales</p>

                        {/* Asignación de Mesero */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                          {editingWaiterTableId === table.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={waiterInputName}
                                onChange={(e) => setWaiterInputName(e.target.value)}
                                placeholder="Nombre mesero..."
                                className="w-full px-2.5 py-1 text-xs rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-slate-800"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  assignWaiterToTable(table.id, waiterInputName.trim() || null);
                                  setEditingWaiterTableId(null);
                                  loadRestaurantData();
                                }}
                                className="p-1 rounded-lg bg-amber-500 text-white"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingWaiterTableId(table.id);
                                setWaiterInputName(table.assigned_waiter || '');
                              }}
                              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                              <User className="w-3 h-3" />
                              <span>{table.assigned_waiter ? `Mesero: ${table.assigned_waiter}` : '+ Asignar Mesero'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 w-full pt-2">
                        <button
                          onClick={() => {
                            toggleTableStatus(table.id);
                            loadRestaurantData();
                          }}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            table.is_active
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {table.is_active ? 'Activa' : 'Inactiva'}
                        </button>
                        <a
                          href={qrUrl}
                          target="_blank"
                          className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors flex items-center justify-center"
                          title="Abrir Kiosco Comensal"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 3. MENÚ & DISPONIBILIDAD ── */}
          {activeRestTab === 'menu' && (
            <div className="p-6 space-y-6">
              {restCategories.map((cat) => {
                const catItems = restItems.filter((i) => i.category_id === cat.id);
                return (
                  <div key={cat.id} className="space-y-3">
                    <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                      <span className="text-xs font-normal text-slate-400">({catItems.length} platos)</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {catItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
                        >
                          {item.image_url && (
                            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200">
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                              {item.name}
                            </p>
                            {item.description && (
                              <p className="text-[11px] text-slate-500 truncate">{item.description}</p>
                            )}
                            <span className="font-black text-amber-600 text-sm mt-0.5 block">
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const updated = {
                                ...item,
                                status: (item.status === 'available' ? 'unavailable' : 'available') as any,
                              };
                              saveMenuItem(updated);
                              loadRestaurantData();
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0 transition-colors ${
                              item.status === 'available'
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                          >
                            {item.status === 'available' ? 'Disponible' : 'Agotado'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── 4. KPIS, MÉTRICAS & ARQUEO DE CAJA ── */}
          {activeRestTab === 'kpis' && (
            <div className="p-6 space-y-6">
              {/* Global Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500">Facturación Total</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    ${restKPIs?.totalRevenue.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">Ventas acumuladas en salón</p>
                </div>

                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500">Ticket Promedio</span>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    ${restKPIs?.averageTicket.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Gasto medio por orden</p>
                </div>

                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500">Comandas Procesadas</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {restKPIs?.totalOrders || 0}
                  </p>
                  <p className="text-[11px] text-purple-600 font-bold mt-1">
                    {restKPIs?.activeTablesCount || 0} mesas con consumo activo
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500">Tiempo Medio de Cocina</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {restKPIs?.avgPreparationMinutes || 14} min
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Desde comanda a entrega</p>
                </div>
              </div>

              {/* Platos Estrella vs Baja Rotación */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Platos Estrella */}
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <h4 className="font-black text-slate-900 dark:text-white text-sm">
                      Platos Estrella (Top Más Vendidos)
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {restKPIs?.topSellingItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-slate-900 dark:text-white">{item.qty} vendidos</span>
                          <span className="text-[11px] text-amber-600 block">${item.revenue.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Platos de Baja Rotación */}
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <h4 className="font-black text-slate-900 dark:text-white text-sm">
                      Platos de Baja Rotación (Oportunidades de Promoción)
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {restKPIs?.lowSellingItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                        <div className="text-right">
                          <span className="font-semibold text-slate-500">{item.qty} órdenes</span>
                          <span className="text-[10px] text-orange-600 block font-bold">Lanzar combo</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── MODAL DE VERIFICACIÓN DE COMPROBANTE DE PAGO EN CAJA ── */}
      {selectedReceiptOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedReceiptOrder(null)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Verificar Pago • {selectedReceiptOrder.table_name}
                </h3>
                <p className="text-xs text-slate-500">
                  Total a validar: <strong className="text-emerald-600">${selectedReceiptOrder.total.toFixed(2)}</strong>
                </p>
              </div>
              <button onClick={() => setSelectedReceiptOrder(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs space-y-1">
              <p><span className="text-slate-500">Método:</span> <strong className="uppercase">{selectedReceiptOrder.payment_data?.method}</strong></p>
              <p><span className="text-slate-500">Referencia:</span> <strong className="font-mono">{selectedReceiptOrder.payment_data?.reference || 'Sin ref'}</strong></p>
            </div>

            {selectedReceiptOrder.payment_data?.receipt_base64 && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black max-h-96 flex items-center justify-center">
                <img
                  src={selectedReceiptOrder.payment_data.receipt_base64}
                  alt="Comprobante de pago"
                  className="max-h-96 w-auto object-contain"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  reviewPaymentReceipt(selectedReceiptOrder.id, false);
                  loadRestaurantData();
                  setSelectedReceiptOrder(null);
                }}
                className="flex-1 py-3 rounded-2xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs transition-colors"
              >
                Rechazar Comprobante
              </button>
              <button
                type="button"
                onClick={() => {
                  reviewPaymentReceipt(selectedReceiptOrder.id, true);
                  loadRestaurantData();
                  setSelectedReceiptOrder(null);
                }}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 transition-colors"
              >
                Aprobar Pago en Caja ✓
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
          </>
        )}
      </main>

      {/* MODAL DE REDIRECCIÓN INTELIGENTE POR BAJA LABORAL */}
      {redirectingCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setRedirectingCard(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Transferir Tráfico
                  </h3>
                  <p className="text-xs text-slate-500">
                    {redirectingCard.full_name} (/c/{redirectingCard.slug})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRedirectingCard(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Si este colaborador ha sido desvinculado o reasignado, redirige a cualquier cliente que escanee su tarjeta física NFC o visite su enlace hacia otro miembro del equipo o WhatsApp general.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Seleccionar colaborador sustituto:
              </label>
              <select
                value={redirectTarget}
                onChange={(e) => setRedirectTarget(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="">-- Sin redirección (Tarjeta normal) --</option>
                {cards
                  .filter((c) => c.id !== redirectingCard.id && c.is_active)
                  .map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.full_name} ({c.job_title || 'Colaborador'}) - /c/{c.slug}
                    </option>
                  ))}
              </select>

              <div className="text-[11px] text-slate-400">
                O introduce un slug o destino personalizado:
              </div>
              <input
                type="text"
                value={redirectTarget}
                onChange={(e) => setRedirectTarget(e.target.value)}
                placeholder="ej: nuevo-gerente o contacto-soporte"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRedirectingCard(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSavingRedirect}
                onClick={handleSaveCardRedirect}
                className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingRedirect && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Guardar Redirección</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR EMPRESA */}
      {showCreateOrgModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowCreateOrgModal(false)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Registrar Nueva Empresa (B2B)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Crea un espacio corporativo para centralizar la marca y tus colaboradores.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateOrgModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrgSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Organización / Negocio *
                </label>
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    if (!newOrgSlug) {
                      setNewOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                    }
                  }}
                  placeholder="Ej. Inversiones San Pedro C.A."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Identificador / Slug URL *
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l-xl text-xs font-mono">
                    proconnect.app/c/
                  </span>
                  <input
                    type="text"
                    required
                    value={newOrgSlug}
                    onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                    placeholder="inversiones-san-pedro"
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-r-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Logotipo de la Empresa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Logotipo Corporativo (URL o subir archivo)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newOrgLogo}
                    onChange={(e) => setNewOrgLogo(e.target.value)}
                    placeholder="https://tu-empresa.com/logo.png"
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <label className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingLogo ? 'Subiendo...' : 'Subir'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoUpload(e, true)}
                    />
                  </label>
                </div>
                {newOrgLogo && (
                  <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <img src={newOrgLogo} alt="Logo Preview" className="w-8 h-8 object-contain rounded" />
                    <span className="text-[11px] text-emerald-600 font-bold">✓ Logotipo adjunto</span>
                  </div>
                )}
              </div>

              {/* Colores Corporativos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Paleta de Colores de Marca
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Primario</span>
                    <div className="flex items-center gap-1.5 p-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <input
                        type="color"
                        value={newOrgPrimaryColor}
                        onChange={(e) => setNewOrgPrimaryColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={newOrgPrimaryColor}
                        onChange={(e) => setNewOrgPrimaryColor(e.target.value)}
                        className="w-full text-[10px] font-mono bg-transparent border-0 text-slate-700 dark:text-slate-300"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Secundario</span>
                    <div className="flex items-center gap-1.5 p-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <input
                        type="color"
                        value={newOrgSecondaryColor}
                        onChange={(e) => setNewOrgSecondaryColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={newOrgSecondaryColor}
                        onChange={(e) => setNewOrgSecondaryColor(e.target.value)}
                        className="w-full text-[10px] font-mono bg-transparent border-0 text-slate-700 dark:text-slate-300"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Acento</span>
                    <div className="flex items-center gap-1.5 p-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <input
                        type="color"
                        value={newOrgAccentColor}
                        onChange={(e) => setNewOrgAccentColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={newOrgAccentColor}
                        onChange={(e) => setNewOrgAccentColor(e.target.value)}
                        className="w-full text-[10px] font-mono bg-transparent border-0 text-slate-700 dark:text-slate-300"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Fondo</span>
                    <div className="flex items-center gap-1.5 p-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <input
                        type="color"
                        value={newOrgBgColor}
                        onChange={(e) => setNewOrgBgColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={newOrgBgColor}
                        onChange={(e) => setNewOrgBgColor(e.target.value)}
                        className="w-full text-[10px] font-mono bg-transparent border-0 text-slate-700 dark:text-slate-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cupo Máximo de Tarjetas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cupo de Tarjetas NFC Incluidas
                </label>
                <select
                  value={newOrgMaxCards}
                  onChange={(e) => setNewOrgMaxCards(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value={10}>10 Tarjetas (Plan Startup)</option>
                  <option value={25}>25 Tarjetas (Plan Pyme)</option>
                  <option value={50}>50 Tarjetas (Plan Corporativo)</option>
                  <option value={100}>100 Tarjetas (Plan Enterprise)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateOrgModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingOrg}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isCreatingOrg ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creando Empresa...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar y Activar Empresa</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AÑADIR COLABORADOR */}
      {showAddEmployeeModal && currentOrg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowAddEmployeeModal(false)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Añadir Colaborador al Equipo
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Emitir credencial inteligente bajo los colores y marca de {currentOrg.name}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEmployeeModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo del Colaborador *
                </label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="Ej. Ana Cristina Valero"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cargo o Puesto de Trabajo *
                </label>
                <input
                  type="text"
                  required
                  value={empTitle}
                  onChange={(e) => setEmpTitle(e.target.value)}
                  placeholder="Ej. Directora de Operaciones"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico Oficial
                  </label>
                  <input
                    type="email"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    placeholder="ana@empresa.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono Directo / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    placeholder="+58 412 1234567"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl text-[11px] text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span>
                  La tarjeta heredará el logotipo y la paleta de {currentOrg.name} de forma instantánea.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingEmp}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isCreatingEmp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Emitiendo Tarjeta...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Emitir Tarjeta Inteligente</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
