/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * ASISTENTE DE CREACIÓN RÁPIDA EN 3 PASOS (1 MES GRATIS)
 * Paso 1: Datos Personales & Foto
 * Paso 2: Elección de Plantilla Visual (Incluye Crimson Quote, HiHello White, etc.)
 * Paso 3: ¡Tu Tarjeta Lista! (Enlace, QR y botón para compartir)
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PRESET_TEMPLATES } from '@/lib/data/demo-data';
import { DigitalCard } from '@/components/card/DigitalCard';
import { saveCard } from '@/lib/data/card-store';
import { FullCard, PresetTemplate } from '@/lib/types';
import { saveCardDraft, loadCardDraft, clearCardDraft } from '@/lib/draft-store';
import { AuthModal } from '@/components/auth/AuthModal';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { compressImage } from '@/lib/image-compressor';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Smartphone,
  QrCode,
  Share2,
  Copy,
  ExternalLink,
  Gift,
  Building2,
  Briefcase,
  Phone,
  Mail,
  User,
  Quote,
  Layers,
  Palette,
  Eye,
  Camera,
  Upload,
  Loader2,
  Sliders,
  Type,
  Globe,
  Instagram,
  Linkedin,
  Video,
} from 'lucide-react';

export default function CrearTarjetaPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Datos del Paso 1
  const [fullName, setFullName] = useState('Alejandro Salazar');
  const [jobTitle, setJobTitle] = useState('Director Comercial | B2B');
  const [companyName, setCompanyName] = useState('ProConnect Enterprise');
  const [phoneNumber, setPhoneNumber] = useState('+58 412 555 1234');
  const [email, setEmail] = useState('contacto@proconnect.app');
  const [website, setWebsite] = useState('https://proconnect.app');
  const [instagram, setInstagram] = useState('@proconnect.app');
  const [linkedin, setLinkedin] = useState('proconnect-saas');
  const [tiktok, setTiktok] = useState('');
  const [bio, setBio] = useState('Somos tu aliado estratégico en conectividad inteligente y transformación digital.');
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [uploadCoverMessage, setUploadCoverMessage] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadLogoMessage, setUploadLogoMessage] = useState<string | null>(null);

  // Plantilla seleccionada (Paso 2)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('crimson_quote');
  const [customPrimaryColor, setCustomPrimaryColor] = useState<string>('#DC2626');
  const [customBgColor, setCustomBgColor] = useState<string>('#0B0F17');
  const [customFont, setCustomFont] = useState<string>('Inter');
  const [customRadius, setCustomRadius] = useState<any>('lg');
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [enableCrm, setEnableCrm] = useState<boolean>(true);

  // Estados de Persistencia Temporal (Auto-Save) y Product-Led Auth
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const [copied, setCopied] = useState(false);
  const [stableCardId] = useState<string>(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'c0000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0').slice(-12);
  });

  // Obtener plantilla activa
  const activeTemplate: PresetTemplate =
    PRESET_TEMPLATES.find((t) => t.id === selectedTemplateId) || PRESET_TEMPLATES[0];

  // Slug generado
  const slug = fullName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/c/${slug}`
    : `https://proconnect.app/c/${slug}`;

  // Construir objeto FullCard en memoria para el simulador con UUID válido
  const uniqueCardId = slug === 'luigi-colonico' ? 'c0000000-0000-0000-0000-000000000099' : stableCardId;
  const previewCard: FullCard = {
    id: uniqueCardId,
    user_id: 'user-created',
    slug: slug,
    is_active: true,
    full_name: fullName || 'Tu Nombre y Apellido',
    job_title: jobTitle || 'Tu Cargo o Especialidad',
    company_name: companyName || 'Tu Empresa o Marca',
    bio: bio || 'Tu lema o propuesta de valor destacada.',
    profile_photo_url: avatarUrl,
    cover_photo_url: coverUrl,
    logo_url: logoUrl,

    layout_type: activeTemplate.layout_type,
    avatar_position: activeTemplate.avatar_position,
    button_style: activeTemplate.button_style,

    primary_color: customPrimaryColor || activeTemplate.colors.primary,
    secondary_color: activeTemplate.colors.secondary,
    accent_color: customPrimaryColor || activeTemplate.colors.accent,
    background_color: customBgColor || activeTemplate.colors.background,

    font_family: customFont || activeTemplate.font_family,
    font_weight: activeTemplate.font_weight,
    border_radius: customRadius || activeTemplate.border_radius,

    background_texture: activeTemplate.background_texture || 'none',
    avatar_effect: activeTemplate.avatar_effect || 'none',
    card_badge: activeTemplate.card_badge || 'none',

    include_photo: true,
    custom_vcf_notes: 'Tarjeta generada con ProConnect',
    enable_crm_capture: enableCrm,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    plan_duration: 'monthly',

    links: [
      {
        id: 'link-wa',
        card_id: uniqueCardId,
        type: 'whatsapp',
        label: 'Conversar por WhatsApp',
        url: phoneNumber.startsWith('http')
          ? phoneNumber
          : `https://wa.me/${phoneNumber.replace(/[^\d]/g, '')}`,
        is_active: !!phoneNumber,
        position_order: 1,
      },
      {
        id: 'link-call',
        card_id: uniqueCardId,
        type: 'phone',
        label: 'Llamar Directamente',
        url: phoneNumber.startsWith('tel:')
          ? phoneNumber
          : `tel:${phoneNumber.replace(/[^\d+]/g, '')}`,
        is_active: !!phoneNumber,
        position_order: 2,
      },
      {
        id: 'link-mail',
        card_id: uniqueCardId,
        type: 'email',
        label: 'Enviar Correo Electrónico',
        url: email.startsWith('mailto:') ? email : `mailto:${email}`,
        is_active: !!email,
        position_order: 3,
      },
      ...(website
        ? [
            {
              id: 'link-web',
              card_id: uniqueCardId,
              type: 'website' as const,
              label: 'Sitio Web',
              url: website.startsWith('http') ? website : `https://${website}`,
              is_active: true,
              position_order: 4,
            },
          ]
        : []),
      ...(instagram
        ? [
            {
              id: 'link-ig',
              card_id: uniqueCardId,
              type: 'instagram' as const,
              label: 'Instagram',
              url: instagram.startsWith('http')
                ? instagram
                : `https://instagram.com/${instagram.replace(/^@/, '')}`,
              is_active: true,
              position_order: 5,
            },
          ]
        : []),
      ...(linkedin
        ? [
            {
              id: 'link-li',
              card_id: uniqueCardId,
              type: 'linkedin' as const,
              label: 'LinkedIn',
              url: linkedin.startsWith('http')
                ? linkedin
                : `https://linkedin.com/in/${linkedin.replace(/^@/, '')}`,
              is_active: true,
              position_order: 6,
            },
          ]
        : []),
      ...(tiktok
        ? [
            {
              id: 'link-tt',
              card_id: uniqueCardId,
              type: 'tiktok' as const,
              label: 'TikTok',
              url: tiktok.startsWith('http')
                ? tiktok
                : `https://tiktok.com/@${tiktok.replace(/^@/, '')}`,
              is_active: true,
              position_order: 7,
            },
          ]
        : []),
    ],
    multimedia: [],
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setUploadCoverMessage('Optimizando y subiendo portada...');

    try {
      const optimizedFile = await compressImage(file, { maxWidth: 1200, maxHeight: 600, quality: 0.82 });
      const formData = new FormData();
      formData.append('file', optimizedFile);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        setCoverUrl(data.url);
        setUploadCoverMessage('¡Portada actualizada con éxito!');
      } else {
        throw new Error(data.error || 'Error');
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCoverUrl(ev.target.result as string);
          setUploadCoverMessage('¡Portada cargada en tarjeta!');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setUploadLogoMessage('Optimizando y subiendo logo...');

    try {
      const optimizedFile = await compressImage(file, { maxWidth: 500, maxHeight: 500, quality: 0.85 });
      const formData = new FormData();
      formData.append('file', optimizedFile);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        setLogoUrl(data.url);
        setUploadLogoMessage('¡Logo corporativo listo!');
      } else {
        throw new Error(data.error || 'Error');
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setLogoUrl(ev.target.result as string);
          setUploadLogoMessage('¡Logo cargado!');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const sampleCovers = [
    { label: '🏢 Rascacielos Corporativo', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800' },
    { label: '🌌 Red Tech / Fibra', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800' },
    { label: '🖤 Carbón Minimalista', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800' },
    { label: '💼 Sala Ejecutiva', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800' },
    { label: '✨ Gradiente Azul', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800' },
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage('Optimizando y procesando foto...');

    try {
      const optimizedFile = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
      const formData = new FormData();
      formData.append('file', optimizedFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setAvatarUrl(data.url);
        setUploadMessage('¡Foto optimizada y lista!');
      } else {
        throw new Error(data.error || 'Error en subida');
      }
    } catch (err) {
      console.warn('Fallback a lectura local:', err);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setAvatarUrl(ev.target.result as string);
          setUploadMessage('¡Foto cargada en tarjeta!');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const goToStep2 = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep(2);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Restaurar borrador temporal si existe al cargar la página
  useEffect(() => {
    const draft = loadCardDraft();
    if (draft) {
      if (draft.card.full_name) setFullName(draft.card.full_name);
      if (draft.card.job_title) setJobTitle(draft.card.job_title);
      if (draft.card.company_name) setCompanyName(draft.card.company_name);
      if (draft.card.bio) setBio(draft.card.bio);
      if (draft.card.profile_photo_url) setAvatarUrl(draft.card.profile_photo_url);
      if (draft.card.cover_photo_url) setCoverUrl(draft.card.cover_photo_url);
      if (draft.card.logo_url !== undefined) setLogoUrl(draft.card.logo_url);
      if (draft.card.primary_color) setCustomPrimaryColor(draft.card.primary_color);
      if (draft.card.background_color) setCustomBgColor(draft.card.background_color);
      if (draft.card.font_family) setCustomFont(draft.card.font_family);
      if (draft.card.border_radius) setCustomRadius(draft.card.border_radius);
      if (draft.card.enable_crm_capture !== undefined) setEnableCrm(draft.card.enable_crm_capture);
      if (draft.meta) {
        if (draft.meta.phoneNumber !== undefined) setPhoneNumber(draft.meta.phoneNumber);
        if (draft.meta.email !== undefined) setEmail(draft.meta.email);
        if (draft.meta.website !== undefined) setWebsite(draft.meta.website);
        if (draft.meta.instagram !== undefined) setInstagram(draft.meta.instagram);
        if (draft.meta.linkedin !== undefined) setLinkedin(draft.meta.linkedin);
        if (draft.meta.tiktok !== undefined) setTiktok(draft.meta.tiktok);
        if (draft.meta.selectedTemplateId) setSelectedTemplateId(draft.meta.selectedTemplateId);
        if (draft.meta.step && (draft.meta.step === 1 || draft.meta.step === 2)) setStep(draft.meta.step as 1 | 2);
      }
      setDraftRestored(true);
      const date = new Date(draft.savedAt);
      setLastSavedTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, []);

  // Guardado automático en tiempo real cuando cambia cualquier dato
  useEffect(() => {
    if (step === 3) return;

    const timer = setTimeout(() => {
      saveCardDraft(previewCard, {
        phoneNumber,
        email,
        website,
        instagram,
        linkedin,
        tiktok,
        selectedTemplateId,
        step,
      });
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 600);

    return () => clearTimeout(timer);
  }, [
    fullName,
    jobTitle,
    companyName,
    phoneNumber,
    email,
    website,
    instagram,
    linkedin,
    tiktok,
    bio,
    avatarUrl,
    coverUrl,
    logoUrl,
    selectedTemplateId,
    customPrimaryColor,
    customBgColor,
    customFont,
    customRadius,
    enableCrm,
    step,
  ]);

  const handleDiscardDraft = () => {
    clearCardDraft();
    setDraftRestored(false);
    setFullName('Alejandro Salazar');
    setJobTitle('Director Comercial | B2B');
    setCompanyName('ProConnect Enterprise');
    setPhoneNumber('+58 412 555 1234');
    setEmail('contacto@proconnect.app');
    setWebsite('https://proconnect.app');
    setInstagram('@proconnect.app');
    setLinkedin('proconnect-saas');
    setTiktok('');
    setBio('Somos tu aliado estratégico en conectividad inteligente y transformación digital.');
    setAvatarUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400');
    setCoverUrl('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800');
    setLogoUrl(null);
    setSelectedTemplateId('crimson_quote');
    setStep(1);
    setLastSavedTime(null);
  };

  const publishCardWithUser = async (user: { id: string; email?: string }) => {
    setIsPublishing(true);
    const finalizedCard: FullCard = {
      ...previewCard,
      user_id: user.id,
    };

    // 1. Guardar en store local
    saveCard(finalizedCard);

    // 2. Sincronizar en Supabase si está disponible
    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email || '',
          full_name: finalizedCard.full_name,
          role: user.email?.toLowerCase() === 'luigicolonico@gmail.com' ? 'superadmin' : 'client',
        });

        await supabase.from('cards').upsert({
          id: finalizedCard.id,
          user_id: user.id,
          slug: finalizedCard.slug,
          full_name: finalizedCard.full_name,
          job_title: finalizedCard.job_title,
          company_name: finalizedCard.company_name,
          bio: finalizedCard.bio,
          profile_photo_url: finalizedCard.profile_photo_url,
          cover_photo_url: finalizedCard.cover_photo_url,
          logo_url: finalizedCard.logo_url,
          layout_type: finalizedCard.layout_type || 'modern',
          avatar_position: finalizedCard.avatar_position || 'header_floating',
          button_style: finalizedCard.button_style || 'solid',
          border_radius: finalizedCard.border_radius || 'md',
          primary_color: finalizedCard.primary_color || '#0EA5E9',
          secondary_color: finalizedCard.secondary_color || '#0369A1',
          accent_color: finalizedCard.accent_color || '#38BDF8',
          background_color: finalizedCard.background_color || '#0F172A',
          font_family: finalizedCard.font_family || 'Inter',
          font_weight: finalizedCard.font_weight || 'medium',
          include_photo: finalizedCard.include_photo ?? true,
          custom_vcf_notes: finalizedCard.custom_vcf_notes || '',
          is_active: finalizedCard.is_active ?? true,
          expires_at: finalizedCard.expires_at || new Date(Date.now() + 30 * 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        });

        // 1. Borrar enlaces previos para evitar duplicados por reintentos
        await supabase.from('card_links').delete().eq('card_id', finalizedCard.id);

        // 2. Insertar enlaces deduplicados con identificadores únicos
        if (Array.isArray(finalizedCard.links) && finalizedCard.links.length > 0) {
          const seen = new Set<string>();
          const uniqueLinks = finalizedCard.links.filter((l) => {
            const key = `${l.type}:${(l.url || '').trim().toLowerCase()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          const linksToInsert = uniqueLinks.map((l, idx) => ({
            id: l.id && l.id.includes('-') && l.id.length >= 32 ? l.id : crypto.randomUUID(),
            card_id: finalizedCard.id,
            type: l.type || 'website',
            label: l.label,
            url: l.url,
            icon_name: l.icon_name || null,
            is_active: l.is_active ?? true,
            position_order: idx + 1,
          }));
          await supabase.from('card_links').insert(linksToInsert);
        }
      } catch (err) {
        console.warn('Error sincronizando tarjeta en Supabase:', err);
      }
    }

    // 3. Sincronizar en API local
    try {
      await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card: finalizedCard }),
      });
    } catch (e) {
      console.warn('Error al sincronizar tarjeta con el servidor:', e);
    }

    // 4. Limpiar borrador temporal ya que la tarjeta fue publicada exitosamente
    clearCardDraft();
    setDraftRestored(false);
    setIsPublishing(false);
    setShowAuthModal(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('proconnect_active_card_id', finalizedCard.id);
    }
    setStep(3);

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinishAndSave = async () => {
    // Verificar si el usuario ya tiene sesión activa en Supabase
    if (isSupabaseEnabled && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await publishCardWithUser(session.user);
          return;
        }
      } catch (err) {
        console.warn('Error verificando sesión Supabase:', err);
      }
    }

    // Si no está autenticado, interceptar con el modal Product-Led de Registro/Login
    setShowAuthModal(true);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const sampleAvatars = [
    { label: 'Ejecutiva 1', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' },
    { label: 'Ejecutivo 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
    { label: 'Ejecutiva 3', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400' },
    { label: 'Ejecutivo 4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-brand-cyan/20 selection:text-brand-navy">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Header del Asistente */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black shadow-sm">
              <Gift className="w-3.5 h-3.5 text-emerald-600" />
              <span>Prueba 1 Mes 100% Gratis • Sin Tarjeta de Crédito</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-brand-navy tracking-tight">
              Crea tu Tarjeta Digital en 60 Segundos
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Completa tus datos, elige tu estilo favorito y comienza a compartir tu contacto sin papel.
            </p>

            {/* Stepper Visual */}
            <div className="pt-4 flex items-center justify-center gap-2 max-w-xs mx-auto">
              {[
                { num: 1, label: 'Tus Datos' },
                { num: 2, label: 'Plantilla' },
                { num: 3, label: '¡Lista!' },
              ].map((s) => (
                <div key={s.num} className="flex-1 flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      step === s.num
                        ? 'bg-brand-navy text-white shadow-md ring-2 ring-brand-cyan'
                        : step > s.num
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span className={`text-[11px] font-bold hidden sm:inline ${step === s.num ? 'text-brand-navy' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                  {s.num < 3 && <div className="h-0.5 flex-1 bg-slate-200" />}
                </div>
              ))}
            </div>
          </div>

          {/* Contenedor Dividido: Formulario / Opciones + Simulador Smartphone */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Columna Izquierda: Pasos (7 Cols) */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              
              {/* Banner de Estado de Autoguardado y Borrador Recuperado */}
              {step !== 3 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-slate-700">
                      Guardado automático en tiempo real
                    </span>
                    {lastSavedTime && (
                      <span className="text-slate-400 font-mono text-[11px]">
                        (Última copia: {lastSavedTime})
                      </span>
                    )}
                  </div>

                  {draftRestored && (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                        Borrador restaurado
                      </span>
                      <button
                        type="button"
                        onClick={handleDiscardDraft}
                        className="text-rose-600 hover:text-rose-700 font-bold underline text-[11px]"
                      >
                        Descartar borrador
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* PASO 1: DATOS PERSONALES */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
                      <User className="w-4 h-4 text-brand-blue" />
                      <span>Paso 1: Información de Contacto e Identidad</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Estos datos se guardarán automáticamente en la libreta del cliente cuando descargue tu vCard.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Nombre y Apellido *</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ej: Rossana Orta"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Cargo o Especialidad *</label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Ej: Marketing | RRPP"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Empresa o Marca *</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ej: Inversiones Global C.A."
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Número de WhatsApp / Móvil *</label>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+58 412 123 4567"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-cyan font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Correo Electrónico Corporativo</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nombre@empresa.com"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Quote className="w-3.5 h-3.5 text-brand-blue" />
                      <span>Mensaje Destacado o Propuesta de Valor (Bio)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Ej: Somos tu aliado confiable para alcanzar tus objetivos..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-cyan leading-relaxed"
                    />
                  </div>

                  {/* Redes Sociales y Presencia Digital */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-sky-500" />
                        <span>Presencia Digital & Redes Sociales (Opcional)</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Aparecerán como botones interactivos directos en tu tarjeta digital y chip NFC.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-sky-500" />
                          <span>Página Web Oficial</span>
                        </label>
                        <input
                          type="text"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://tuempresa.com"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <Instagram className="w-3 h-3 text-pink-500" />
                          <span>Instagram</span>
                        </label>
                        <input
                          type="text"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          placeholder="@tuempresa"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <Linkedin className="w-3 h-3 text-blue-600" />
                          <span>LinkedIn</span>
                        </label>
                        <input
                          type="text"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          placeholder="tu-empresa-o-perfil"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <Video className="w-3 h-3 text-slate-800 dark:text-white" />
                          <span>TikTok</span>
                        </label>
                        <input
                          type="text"
                          value={tiktok}
                          onChange={(e) => setTiktok(e.target.value)}
                          placeholder="@tuusuario"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Foto de Perfil con Subida Directa */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-700 block">
                      Foto de Perfil *
                    </label>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <label
                        htmlFor="avatar-file-input"
                        className="relative group cursor-pointer shrink-0 block"
                        title="Toca para subir tu foto"
                      >
                        <img
                          src={avatarUrl}
                          alt="Preview"
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-navy shadow-md group-hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </label>

                      <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                        <input
                          id="avatar-file-input"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageUpload}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <label
                            htmlFor="avatar-file-input"
                            className="cursor-pointer px-5 py-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.02] select-none"
                          >
                            {isUploading ? (
                              <Loader2 className="w-4 h-4 text-brand-cyan animate-spin" />
                            ) : (
                              <Camera className="w-4 h-4 text-brand-cyan" />
                            )}
                            <span>{isUploading ? 'Subiendo...' : 'Elegir Foto (Galería o Celular)'}</span>
                          </label>
                        </div>

                        {uploadMessage && (
                          <p className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-block animate-in fade-in">
                            ✓ {uploadMessage}
                          </p>
                        )}
                        {!uploadMessage && (
                          <p className="text-[11px] text-slate-500">
                            Toca el botón o la imagen para seleccionar tu foto desde tu dispositivo.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-slate-400 font-semibold">O elige una muestra:</span>
                      {sampleAvatars.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setAvatarUrl(s.url);
                            setUploadMessage(null);
                          }}
                          className="w-7 h-7 rounded-full overflow-hidden border border-slate-300 hover:scale-110 transition-transform"
                          title={s.label}
                        >
                          <img src={s.url} alt={s.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Foto de Portada / Banner Corporativo (Estilo Facebook / LinkedIn) */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 block">
                        Foto de Portada / Banner Corporativo (Estilo Portada Facebook)
                      </label>
                      <span className="text-[10px] font-bold text-brand-blue bg-sky-50 px-2 py-0.5 rounded-full">
                        Personalizable
                      </span>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group h-28 sm:h-32">
                      <img
                        src={coverUrl}
                        alt="Portada"
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-between p-3">
                        <label
                          htmlFor="cover-file-input"
                          className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-md backdrop-blur-sm transition-all hover:scale-105"
                        >
                          {isUploadingCover ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-blue" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 text-brand-blue" />
                          )}
                          <span>{isUploadingCover ? 'Subiendo...' : 'Subir Mi Portada Personalizada'}</span>
                        </label>
                        <input
                          id="cover-file-input"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleCoverUpload}
                        />
                        {uploadCoverMessage && (
                          <span className="text-[11px] font-bold text-emerald-400 bg-black/60 px-2 py-1 rounded-lg">
                            ✓ {uploadCoverMessage}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Presets de Portada */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        O elige un fondo corporativo prediseñado:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {sampleCovers.map((c, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setCoverUrl(c.url);
                              setUploadCoverMessage(null);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                              coverUrl === c.url
                                ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Logo de la Empresa (Opcional) */}
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 block">
                        Logo de la Empresa (Opcional)
                      </label>
                      <span className="text-[10px] text-slate-400">PNG transparente o JPG</span>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-sm">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Building2 className="w-6 h-6 text-slate-300" />
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <input
                          id="logo-file-input"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleLogoUpload}
                        />
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor="logo-file-input"
                            className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            {isUploadingLogo ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-blue" />
                            ) : (
                              <Upload className="w-3.5 h-3.5 text-brand-blue" />
                            )}
                            <span>{isUploadingLogo ? 'Subiendo...' : 'Subir Logo Corporativo'}</span>
                          </label>

                          {logoUrl && (
                            <button
                              type="button"
                              onClick={() => setLogoUrl(null)}
                              className="text-xs text-rose-600 hover:underline font-bold"
                            >
                              Quitar
                            </button>
                          )}
                        </div>

                        {uploadLogoMessage && (
                          <p className="text-[11px] font-bold text-emerald-700">✓ {uploadLogoMessage}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={goToStep2}
                      className="px-6 py-3 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                    >
                      <span>Siguiente: Elegir Plantilla Visual</span>
                      <ArrowRight className="w-3.5 h-3.5 text-brand-cyan" />
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 2: ELECCIÓN DE PLANTILLA VISUAL */}
              {step === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
                        <Palette className="w-4 h-4 text-brand-cyan" />
                        <span>Paso 2: Elige tu Plantilla Visual</span>
                      </h2>
                      <p className="text-xs text-slate-500">
                        Selecciona el estilo que mejor proyecte tu imagen o la de tu empresa.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-brand-blue bg-brand-blue/10 px-3 py-1 rounded-full">
                      {PRESET_TEMPLATES.length} Estilos Disponibles
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                    {PRESET_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplateId(tmpl.id);
                          setCustomPrimaryColor(tmpl.colors.primary);
                          setCustomBgColor(tmpl.colors.background);
                          setCustomFont(tmpl.font_family);
                          setCustomRadius(tmpl.border_radius);
                        }}
                        className={`p-4 rounded-2xl text-left border transition-all relative flex flex-col justify-between ${
                          selectedTemplateId === tmpl.id
                            ? 'border-brand-navy bg-brand-navy/5 ring-2 ring-brand-navy shadow-md'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-xs font-black text-slate-900 line-clamp-1">
                              {tmpl.name}
                            </span>
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: tmpl.colors.primary }}
                            />
                          </div>
                          <span className="inline-block text-[10px] font-bold text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-md mb-2">
                            {tmpl.industry}
                          </span>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {tmpl.description}
                          </p>
                        </div>

                        {selectedTemplateId === tmpl.id && (
                          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-brand-navy">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Seleccionada</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Panel de Ajuste Fino de Colores y Tipografía */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <button
                      type="button"
                      onClick={() => setShowCustomizer(!showCustomizer)}
                      className="w-full flex items-center justify-between text-xs font-bold text-brand-navy hover:text-brand-blue transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-brand-cyan" />
                        <span>🎨 Ajustar Colores, Fondo y Tipografía a tu Gusto</span>
                      </div>
                      <span className="text-[11px] text-brand-blue underline">
                        {showCustomizer ? 'Ocultar Ajustes' : 'Personalizar Detalles'}
                      </span>
                    </button>

                    {showCustomizer && (
                      <div className="pt-3 border-t border-slate-200 space-y-4 animate-in fade-in duration-150">
                        {/* Selector de Colores */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Color Principal / Botones
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={customPrimaryColor}
                                onChange={(e) => setCustomPrimaryColor(e.target.value)}
                                className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                              />
                              <input
                                type="text"
                                value={customPrimaryColor}
                                onChange={(e) => setCustomPrimaryColor(e.target.value)}
                                className="flex-1 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-300"
                              />
                            </div>
                          </div>

                          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Color de Fondo de la Tarjeta
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={customBgColor}
                                onChange={(e) => setCustomBgColor(e.target.value)}
                                className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                              />
                              <input
                                type="text"
                                value={customBgColor}
                                onChange={(e) => setCustomBgColor(e.target.value)}
                                className="flex-1 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-300"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Selector de Tipografía */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 block flex items-center gap-1.5">
                            <Type className="w-3.5 h-3.5 text-brand-blue" />
                            <span>Tipo de Letra (Tipografía)</span>
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {[
                              { id: 'Inter', name: 'Inter (Moderna)' },
                              { id: 'Poppins', name: 'Poppins (Geométrica)' },
                              { id: 'Playfair Display', name: 'Playfair (Elegante)' },
                              { id: 'Montserrat', name: 'Montserrat (Fuerte)' },
                            ].map((font) => (
                              <button
                                key={font.id}
                                type="button"
                                onClick={() => setCustomFont(font.id)}
                                className={`p-2 rounded-lg text-xs font-bold border transition-all text-center ${
                                  customFont === font.id
                                    ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {font.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Forma de Botones */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            Forma de Esquinas y Botones
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'sm', label: 'Cuadrado Suave' },
                              { id: 'lg', label: 'Redondeado Ejecutivo' },
                              { id: 'full', label: 'Píldora Total' },
                            ].map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => setCustomRadius(r.id)}
                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                  customRadius === r.id
                                    ? 'bg-brand-navy text-white border-brand-navy'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {r.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Módulo Opcional: CRM / Captura de Prospectos */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-black text-brand-navy">
                            <span>🤝 Módulo Captura de Contactos / Mini-CRM</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700">
                              Opcional
                            </span>
                          </span>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Muestra el botón flotante <strong>"Conectar / Dejar Mis Datos"</strong> en tu tarjeta para que quien la escanee te envíe su contacto a tu base de datos. Puedes desactivarlo si solo deseas que tu tarjeta sea informativa.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            checked={enableCrm}
                            onChange={(e) => setEnableCrm(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                        </label>
                      </div>
                    </div>

                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Volver a Datos</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFinishAndSave}
                      className="px-6 py-3 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                    >
                      <span>Finalizar y Obtener Tarjeta</span>
                      <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 3: ¡TARJETA LISTA! */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-2 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase tracking-wider">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>¡Tu Tarjeta Inteligente Está Lista!</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">
                      Felicidades, tu mes de prueba gratuito ya está activo.
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Puedes compartirla inmediatamente mediante tu enlace público o mostrando tu código QR desde tu celular.
                    </p>
                  </div>

                  {/* Tarjeta de Acceso y Enlace Público */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <label className="text-xs font-bold text-slate-700">Tu Enlace Dinámico Público</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={publicUrl}
                        className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="px-4 py-2 bg-brand-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  {/* QR Code de Descarga Rápida */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
                      <QRCodeSVG
                        value={publicUrl}
                        size={120}
                        fgColor={activeTemplate.colors.primary}
                        level="Q"
                      />
                    </div>
                    <div className="space-y-2 text-center sm:text-left flex-1">
                      <h3 className="text-sm font-bold text-brand-navy">Código QR Listo para Escanear</h3>
                      <p className="text-xs text-slate-500">
                        Cualquier persona que apunte su cámara a este código guardará tu contacto en 1 segundo.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link
                          href="/dashboard"
                          className="px-4 py-2 bg-brand-cyan text-brand-navy font-bold text-xs rounded-xl hover:bg-sky-300 transition-colors"
                        >
                          Ir al Panel de Edición Completo
                        </Link>
                        <Link
                          href="/nfc-studio"
                          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                        >
                          Diseñar Tarjeta Física NFC
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-start">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Cambiar de plantilla</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Columna Derecha: Teléfono Inteligente en Vivo (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col items-center sticky top-8">
              <div className="flex items-center justify-between w-full max-w-[340px] sm:max-w-[360px] mb-2 px-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-700">Simulador en Tiempo Real</span>
                </div>
                <span className="text-[10px] font-bold text-brand-blue uppercase">
                  {activeTemplate.name}
                </span>
              </div>

              {/* Smartphone Frame */}
              <div className="relative w-[340px] sm:w-[360px] h-[640px] bg-slate-950 rounded-[46px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50 flex flex-col justify-between overflow-hidden">
                {/* Dynamic Island */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-40 flex items-center justify-center pointer-events-none">
                  <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700 mr-2" />
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-950" />
                </div>

                {/* Contenido de la Pantalla */}
                <div className="w-full h-full rounded-[36px] overflow-y-auto bg-slate-900 scrollbar-none relative text-left">
                  <DigitalCard card={previewCard} isSimulator={true} />
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/40 rounded-full z-40 pointer-events-none" />
              </div>

              <p className="text-[11px] text-slate-400 mt-3 text-center">
                Mira cómo cambia en vivo al cambiar tus datos o plantilla.
              </p>
            </div>

          </div>

        </div>
      </main>

      {/* Modal de Autenticación Product-Led */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => publishCardWithUser(user)}
        title="Crea tu cuenta para publicar tu tarjeta"
        subtitle="Tu tarjeta digital inteligente y chip NFC quedarán protegidos bajo tu usuario en Supabase con Row Level Security."
      />

      <Footer />
    </div>
  );
}
