/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * ONBOARDING SELF-SERVICE PARA EMPRESAS B2B (/crear-empresa)
 * Permite a cualquier empresa seleccionar su plan, registrar su organización y
 * crear automáticamente a su Administrador (org_admin) para gestionar su equipo.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Organization, FullCard } from '@/lib/types';
import { saveOrganization, saveCard } from '@/lib/data/card-store';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { compressImage } from '@/lib/image-compressor';
import { extractPaletteFromImage } from '@/lib/color-extractor';
import { normalizeCardForDatabase, getSupabaseCardPayload } from '@/lib/db-normalize';
import {
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
  Mail,
  User,
  Phone,
  Briefcase,
  Palette,
  Upload,
  CreditCard,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  QrCode,
  Zap,
} from 'lucide-react';

const CORPORATE_PLANS = [
  {
    id: 'pyme',
    name: 'Plan Pyme',
    badge: 'Ideal para Equipos Pequeños',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    maxCards: 10,
    priceMonthly: 49,
    priceAnnual: 39,
    description: 'Hasta 10 tarjetas corporativas, control de marca y CRM integrado.',
    features: [
      'Hasta 10 Tarjetas Digitales NFC',
      'Panel de Empresa (Org-Admin)',
      'Control Estricto de Marca (Brand Lock)',
      'CRM de Prospectos unificado',
      'Códigos QR descargables en alta resolución',
    ],
  },
  {
    id: 'corporativo',
    name: 'Plan Corporativo',
    badge: 'El Más Popular',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    maxCards: 50,
    priceMonthly: 149,
    priceAnnual: 119,
    popular: true,
    description: 'Hasta 50 tarjetas corporativas, importación masiva por CSV y analíticas avanzadas.',
    features: [
      'Hasta 50 Tarjetas Digitales NFC',
      'Importación masiva de empleados por CSV',
      'Redirección inteligente por baja laboral',
      'Control de Marca (Brand Lock) automático',
      'CRM comercial con ranking de ventas',
      'Soporte prioritario y asesoría en impresión NFC',
    ],
  },
  {
    id: 'enterprise',
    name: 'Plan Enterprise',
    badge: 'Sin Límites',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    maxCards: 250,
    priceMonthly: 299,
    priceAnnual: 239,
    description: 'Para organizaciones de gran escala que requieren personalización total.',
    features: [
      'Más de 250 Tarjetas Digitales',
      'Múltiples administradores y roles jerárquicos',
      'Integraciones API personalizadas',
      'Diseño de plantilla a medida',
      'SLA garantizado y asesor dedicado',
    ],
  },
];

function CrearEmpresaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'corporativo';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Paso 1: Selección de Plan
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    CORPORATE_PLANS.some((p) => p.id === initialPlan) ? initialPlan : 'corporativo'
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'card' | 'zelle'>('card');

  // Paso 2: Datos de la Empresa
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [industry, setIndustry] = useState('Servicios Profesionales');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0EA5E9');
  const [secondaryColor, setSecondaryColor] = useState('#0369A1');
  const [accentColor, setAccentColor] = useState('#38BDF8');
  const [backgroundColor, setBackgroundColor] = useState('#0F172A');
  const [enforceBrandLock, setEnforceBrandLock] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [extractingColors, setExtractingColors] = useState(false);

  // Paso 3: Cuenta del Administrador Principal (org_admin)
  const [adminName, setAdminName] = useState('');
  const [adminJobTitle, setAdminJobTitle] = useState('Director General');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estado de envío
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-generar slug de empresa
  useEffect(() => {
    if (companyName && !companySlug) {
      const generated = companyName
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');
      setCompanySlug(generated);
    }
  }, [companyName, companySlug]);

  const selectedPlan = CORPORATE_PLANS.find((p) => p.id === selectedPlanId) || CORPORATE_PLANS[1];

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
      const formData = new FormData();
      formData.append('file', compressed);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success && data.url) {
        setLogoUrl(data.url);
        // Extraer colores automáticamente del logo
        setExtractingColors(true);
        try {
          const palette = await extractPaletteFromImage(data.url);
          if (palette) {
            setPrimaryColor(palette.primary);
            setSecondaryColor(palette.secondary);
            setAccentColor(palette.accent);
            setBackgroundColor(palette.background);
          }
        } catch {
          // Ignorar error de extracción
        } finally {
          setExtractingColors(false);
        }
      } else {
        alert('Error al subir el logo: ' + (data.error || 'Verifica el formato del archivo'));
      }
    } catch (err) {
      console.error('Error al subir logo:', err);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!companyName.trim()) {
      setErrorMsg('Por favor ingresa el nombre de la empresa.');
      setStep(2);
      return;
    }
    if (!adminEmail.trim() || !adminPassword.trim() || !adminName.trim()) {
      setErrorMsg('Por favor completa todos los datos del administrador.');
      setStep(3);
      return;
    }
    if (adminPassword.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      setStep(3);
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanSlug = (companySlug.trim() || companyName.trim())
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-');

      const orgId = crypto.randomUUID ? crypto.randomUUID() : 'org_' + Date.now();
      let adminUserId = crypto.randomUUID ? crypto.randomUUID() : 'user_' + Date.now();

      // 1. Registro en Supabase Auth si está habilitado
      if (isSupabaseEnabled && supabase) {
        try {
          const { data: authData, error: authErr } = await supabase.auth.signUp({
            email: adminEmail.trim(),
            password: adminPassword,
            options: {
              data: {
                full_name: adminName.trim(),
                organization_id: orgId,
                role: 'org_admin',
              },
            },
          });

          if (authErr && !authErr.message.includes('already registered')) {
            console.warn('Advertencia en signUp:', authErr.message);
          }

          if (authData?.user?.id) {
            adminUserId = authData.user.id;
          }
        } catch (err) {
          console.warn('Error en Supabase auth:', err);
        }
      }

      // 2. Construir Organización
      const newOrganization: Organization = {
        id: orgId,
        name: companyName.trim(),
        slug: cleanSlug,
        logo_url: logoUrl.trim() || null,
        brand_colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
          background: backgroundColor,
        },
        font_family: 'Inter',
        allowed_layouts: ['modern', 'executive', 'minimal', 'banner_header', 'card_id_badge', 'creative_grid'],
        enforce_brand_lock: enforceBrandLock,
        max_cards: selectedPlan.maxCards,
        description: `Organización del sector ${industry}.`,
        created_at: new Date().toISOString(),
      };

      // 3. Crear Tarjeta oficial del Administrador
      const adminCardId = crypto.randomUUID ? crypto.randomUUID() : 'card_' + Date.now();
      const adminCardSlug = `${cleanSlug}-admin-${Date.now().toString().slice(-4)}`;

      const adminCard: FullCard = {
        id: adminCardId,
        user_id: adminUserId,
        organization_id: orgId,
        slug: adminCardSlug,
        is_active: true,
        full_name: adminName.trim(),
        job_title: adminJobTitle.trim() || 'Director General',
        company_name: companyName.trim(),
        bio: `Administrador de ${companyName.trim()}. Contacto oficial y verificado.`,
        profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
        cover_photo_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
        logo_url: logoUrl.trim() || null,
        layout_type: 'executive',
        avatar_position: 'header_floating',
        button_style: 'filled',
        border_radius: 'lg',
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        background_color: backgroundColor,
        font_family: 'Inter',
        font_weight: 'semibold',
        include_photo: true,
        custom_vcf_notes: `Contacto verificado de ${companyName.trim()}. Plan B2B ProConnect.`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: null,
        plan_duration: 'lifetime',
        links: [
          ...(adminEmail.trim()
            ? [
                {
                  id: crypto.randomUUID ? crypto.randomUUID() : 'link_' + Date.now(),
                  card_id: adminCardId,
                  type: 'email' as const,
                  label: 'Correo Electrónico',
                  url: `mailto:${adminEmail.trim()}`,
                  is_active: true,
                  position_order: 1,
                },
              ]
            : []),
          ...(adminPhone.trim()
            ? [
                {
                  id: crypto.randomUUID ? crypto.randomUUID() : 'link_p_' + Date.now(),
                  card_id: adminCardId,
                  type: 'whatsapp' as const,
                  label: 'WhatsApp Oficial',
                  url: `https://wa.me/${adminPhone.replace(/[^0-9]/g, '')}`,
                  is_active: true,
                  position_order: 2,
                },
              ]
            : []),
        ],
        multimedia: [],
      };

      // 4. Guardar en Stores Locales
      saveOrganization(newOrganization);
      saveCard(adminCard);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('proconnect_active_org_id', orgId);
          localStorage.setItem('proconnect_user_role', 'org_admin');
        } catch {}
      }

      // 5. Sincronizar en Supabase si está disponible
      if (isSupabaseEnabled && supabase) {
        try {
          // Guardar organización
          await supabase.from('organizations').upsert({
            id: newOrganization.id,
            name: newOrganization.name,
            slug: newOrganization.slug,
            logo_url: newOrganization.logo_url,
            brand_colors: newOrganization.brand_colors,
            font_family: newOrganization.font_family,
            allowed_layouts: newOrganization.allowed_layouts,
            enforce_brand_lock: newOrganization.enforce_brand_lock,
            max_cards: newOrganization.max_cards,
            description: newOrganization.description,
          });

          // Actualizar perfil de usuario como org_admin
          await supabase.from('users').upsert({
            id: adminUserId,
            email: adminEmail.trim(),
            full_name: adminName.trim(),
            role: 'org_admin',
            organization_id: orgId,
          });

          // Guardar tarjeta del administrador
          const dbAdminCard = normalizeCardForDatabase(adminCard, adminUserId, adminEmail);
          const payload = getSupabaseCardPayload(dbAdminCard);
          await supabase.from('cards').upsert(payload);
        } catch (sbErr) {
          console.warn('Sincronización en Supabase tuvo aviso:', sbErr);
        }
      }

      // 6. Avanzar al paso final de éxito
      setStep(4);
    } catch (err: any) {
      console.error('Error al crear la cuenta corporativa:', err);
      setErrorMsg(err?.message || 'Hubo un problema al crear la cuenta de la empresa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-brand-blue/20">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* Cabecera Principal */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold shadow-sm">
            <Building2 className="w-3.5 h-3.5" />
            <span>Portal de Registro Corporativo &amp; Empresas</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Equipa a tu empresa con{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-brand-cyan to-purple-600">
              Conectividad Inteligente.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Crea tu cuenta de empresa, configura tu marca corporativa con Brand Lock y accede a tu panel para invitar colaboradores y centralizar prospectos.
          </p>
        </div>

        {/* Indicador de Pasos */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
            <div
              className={`p-3 rounded-2xl border transition-all flex items-center justify-center gap-2 ${
                step === 1
                  ? 'border-brand-blue bg-blue-50 dark:bg-blue-950/30 text-brand-blue shadow-sm'
                  : step > 1
                  ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border border-current">
                {step > 1 ? <Check className="w-3 h-3" /> : '1'}
              </span>
              <span className="hidden sm:inline">1. Plan B2B</span>
            </div>

            <div
              className={`p-3 rounded-2xl border transition-all flex items-center justify-center gap-2 ${
                step === 2
                  ? 'border-brand-blue bg-blue-50 dark:bg-blue-950/30 text-brand-blue shadow-sm'
                  : step > 2
                  ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border border-current">
                {step > 2 ? <Check className="w-3 h-3" /> : '2'}
              </span>
              <span className="hidden sm:inline">2. Tu Empresa</span>
            </div>

            <div
              className={`p-3 rounded-2xl border transition-all flex items-center justify-center gap-2 ${
                step >= 3
                  ? 'border-brand-blue bg-blue-50 dark:bg-blue-950/30 text-brand-blue shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border border-current">
                {step === 4 ? <Check className="w-3 h-3" /> : '3'}
              </span>
              <span className="hidden sm:inline">3. Administrador</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── PASO 1: SELECCIÓN DE PLAN ── */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Selector de Facturación */}
            <div className="flex justify-center items-center gap-3">
              <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                Mensual
              </span>
              <button
                type="button"
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-300 dark:bg-slate-700 transition-colors focus:outline-none"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    billingCycle === 'annual' ? 'translate-x-6 bg-brand-cyan' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === 'annual' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                <span>Anual</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  -20% Ahorro
                </span>
              </span>
            </div>

            {/* Tarjetas de Planes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {CORPORATE_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`cursor-pointer rounded-3xl p-6 border transition-all flex flex-col justify-between relative ${
                      isSelected
                        ? 'border-purple-600 dark:border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 shadow-lg shadow-purple-500/10 ring-2 ring-purple-600/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                        Recomendado B2B
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">{plan.name}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${plan.badgeColor}`}>
                          {plan.maxCards} tarjetas
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">
                        {plan.description}
                      </p>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-slate-900 dark:text-white">${price}</span>
                          <span className="text-xs text-slate-400 font-semibold">/mes</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {billingCycle === 'annual' ? `Facturado $${price * 12}/año` : 'Sin compromiso de permanencia'}
                        </p>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6">
                      <button
                        type="button"
                        className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? <Check className="w-4 h-4" /> : null}
                        <span>{isSelected ? 'Plan Seleccionado' : 'Elegir este Plan'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Métodos de Pago Disponibles */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <span>Método de Activación y Pago de la Suscripción</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Activación inmediata de cuenta. Métodos: Tarjeta Internacional, Pago Móvil (Venezuela), Transferencia o Zelle.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    paymentMethod === 'card'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  💳 Tarjeta
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    paymentMethod === 'transfer'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  🏦 Pago Móvil / Banco
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('zelle')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    paymentMethod === 'zelle'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  ⚡ Zelle
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-md shadow-purple-600/30 flex items-center gap-2 transition-transform hover:scale-[1.02]"
              >
                <span>Siguiente: Datos de la Empresa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 2: DATOS DE LA EMPRESA ── */}
        {step === 2 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <span>Identidad y Marca de la Empresa</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Personaliza el nombre oficial, el logo y los colores corporativos que heredarán todas las tarjetas de tu equipo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nombre Oficial de la Empresa *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej. Grupo Financiero Horizon C.A."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Enlace Web Corporativo (Slug único)
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 rounded-l-xl bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-700 text-slate-400 text-xs font-mono">
                    proconnect.app/org/
                  </span>
                  <input
                    type="text"
                    value={companySlug}
                    onChange={(e) => setCompanySlug(e.target.value)}
                    placeholder="horizon-group"
                    className="w-full px-3 py-2.5 rounded-r-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-purple-600 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Sector / Industria
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-purple-600"
                >
                  <option value="Servicios Profesionales">Servicios Profesionales &amp; Consultoría</option>
                  <option value="Inmobiliaria & Construcción">Inmobiliaria &amp; Construcción</option>
                  <option value="Tecnología & Telecomunicaciones">Tecnología &amp; Telecomunicaciones</option>
                  <option value="Banca, Seguros & Finanzas">Banca, Seguros &amp; Finanzas</option>
                  <option value="Salud & Medicina">Salud, Clínicas &amp; Farmacia</option>
                  <option value="Gastronomía & Restaurantes">Gastronomía &amp; Restaurantes</option>
                  <option value="Leyes & Asesoría Jurídica">Leyes &amp; Asesoría Jurídica</option>
                  <option value="Otro">Otro Sector</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Logotipo Corporativo
                </label>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 flex items-center justify-center relative flex-shrink-0">
                      <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : null}

                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingLogo ? 'Subiendo...' : logoUrl ? 'Cambiar Logotipo' : 'Subir Logo PNG / SVG'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Paleta de Colores de Marca */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-600" />
                  <span>Colores Oficiales de Marca</span>
                </label>
                {extractingColors && (
                  <span className="text-[10px] font-bold text-purple-600 animate-pulse">
                    ✨ Extrayendo colores con IA...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Primario</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs font-mono font-bold">{primaryColor}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Secundario</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs font-mono font-bold">{secondaryColor}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Acento</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs font-mono font-bold">{accentColor}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Fondo</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs font-mono font-bold">{backgroundColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Política de Brand Lock */}
            <div className="pt-2">
              <label className="flex items-start gap-3 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enforceBrandLock}
                  onChange={(e) => setEnforceBrandLock(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-600" />
                    <span>Activar Bloqueo de Marca Oficial (Brand Lock)</span>
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Garantiza que ningún colaborador pueda alterar los colores ni logotipo oficial en sus tarjetas.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Plan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!companyName.trim()) {
                    alert('Por favor ingresa el nombre de la empresa.');
                    return;
                  }
                  setStep(3);
                }}
                className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-md shadow-purple-600/30 flex items-center gap-2 transition-transform hover:scale-[1.02]"
              >
                <span>Siguiente: Administrador de Empresa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 3: CUENTA DEL ADMINISTRADOR PRINCIPAL ── */}
        {step === 3 && (
          <form
            onSubmit={handleCreateCompany}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in"
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                    <span>Primer Usuario: Administrador de la Empresa (org_admin)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Este usuario tendrá acceso completo para asignar roles, invitar colaboradores, ver el CRM y gestionar las tarjetas.
                  </p>
                </div>
                <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-black">
                  👑 Rol: Org Admin
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nombre Completo del Administrador *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Ej. Roberto Sánchez"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-purple-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Cargo Corporativo *
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminJobTitle}
                    onChange={(e) => setAdminJobTitle(e.target.value)}
                    placeholder="Director General / Gerente de Operaciones"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-purple-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Correo Electrónico Corporativo *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@tuempresa.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-purple-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Teléfono / WhatsApp Corporativo
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="+58 412 123 4567"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Contraseña para Acceso al Portal B2B *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-purple-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Resumen del Pedido */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Resumen: {selectedPlan.name} ({billingCycle === 'annual' ? 'Anual' : 'Mensual'})
                </span>
                <p className="text-[11px] text-slate-500">
                  Cupo de hasta {selectedPlan.maxCards} tarjetas digitales • Panel B2B completo
                </p>
              </div>

              <div className="text-right">
                <span className="text-lg font-black text-purple-600">
                  ${billingCycle === 'annual' ? selectedPlan.priceAnnual : selectedPlan.priceMonthly}
                  <span className="text-xs font-normal text-slate-400">/mes</span>
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-brand-blue hover:from-purple-500 hover:to-brand-blue/90 text-white font-black text-sm shadow-xl shadow-purple-600/30 flex items-center gap-2 transition-transform hover:scale-[1.02] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creando Organización &amp; Administrador...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Crear Cuenta de Empresa &amp; Activar Portal</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── PASO 4: ÉXITO Y ENTRADA AL DASHBOARD B2B ── */}
        {step === 4 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6 max-w-xl mx-auto animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                ¡Empresa Creada Exitosamente!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                La organización <strong>{companyName}</strong> está activa y <strong>{adminName}</strong> ha sido configurado como su Administrador Principal con rol <code>org_admin</code>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Cupo disponible:</span>
                <span className="font-bold text-purple-600">{selectedPlan.maxCards} Colaboradores</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Brand Lock:</span>
                <span className="font-bold text-emerald-600">{enforceBrandLock ? 'Activo' : 'Inactivo'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Acceso inmediato:</span>
                <span className="font-mono text-[11px] text-slate-500">{adminEmail}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/org-dashboard"
                className="flex-1 py-3.5 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
              >
                <span>Ir al Panel Corporativo B2B</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function CrearEmpresaPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CrearEmpresaContent />
    </React.Suspense>
  );
}

