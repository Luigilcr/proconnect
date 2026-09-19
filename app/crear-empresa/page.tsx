/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * ONBOARDING SELF-SERVICE PARA EMPRESAS B2B (/crear-empresa)
 * Permite a cualquier empresa seleccionar su plan, registrar su organización,
 * aplicar cupones de descuento, validar comprobante de pago y crear a su Administrador (org_admin).
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Organization, FullCard, DiscountCoupon } from '@/lib/types';
import { saveOrganization, saveCard } from '@/lib/data/card-store';
import { validateCoupon, recordCouponUsage, saveOrganizationPayment } from '@/lib/data/coupon-store';
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
  Ticket,
  Tag,
  DollarSign,
  Percent,
  Receipt,
  FileText,
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

  // Pasos: 1 = Plan & Cupones, 2 = Datos Empresa, 3 = Admin & Seguridad, 4 = Pago & Comprobante, 5 = Éxito
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Paso 1: Selección de Plan y Cupones
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    CORPORATE_PLANS.some((p) => p.id === initialPlan) ? initialPlan : 'corporativo'
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<DiscountCoupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

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

  // Paso 3: Cuenta del Administrador Principal (org_admin) & Seguridad
  const [adminName, setAdminName] = useState('');
  const [adminJobTitle, setAdminJobTitle] = useState('Director General');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Paso 4: Pago & Comprobante
  const [paymentMethod, setPaymentMethod] = useState<'pago_movil' | 'zelle' | 'transfer' | 'card'>('pago_movil');
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

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
  const rawSubtotal = billingCycle === 'annual' ? selectedPlan.priceAnnual * 12 : selectedPlan.priceMonthly;
  const finalPrice = Math.max(0, Math.round((rawSubtotal - couponDiscount) * 100) / 100);

  // Re-validar cupón si cambia el plan o ciclo
  useEffect(() => {
    if (appliedCoupon) {
      const res = validateCoupon(appliedCoupon.code, selectedPlan.id, rawSubtotal);
      if (res.valid) {
        setCouponDiscount(res.discountAmount);
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponError('El cupón dejó de ser aplicable con la nueva selección.');
      }
    }
  }, [selectedPlanId, billingCycle]);

  // Aplicar cupón de descuento
  const handleApplyCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);
    if (!couponInput.trim()) {
      setCouponError('Ingresa un código de cupón.');
      return;
    }

    const res = validateCoupon(couponInput.trim(), selectedPlan.id, rawSubtotal);
    if (res.valid) {
      setAppliedCoupon(res.coupon || null);
      setCouponDiscount(res.discountAmount);
      setCouponSuccess(res.message);
    } else {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponError(res.message);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponInput('');
    setCouponSuccess(null);
    setCouponError(null);
  };

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
        setExtractingColors(true);
        try {
          const palette = await extractPaletteFromImage(data.url);
          if (palette) {
            setPrimaryColor(palette.primary);
            setSecondaryColor(palette.secondary);
            setAccentColor(palette.accent);
            setBackgroundColor(palette.background);
          }
        } catch {} finally {
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

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 });
      const formData = new FormData();
      formData.append('file', compressed);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success && data.url) {
        setReceiptUrl(data.url);
      } else {
        alert('Error al subir comprobante. Intenta nuevamente.');
      }
    } catch (err) {
      console.warn('Error subiendo comprobante:', err);
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Cálculo de fortaleza de contraseña
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: 'Requerida', color: 'text-slate-400', level: 0 };
    if (pwd.length < 6) return { label: 'Muy Débil (mínimo 6 caracteres)', color: 'text-rose-500', level: 1 };
    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasNumbers = /[0-9]/.test(pwd);
    const hasSymbols = /[^a-zA-Z0-9]/.test(pwd);
    if (pwd.length >= 8 && hasLetters && hasNumbers && hasSymbols) {
      return { label: 'Excelente & Altamente Segura', color: 'text-emerald-500', level: 3 };
    }
    if (pwd.length >= 6 && hasLetters && hasNumbers) {
      return { label: 'Segura', color: 'text-blue-500', level: 2 };
    }
    return { label: 'Media', color: 'text-amber-500', level: 1 };
  };

  const passwordStrength = getPasswordStrength(adminPassword);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validaciones
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
    if (adminPassword !== adminConfirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Por favor verifícalas.');
      setStep(3);
      return;
    }
    if (finalPrice > 0 && (paymentMethod === 'pago_movil' || paymentMethod === 'transfer' || paymentMethod === 'zelle') && !paymentReference.trim()) {
      setErrorMsg('Por favor ingresa el número de referencia o confirmación de tu pago.');
      setStep(4);
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

      // 1. Registro en Supabase Auth
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

      // 5. Registrar el Pago B2B
      saveOrganizationPayment({
        id: 'pay_' + Date.now(),
        organization_id: newOrganization.id,
        organization_name: newOrganization.name,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        billing_cycle: billingCycle,
        subtotal: rawSubtotal,
        discount_amount: couponDiscount,
        total_paid: finalPrice,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        payment_method: paymentMethod,
        reference_number: paymentReference.trim() || 'PROMO-100',
        receipt_url: receiptUrl || null,
        admin_email: adminEmail.trim(),
        admin_name: adminName.trim(),
        admin_phone: adminPhone.trim() || null,
        status: finalPrice === 0 ? 'verified' : 'pending',
        created_at: new Date().toISOString(),
      });

      if (appliedCoupon) {
        recordCouponUsage(appliedCoupon.code);
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('proconnect_active_org_id', orgId);
          localStorage.setItem('proconnect_user_role', 'org_admin');
        } catch {}
      }

      // 6. Sincronizar en Supabase (¡COLUMNAS EXACTAS SIN description!)
      if (isSupabaseEnabled && supabase) {
        try {
          // Guardar organización
          const { error: orgErr } = await supabase.from('organizations').upsert({
            id: newOrganization.id,
            name: newOrganization.name,
            slug: newOrganization.slug,
            logo_url: newOrganization.logo_url,
            brand_colors: newOrganization.brand_colors,
            font_family: newOrganization.font_family,
            allowed_layouts: newOrganization.allowed_layouts,
            enforce_brand_lock: newOrganization.enforce_brand_lock,
            max_cards: newOrganization.max_cards,
          });

          if (orgErr) {
            console.warn('Upsert org aviso:', orgErr.message);
          }

          // Actualizar perfil de usuario como org_admin
          await supabase.from('users').upsert({
            id: adminUserId,
            email: adminEmail.trim(),
            full_name: adminName.trim(),
            role: 'org_admin',
            organization_id: orgId,
          }, { onConflict: 'id' });

          // Guardar tarjeta del administrador
          const dbAdminCard = normalizeCardForDatabase(adminCard, adminUserId, adminEmail);
          const payload = getSupabaseCardPayload(dbAdminCard);
          await supabase.from('cards').upsert(payload);

          // Iniciar sesión automáticamente en el cliente
          try {
            await supabase.auth.signInWithPassword({
              email: adminEmail.trim(),
              password: adminPassword,
            });
          } catch (loginErr) {
            console.warn('Auto sign-in aviso:', loginErr);
          }
        } catch (sbErr) {
          console.warn('Sincronización en Supabase tuvo aviso:', sbErr);
        }
      }

      // 7. Avanzar al paso final de éxito
      setStep(5);
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
        <div className="max-w-3xl mx-auto mb-10">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
            <div
              className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center gap-1.5 ${
                step === 1
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/30 text-purple-700 shadow-sm'
                  : step > 1
                  ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border border-current">
                {step > 1 ? <Check className="w-3 h-3" /> : '1'}
              </span>
              <span className="hidden sm:inline">1. Plan &amp; Cupón</span>
            </div>

            <div
              className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center gap-1.5 ${
                step === 2
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/30 text-purple-700 shadow-sm'
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
              className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center gap-1.5 ${
                step === 3
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/30 text-purple-700 shadow-sm'
                  : step > 3
                  ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border border-current">
                {step > 3 ? <Check className="w-3 h-3" /> : '3'}
              </span>
              <span className="hidden sm:inline">3. Administrador</span>
            </div>

            <div
              className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center gap-1.5 ${
                step >= 4
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/30 text-purple-700 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border border-current">
                {step === 5 ? <Check className="w-3 h-3" /> : '4'}
              </span>
              <span className="hidden sm:inline">4. Pago &amp; Activación</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── PASO 1: SELECCIÓN DE PLAN & CUPÓN DE DESCUENTO ── */}
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

            {/* Caja de Canje de Cupones de Descuento */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 border border-purple-200 dark:border-purple-800">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      ¿Tienes un Cupón de Descuento Corporativo?
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Ingresa tu código promocional para aplicar el beneficio directo a tu plan.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="EJ: PROMO50"
                    disabled={!!appliedCoupon}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold uppercase outline-none focus:border-purple-600 disabled:opacity-50"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                    >
                      Quitar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      Aplicar
                    </button>
                  )}
                </div>
              </div>

              {couponSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{couponSuccess}</span>
                </div>
              )}

              {couponError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}

              {/* Desglose de Precios */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-500">Plan: <strong className="text-slate-800 dark:text-slate-200">{selectedPlan.name}</strong> ({billingCycle === 'annual' ? 'Facturación Anual' : 'Facturación Mensual'})</span>
                  <div className="text-[11px] text-slate-400">Subtotal normal: ${rawSubtotal} USD</div>
                </div>

                <div className="flex items-center gap-3">
                  {couponDiscount > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block line-through">${rawSubtotal} USD</span>
                      <span className="text-xs font-bold text-emerald-600">Ahorras -${couponDiscount} USD</span>
                    </div>
                  )}
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">Total a pagar:</span>
                    <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                      ${finalPrice} <span className="text-xs font-medium text-slate-400">USD</span>
                    </span>
                  </div>
                </div>
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
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej. Inversiones Conexión C.A."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-purple-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Enlace Web Corporativo (Slug) *
                </label>
                <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden text-xs">
                  <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-750 text-slate-400 font-mono text-[11px] border-r border-slate-200 dark:border-slate-700 flex items-center">
                    proconnect.app/org/
                  </span>
                  <input
                    type="text"
                    value={companySlug}
                    onChange={(e) => setCompanySlug(e.target.value)}
                    placeholder="mi-empresa"
                    className="w-full px-3 py-2.5 bg-transparent font-mono text-xs font-bold text-purple-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Industria o Sector Comercial
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-purple-600"
                >
                  <option value="Servicios Profesionales">Servicios Profesionales / Consultoría</option>
                  <option value="Tecnología e Informática">Tecnología e Informática</option>
                  <option value="Inmobiliaria y Construcción">Inmobiliaria y Construcción</option>
                  <option value="Salud y Medicina">Salud y Medicina</option>
                  <option value="Gastronomía y Restaurantes">Gastronomía y Restaurantes</option>
                  <option value="Comercio y Retail">Comercio y Retail</option>
                  <option value="Finanzas y Seguros">Finanzas y Seguros</option>
                  <option value="Otro">Otro Sector</option>
                </select>
              </div>

              {/* Subida de Logotipo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Logotipo Corporativo (PNG con fondo transparente recomendado)
                </label>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <div className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center bg-white dark:bg-slate-800">
                      <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : null}
                  <label className="flex-1 cursor-pointer">
                    <div className="w-full py-2.5 px-3 rounded-xl border border-dashed border-purple-300 dark:border-purple-800 hover:border-purple-500 bg-purple-50/30 dark:bg-purple-950/20 text-xs font-bold text-purple-600 flex items-center justify-center gap-2 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>{uploadingLogo ? 'Procesando...' : logoUrl ? 'Cambiar Logotipo' : 'Subir Logotipo'}</span>
                    </div>
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

        {/* ── PASO 3: CUENTA DEL ADMINISTRADOR PRINCIPAL & SEGURIDAD ESTRICTA ── */}
        {step === 3 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in">
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
                    placeholder="Ej. Luigi Colonico"
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
                    placeholder="+58 424 123 4567"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Campo 1: Contraseña con máscara estricta */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Contraseña para Acceso al Portal B2B *
                  </label>
                  <span className={`text-[10px] font-bold ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-purple-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Campo 2: Confirmar Contraseña */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none ${
                      adminConfirmPassword && adminPassword !== adminConfirmPassword
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-purple-600'
                    }`}
                    required
                  />
                  {adminConfirmPassword && adminPassword === adminConfirmPassword && (
                    <Check className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                {adminConfirmPassword && adminPassword !== adminConfirmPassword && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Las contraseñas no coinciden.
                  </p>
                )}
              </div>
            </div>

            {/* Banner de Seguridad y Privacidad */}
            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-slate-900 dark:text-white">Privacidad y Seguridad Garantizada</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tus credenciales están protegidas con encriptación militar en la nube (bcrypt/Argon2). Tu clave nunca se almacena en texto plano ni es visible para terceros.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
                    alert('Por favor completa todos los campos obligatorios del administrador.');
                    return;
                  }
                  if (adminPassword.length < 6) {
                    alert('La contraseña debe tener al menos 6 caracteres.');
                    return;
                  }
                  if (adminPassword !== adminConfirmPassword) {
                    alert('Las contraseñas no coinciden. Por favor verifícalas antes de continuar.');
                    return;
                  }
                  setStep(4);
                }}
                className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-md shadow-purple-600/30 flex items-center gap-2 transition-transform hover:scale-[1.02]"
              >
                <span>Siguiente: Pago y Verificación</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 4: VERIFICACIÓN DE PAGO & ACTIVACIÓN B2B ── */}
        {step === 4 && (
          <form
            onSubmit={handleCreateCompany}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in"
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <span>Verificación de Pago y Activación de Cuenta</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Selecciona tu método de pago preferido e ingresa el comprobante o referencia bancaria.
                  </p>
                </div>
              </div>
            </div>

            {/* Resumen del Monto a Pagar */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-slate-50 dark:via-slate-800/40 to-brand-blue/10 border border-purple-200/80 dark:border-purple-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 block uppercase tracking-wider text-[10px]">
                  Resumen de Suscripción
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedPlan.name} ({billingCycle === 'annual' ? 'Facturación Anual' : 'Facturación Mensual'})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cupo para {selectedPlan.maxCards} tarjetas digitales • Brand Lock • CRM B2B
                </p>
                {appliedCoupon && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                    <Ticket className="w-3.5 h-3.5" /> Cupón {appliedCoupon.code} aplicado (-${couponDiscount} USD)
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-slate-400 text-xs block">Total a transferir:</span>
                <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
                  ${finalPrice} <span className="text-xs font-bold text-slate-400">USD</span>
                </div>
                {finalPrice === 0 && (
                  <span className="text-xs font-bold text-emerald-600">¡100% Bonificado con Cupón!</span>
                )}
              </div>
            </div>

            {/* Métodos de Pago Disponibles */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Selecciona tu Método de Pago:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pago_movil')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    paymentMethod === 'pago_movil'
                      ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-700 ring-2 ring-purple-600/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="text-base mb-1">📱</div>
                  <div className="font-black text-xs">Pago Móvil</div>
                  <div className="text-[10px] text-slate-400">Venezuela (Bs)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('zelle')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    paymentMethod === 'zelle'
                      ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-700 ring-2 ring-purple-600/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="text-base mb-1">⚡</div>
                  <div className="font-black text-xs">Zelle</div>
                  <div className="text-[10px] text-slate-400">Transferencia USD</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    paymentMethod === 'transfer'
                      ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-700 ring-2 ring-purple-600/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="text-base mb-1">🏦</div>
                  <div className="font-black text-xs">Transferencia</div>
                  <div className="text-[10px] text-slate-400">Banesco / Mercantil</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    paymentMethod === 'card'
                      ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-700 ring-2 ring-purple-600/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="text-base mb-1">💳</div>
                  <div className="font-black text-xs">Tarjeta Int.</div>
                  <div className="text-[10px] text-slate-400">Visa / Mastercard</div>
                </button>
              </div>
            </div>

            {/* Datos Bancarios Oficiales de ProConnect */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-purple-600" />
                <span>Datos Oficiales para Realizar el Pago:</span>
              </div>

              {paymentMethod === 'pago_movil' && (
                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                  <div><strong>Banco:</strong> Banesco (0134)</div>
                  <div><strong>Teléfono:</strong> 0424-2565014</div>
                  <div><strong>Cédula / RIF:</strong> V-24.256.014</div>
                  <div><strong>Titular:</strong> Luigi Colonico / ProConnect C.A.</div>
                  <div className="text-slate-400 font-sans mt-1">Tasa oficial BCV del día aplicada a la fecha del pago.</div>
                </div>
              )}

              {paymentMethod === 'zelle' && (
                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                  <div><strong>Correo Zelle:</strong> luigicolonico@gmail.com</div>
                  <div><strong>Titular:</strong> Luigi Colonico / ProConnect</div>
                  <div className="text-slate-400 font-sans mt-1">Colocar en el memo o nota el nombre de tu empresa ({companyName || 'Empresa'}).</div>
                </div>
              )}

              {paymentMethod === 'transfer' && (
                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                  <div><strong>Banco:</strong> Banesco Banco Universal</div>
                  <div><strong>Cuenta Corriente:</strong> 0134-0371-29-3711000000</div>
                  <div><strong>RIF:</strong> J-50123456-7</div>
                  <div><strong>Beneficiario:</strong> ProConnect Tecnologías C.A.</div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <p>Pasarela de pago internacional segura procesada con cifrado SSL de 256 bits.</p>
                  <p className="text-slate-400 font-sans">Si tu pago fue realizado mediante pasarela en línea, ingresa el ID de transacción a continuación.</p>
                </div>
              )}
            </div>

            {/* Campos de Comprobante y Referencia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Número de Referencia Bancaria / Confirmación Zelle *
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder={finalPrice === 0 ? 'Cupón 100% Bonificado' : 'Ej. 084920492 / ZL-39201'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-purple-600"
                    required={finalPrice > 0}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Adjuntar Comprobante (Captura o Foto)
                </label>
                <label className="cursor-pointer block">
                  <div className="w-full py-2.5 px-3.5 rounded-xl border border-dashed border-purple-300 dark:border-purple-800 hover:border-purple-500 bg-purple-50/30 dark:bg-purple-950/20 text-xs font-bold text-purple-600 flex items-center justify-center gap-2 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingReceipt ? 'Subiendo comprobante...' : receiptUrl ? '✅ Comprobante Adjuntado' : 'Subir Imagen del Comprobante'}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    disabled={uploadingReceipt}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-brand-blue hover:from-purple-500 hover:to-brand-blue/90 text-white font-black text-sm shadow-xl shadow-purple-600/30 flex items-center gap-2 transition-transform hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Registrando Empresa &amp; Activando Portal...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Confirmar Pago &amp; Activar Portal B2B</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── PASO 5: ÉXITO Y ENTRADA DIRECTA AL DASHBOARD B2B ── */}
        {step === 5 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6 max-w-xl mx-auto animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                ¡Empresa Creada &amp; Pago Registrado!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                La organización <strong>{companyName}</strong> está registrada y <strong>{adminName}</strong> ha sido configurado como su Administrador Principal con rol <code>org_admin</code>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Plan Activado:</span>
                <span className="font-bold text-purple-600">{selectedPlan.name} ({selectedPlan.maxCards} Tarjetas)</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Pago / Referencia:</span>
                <span className="font-mono text-emerald-600 font-bold">{paymentReference || 'Bonificado 100%'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Brand Lock:</span>
                <span className="font-bold text-emerald-600">{enforceBrandLock ? 'Activo' : 'Inactivo'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Usuario Administrador:</span>
                <span className="font-mono text-[11px] text-slate-500">{adminEmail}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <Link
                href="/org-dashboard"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-brand-blue hover:from-purple-500 hover:to-brand-blue/90 text-white font-black text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
              >
                <span>Entrar Ahora al Panel B2B (Org Admin)</span>
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
