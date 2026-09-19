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
import { FullCard, PresetTemplate, CatalogMultimedia } from '@/lib/types';
import { saveCardDraft, loadCardDraft, clearCardDraft } from '@/lib/draft-store';
import { AuthModal } from '@/components/auth/AuthModal';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { compressImage } from '@/lib/image-compressor';
import { normalizeCardForDatabase, isSuperAdminEmail, getSupabaseCardPayload, generateUuid, isValidUuid } from '@/lib/db-normalize';
import { ImageCropperModal } from '@/components/common/ImageCropperModal';
import { MultimediaManager } from '@/components/dashboard/MultimediaManager';
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
  MessageCircle,
  Download,
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
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RefreshCw,
  LogOut,
  MailCheck,
  Move,
  Film,
} from 'lucide-react';

export default function CrearTarjetaPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Datos del Paso 1 (Vacíos por defecto con placeholders explicativos)
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400');
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImgSrc, setCropperImgSrc] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [multimedia, setMultimedia] = useState<CatalogMultimedia[]>([]);
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
  const [mobileStep2Tab, setMobileStep2Tab] = useState<'simulator' | 'catalog'>('simulator');
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [guestMode, setGuestMode] = useState<boolean>(false);
  const [checkingConfirmed, setCheckingConfirmed] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resetToast, setResetToast] = useState(false);

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

  const currentTemplateIndex = Math.max(0, PRESET_TEMPLATES.findIndex((t) => t.id === selectedTemplateId));
  const handleSelectTemplate = (tmpl: PresetTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setCustomPrimaryColor(tmpl.colors.primary);
    setCustomBgColor(tmpl.colors.background);
    setCustomFont(tmpl.font_family);
    setCustomRadius(tmpl.border_radius);
  };
  const handleNextTemplate = () => {
    const nextIdx = (currentTemplateIndex + 1) % PRESET_TEMPLATES.length;
    handleSelectTemplate(PRESET_TEMPLATES[nextIdx]);
  };
  const handlePrevTemplate = () => {
    const prevIdx = (currentTemplateIndex - 1 + PRESET_TEMPLATES.length) % PRESET_TEMPLATES.length;
    handleSelectTemplate(PRESET_TEMPLATES[prevIdx]);
  };

  // Slug generado
  const slug = (fullName.trim() || 'mi-tarjeta').toLowerCase().replace(/[^a-z0-9]+/g, '-');
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
    multimedia: multimedia,
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCropperImgSrc(ev.target.result as string);
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    setAvatarUrl(croppedDataUrl);
    setUploadMessage('¡Foto encuadrada y centrada!');
    setIsUploading(true);

    try {
      const res = await fetch(croppedDataUrl);
      const blob = await res.blob();
      const file = new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const optimized = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.88 });
      const formData = new FormData();
      formData.append('file', optimized);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await uploadRes.json();
      if (data.success && data.url) {
        setAvatarUrl(data.url);
      }
    } catch (err) {
      console.warn('Fallback a avatar recortado local en memoria:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const goToStep2 = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep(2);
    setMobileTab('editor');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleResetForm = () => {
    clearCardDraft();
    setFullName('');
    setJobTitle('');
    setCompanyName('');
    setPhoneNumber('');
    setEmail(currentUser?.email || '');
    setWebsite('');
    setInstagram('');
    setLinkedin('');
    setTiktok('');
    setBio('');
    setAvatarUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400');
    setCoverUrl('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800');
    setLogoUrl(null);
    setMultimedia([]);
    setSelectedTemplateId('crimson_quote');
    setStep(1);
    setDraftRestored(false);
    setLastSavedTime(null);
    setResetToast(true);
    setTimeout(() => setResetToast(false), 3500);
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
      if (draft.card.multimedia && Array.isArray(draft.card.multimedia)) {
        setMultimedia(draft.card.multimedia);
      }
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

  // Verificar sesión activa en Supabase al cargar la página
  useEffect(() => {
    const checkSession = async () => {
      if (isSupabaseEnabled && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const user = session.user;
            setCurrentUser(user);
            const userEmail = (user.email || '').toLowerCase().trim();
            const draft = loadCardDraft();
            // Si el borrador existente pertenecía a otra cuenta distinta, resetear para evitar filtrar datos
            if (draft && draft.meta?.userEmail && userEmail && draft.meta.userEmail.toLowerCase().trim() !== userEmail) {
              handleResetForm();
            } else if (user.email) {
              setEmail((prev) => prev || user.email || '');
            }
          }
        } catch (e) {
          console.warn('Error en checkSession /crear:', e);
        }
      }
      setAuthChecking(false);
    };
    checkSession();

    if (isSupabaseEnabled && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const user = session.user;
          setCurrentUser(user);
          const userEmail = (user.email || '').toLowerCase().trim();
          const draft = loadCardDraft();
          if (draft && draft.meta?.userEmail && userEmail && draft.meta.userEmail.toLowerCase().trim() !== userEmail) {
            handleResetForm();
          } else if (user.email) {
            setEmail((prev) => prev || user.email || '');
          }
        } else {
          setCurrentUser(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const handleCheckEmailConfirmed = async () => {
    if (!isSupabaseEnabled || !supabase) return;
    setCheckingConfirmed(true);
    setVerificationMessage(null);
    try {
      const { data: { session } } = await supabase.auth.refreshSession();
      if (session?.user?.email_confirmed_at) {
        setCurrentUser(session.user);
        setVerificationMessage('¡Correo confirmado! Ingresando al creador...');
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        setCurrentUser(user);
        setVerificationMessage('¡Correo confirmado! Ingresando al creador...');
      } else {
        setVerificationMessage('Tu correo aún no aparece confirmado. Revisa tu bandeja de entrada o carpeta de spam y haz clic en el enlace.');
      }
    } catch (e: any) {
      setVerificationMessage('Error al verificar: ' + (e?.message || 'Intenta de nuevo'));
    } finally {
      setCheckingConfirmed(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    if (!currentUser?.email || !isSupabaseEnabled || !supabase) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: currentUser.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/crear`,
        },
      });
      if (error) {
        setVerificationMessage('Aviso: ' + error.message);
      } else {
        setResendSent(true);
        setVerificationMessage('Hemos reenviado el enlace a tu correo. Revisa tu bandeja de entrada o spam.');
        setTimeout(() => setResendSent(false), 5000);
      }
    } catch (err: any) {
      setVerificationMessage('Error al reenviar: ' + (err?.message || 'Intenta de nuevo'));
    } finally {
      setResendLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (isSupabaseEnabled && supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
  };

  const handleGoogleSignIn = async () => {
    if (!isSupabaseEnabled || !supabase) {
      const mockUser = {
        id: 'usr_' + Date.now(),
        email: 'usuario.google@proconnect.app',
        user_metadata: { full_name: 'Usuario Google' },
      };
      setCurrentUser(mockUser);
      return;
    }
    try {
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/crear`,
        },
      });
      if (oauthErr) {
        alert(oauthErr.message);
      }
    } catch (e: any) {
      alert(e?.message || 'Error al conectar con Google');
    }
  };

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
        userEmail: currentUser?.email || email || '',
        userId: currentUser?.id || '',
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
    multimedia,
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
    setFullName(currentUser?.user_metadata?.full_name || '');
    setJobTitle('');
    setCompanyName('');
    setPhoneNumber('');
    setEmail(currentUser?.email || '');
    setWebsite('');
    setInstagram('');
    setLinkedin('');
    setTiktok('');
    setBio('');
    setAvatarUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400');
    setCoverUrl('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800');
    setLogoUrl(null);
    setMultimedia([]);
    setSelectedTemplateId('crimson_quote');
    setStep(1);
    setLastSavedTime(null);
  };

  const publishCardWithUser = async (user: { id: string; email?: string }) => {
    setIsPublishing(true);

    let targetUserId = user.id;
    const userEmail = (user.email || email || '').toLowerCase().trim();

    // 1. Si Supabase está disponible, verificar si el usuario ya existe por email para reutilizar su id
    if (isSupabaseEnabled && supabase && userEmail) {
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .ilike('email', userEmail)
          .maybeSingle();
        if (existingUser?.id) {
          targetUserId = existingUser.id;
        }
      } catch (e) {}
    }

    if (!targetUserId || !isValidUuid(targetUserId)) {
      targetUserId = generateUuid();
    }

    const finalizedCard: FullCard = {
      ...previewCard,
      user_id: targetUserId,
      background_texture: activeTemplate.background_texture || previewCard.background_texture,
      avatar_effect: activeTemplate.avatar_effect || previewCard.avatar_effect,
      card_badge: activeTemplate.card_badge || previewCard.card_badge,
      expires_at: null, // Lifetime freemium
      plan_duration: 'lifetime',
    };

    // Normalizar datos para PostgreSQL (garantiza enums válidos como 'filled', UUIDs e integridad)
    const dbCard = normalizeCardForDatabase(finalizedCard, targetUserId, userEmail);

    // 2. Si ya existe una tarjeta con el mismo slug en Supabase, reutilizar su id para evitar violar restricción unique
    if (isSupabaseEnabled && supabase) {
      try {
        const { data: existingCard } = await supabase
          .from('cards')
          .select('id')
          .ilike('slug', dbCard.slug)
          .maybeSingle();
        if (existingCard?.id) {
          dbCard.id = existingCard.id;
          finalizedCard.id = existingCard.id;
        }
      } catch (e) {}
    }

    // 3. Guardar en store local y cache por slug de alta prioridad
    saveCard(finalizedCard);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`proconnect_card_${finalizedCard.slug}`, JSON.stringify(finalizedCard));
        sessionStorage.setItem(`proconnect_card_${finalizedCard.slug}`, JSON.stringify(finalizedCard));
        localStorage.setItem('proconnect_active_card_slug', finalizedCard.slug);
        localStorage.setItem('proconnect_active_card_id', finalizedCard.id);
      } catch {}
    }

    // 4. Sincronizar en Supabase si está disponible
    if (isSupabaseEnabled && supabase) {
      try {
        const isSuper = isSuperAdminEmail(userEmail);
        await supabase.from('users').upsert({
          id: targetUserId,
          email: userEmail || `${dbCard.slug}@proconnect.app`,
          full_name: dbCard.full_name || 'Usuario ProConnect',
          role: isSuper ? 'superadmin' : 'client',
        }, { onConflict: 'id' });

        // Upsert directo con columnas normalizadas de public.cards
        let cardPayload: any = getSupabaseCardPayload(dbCard);
        let { error: cardUpsertErr } = await supabase.from('cards').upsert(cardPayload);

        // Si la columna expires_at aún no existe en Supabase (código 42703), reintentar sin ella
        if (cardUpsertErr && (cardUpsertErr as any).code === '42703') {
          const { expires_at, ...cleanPayload } = cardPayload;
          const retry = await supabase.from('cards').upsert(cleanPayload);
          cardUpsertErr = retry.error;
        }

        if (cardUpsertErr) {
          console.warn('Upsert directo de cards tuvo advertencia, invocando RPC save_public_card:', cardUpsertErr.message);
          await supabase.rpc('save_public_card', { p_card: dbCard });
        }

        // Sincronizar card_links
        await supabase.from('card_links').delete().eq('card_id', dbCard.id);
        if (Array.isArray(dbCard.links) && dbCard.links.length > 0) {
          const sanitizedLinks = dbCard.links.map((l) => ({ ...l, card_id: dbCard.id }));
          await supabase.from('card_links').insert(sanitizedLinks);
        }
      } catch (err) {
        console.warn('Error sincronizando tarjeta en Supabase:', err);
      }
    }

    // 5. Sincronizar en API local y caché de servidor
    try {
      await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card: dbCard }),
      });
    } catch (e) {
      console.warn('Error al sincronizar tarjeta con el servidor:', e);
    }

    // 6. Limpiar borrador temporal ya que la tarjeta fue publicada exitosamente
    clearCardDraft();
    setDraftRestored(false);
    setIsPublishing(false);
    setShowAuthModal(false);
    setStep(3);

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinishAndSave = async () => {
    // Si ya tenemos currentUser en estado
    if (currentUser) {
      await publishCardWithUser(currentUser);
      return;
    }

    // Verificar si el usuario ya tiene sesión activa en Supabase
    if (isSupabaseEnabled && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          await publishCardWithUser(session.user);
          return;
        }
      } catch (err) {
        console.warn('Error verificando sesión Supabase:', err);
      }
    }

    // Si el usuario ya colocó su correo electrónico en el formulario
    if (email && email.trim().includes('@')) {
      await publishCardWithUser({
        id: generateUuid(),
        email: email.trim(),
      });
      return;
    }

    // Si está en modo invitado
    if (guestMode) {
      await publishCardWithUser({
        id: generateUuid(),
        email: email || 'invitado@proconnect.app',
      });
      return;
    }

    // Si no está autenticado ni tiene email, mostrar modal de registro
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

  const handleDownloadQr = () => {
    if (typeof window === 'undefined') return;
    const svg = document.getElementById('proconnect-qr-svg');
    if (!svg) return;
    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = 600;
        canvas.height = 600;
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 600, 600);
          ctx.drawImage(img, 50, 50, 500, 500);
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `QR-${slug || 'proconnect'}.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        }
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.warn('Error downloading QR:', err);
    }
  };

  const sampleAvatars = [
    { label: 'Ejecutiva 1', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' },
    { label: 'Ejecutivo 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
    { label: 'Ejecutiva 3', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400' },
    { label: 'Ejecutivo 4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400' },
  ];

  if (authChecking) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <div className="w-10 h-10 border-4 border-brand-navy border-t-brand-cyan rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-600">Verificando sesión segura en ProConnect...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isEmailConfirmed = Boolean(
    currentUser?.email_confirmed_at ||
    currentUser?.confirmed_at ||
    currentUser?.app_metadata?.provider === 'google' ||
    currentUser?.identities?.some((id: any) => id.provider === 'google')
  );

  // 1. Pantalla de Bloqueo: Exigir Registro / Inicio de Sesión
  if (!currentUser && isSupabaseEnabled) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-brand-cyan/20 selection:text-brand-navy">
        <Navbar />

        <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black shadow-sm mx-auto">
              <Gift className="w-3.5 h-3.5 text-emerald-600" />
              <span>Totalmente Gratis • Sin Costo</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
                Crea tu Tarjeta Inteligente
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Inicia sesión o regístrate para comenzar a diseñar tu tarjeta digital. Tu primera tarjeta personal es totalmente gratis y sin fecha de caducidad.
              </p>
            </div>

            {/* Google OAuth Button */}
            <div className="space-y-4 pt-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-sm transition-all hover:shadow hover:border-slate-400 active:scale-[0.99] cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  o con tu correo
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login?redirect=/crear"
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs text-center transition-all flex items-center justify-center"
                >
                  Iniciar Sesión
                </Link>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-bold text-xs text-center shadow transition-all cursor-pointer"
                >
                  Registrarme
                </button>
              </div>
            </div>
          </div>
        </main>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setShowAuthModal(false);
          }}
          title="Crea tu cuenta para comenzar"
          subtitle="Tu primera tarjeta personal es 100% gratuita y sin fecha de caducidad."
        />
        <Footer />
      </div>
    );
  }

  // 2. Pantalla de Bloqueo: Exigir Confirmación Obligatoria de Correo
  if (currentUser && !isEmailConfirmed && isSupabaseEnabled) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-brand-cyan/20 selection:text-brand-navy">
        <Navbar />

        <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center mx-auto animate-pulse">
              <Mail className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black mx-auto">
                <MailCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Confirmación Obligatoria</span>
              </div>
              <h1 className="text-2xl font-black text-brand-navy tracking-tight">
                Confirma tu Correo Electrónico
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Hemos enviado un enlace de activación a:
              </p>
              <p className="text-sm font-bold text-slate-900 bg-slate-100 py-2 px-3 rounded-xl break-all font-mono">
                {currentUser.email}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed pt-1">
                Por seguridad y para proteger tu tarjeta digital inteligente y chip NFC, debes confirmar tu cuenta antes de poder diseñar y publicar.
              </p>
            </div>

            {verificationMessage && (
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold leading-relaxed">
                {verificationMessage}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleCheckEmailConfirmed}
                disabled={checkingConfirmed}
                className="w-full py-3.5 px-4 rounded-xl bg-brand-navy hover:bg-slate-800 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${checkingConfirmed ? 'animate-spin' : ''}`} />
                <span>{checkingConfirmed ? 'Verificando...' : 'Ya confirmé mi correo (Entrar al Creador)'}</span>
              </button>

              <button
                type="button"
                onClick={handleResendVerificationEmail}
                disabled={resendLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4 text-slate-500" />
                <span>{resendSent ? '✓ Enlace Reenviado' : 'Reenviar Correo de Confirmación'}</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar sesión o usar otro correo</span>
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-brand-cyan/20 selection:text-brand-navy">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Header del Asistente */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black shadow-sm">
                <Gift className="w-3.5 h-3.5 text-emerald-600" />
                <span>Prueba 1 Mes 100% Gratis • Sin Tarjeta</span>
              </div>
              {currentUser && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                  <span className="truncate max-w-[200px]">Sesión: {currentUser.email}</span>
                </div>
              )}
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
              ].map((s) => {
                const isCompleted = step > s.num || (step === 3 && s.num === 3);
                const isCurrent = step === s.num && !isCompleted;
                return (
                  <div key={s.num} className="flex-1 flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
                          : isCurrent
                          ? 'bg-brand-navy text-white shadow-md ring-2 ring-brand-cyan'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.num}
                    </div>
                    <span
                      className={`text-[11px] font-bold hidden sm:inline ${
                        isCompleted
                          ? 'text-emerald-700'
                          : isCurrent
                          ? 'text-brand-navy'
                          : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                    {s.num < 3 && (
                      <div
                        className={`h-0.5 flex-1 transition-all ${
                          step > s.num || (step === 3 && s.num < 3) ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selector Móvil de Vista (Editor vs Ver Tarjeta) - Solo Móvil en Pasos 1 y 2 */}
          {step !== 3 && (
            <div className="lg:hidden mb-6 grid grid-cols-2 p-1.5 rounded-2xl bg-slate-200/80 backdrop-blur-sm border border-slate-300 shadow-sm">
              <button
                type="button"
                onClick={() => setMobileTab('editor')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  mobileTab === 'editor'
                    ? 'bg-white text-brand-navy shadow-md ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{step === 1 ? '✏️ Llenar Datos' : '🎨 Elegir Plantilla'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  mobileTab === 'preview'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>📱 Ver en Teléfono</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            </div>
          )}

          {/* Contenedor Dividido: Formulario / Opciones + Simulador Smartphone */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Columna Izquierda: Pasos (7 Cols) */}
            <div className={`lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 ${step !== 3 && mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
              
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
                  <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
                        <User className="w-4 h-4 text-brand-blue" />
                        <span>Paso 1: Información de Contacto e Identidad</span>
                      </h2>
                      <p className="text-xs text-slate-500">
                        Estos datos se guardarán automáticamente en la libreta del cliente cuando descargue tu vCard.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-rose-600 font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-center cursor-pointer shadow-sm active:scale-95"
                      title="Vacía los campos y empieza una tarjeta desde cero"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Limpiar campos</span>
                    </button>
                  </div>

                  {resetToast && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Formulario restablecido. Estás creando una tarjeta en blanco.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Nombre y Apellido *</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ej: Carlos Mendoza"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Cargo o Especialidad *</label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Ej: Director Comercial"
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
                        placeholder="Ej: +58 412 123 4567"
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
                      placeholder="Ej: carlos@miempresa.com"
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
                      placeholder="Ej: Ayudo a empresas a escalar sus ventas B2B con soluciones digitales..."
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

                          <button
                            type="button"
                            onClick={() => {
                              if (avatarUrl) {
                                setCropperImgSrc(avatarUrl);
                                setCropperOpen(true);
                              }
                            }}
                            className="cursor-pointer px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-sm select-none"
                            title="Ajustar encuadre y centrar rostro"
                          >
                            <Move className="w-3.5 h-3.5 text-brand-blue" />
                            <span>Ajustar Encuadre</span>
                          </button>
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

                  {/* Catálogo y Archivos Multimedia (MP4, PDF, Imágenes) */}
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <MultimediaManager
                      items={multimedia}
                      cardId={previewCard.id}
                      onChange={setMultimedia}
                    />
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

                  {/* Banner Directo de Acción para Publicar (Imposible de Perder) */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-2 border-emerald-400/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3 text-center sm:text-left">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">
                          ¿Te gusta cómo se ve tu tarjeta en el simulador?
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Plantilla actual: <strong className="text-emerald-700 font-bold">{activeTemplate.name}</strong> • ¡Púlsalo para activarla!
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleFinishAndSave}
                      disabled={isPublishing}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shrink-0"
                    >
                      <span>🚀 Guardar y Publicar Ahora</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Selector de Modo en Pantallas Móviles (lg:hidden) */}
                  <div className="lg:hidden flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setMobileStep2Tab('simulator')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                        mobileStep2Tab === 'simulator'
                          ? 'bg-brand-navy text-white shadow-md'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5 text-brand-cyan" />
                      <span>📱 Simulador Rápido</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileStep2Tab('catalog')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                        mobileStep2Tab === 'catalog'
                          ? 'bg-brand-navy text-white shadow-md'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Palette className="w-3.5 h-3.5 text-brand-blue" />
                      <span>🎨 Catálogo ({PRESET_TEMPLATES.length})</span>
                    </button>
                  </div>

                  {/* VISTA MÓVIL A: SIMULADOR TÁCTIL CON CARRUSEL DIRECTO (Sin Scroll Aburrido) */}
                  {mobileStep2Tab === 'simulator' && (
                    <div className="lg:hidden flex flex-col items-center space-y-4">
                      {/* Cabecera del Simulador */}
                      <div className="w-full max-w-[340px] flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-bold text-slate-800">Simulador en Vivo</span>
                        </div>
                        <span className="text-[10px] font-black text-brand-blue bg-brand-blue/10 px-2.5 py-0.5 rounded-full uppercase">
                          {activeTemplate.name.split(' ')[0]}
                        </span>
                      </div>

                      {/* Smartphone Frame Integrado */}
                      <div className="relative w-[320px] sm:w-[340px] h-[520px] sm:h-[560px] bg-slate-950 rounded-[42px] p-2.5 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50 flex flex-col justify-between overflow-hidden">
                        {/* Dynamic Island */}
                        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-40 flex items-center justify-center pointer-events-none">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-700 mr-2" />
                          <div className="w-1 h-1 rounded-full bg-sky-950" />
                        </div>

                        {/* Contenido de la Pantalla */}
                        <div className="w-full h-full rounded-[32px] overflow-y-auto bg-slate-900 scrollbar-none relative text-left">
                          <DigitalCard card={previewCard} isSimulator={true} />
                        </div>

                        {/* Home Indicator */}
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/40 rounded-full z-40 pointer-events-none" />
                      </div>

                      {/* Controles de Navegación Táctil 1-Toque */}
                      <div className="w-full max-w-[340px] space-y-3">
                        <div className="flex items-center justify-between bg-slate-100 p-2 rounded-2xl border border-slate-200 shadow-sm">
                          <button
                            type="button"
                            onClick={handlePrevTemplate}
                            className="px-3 py-2 rounded-xl bg-white text-slate-800 font-bold text-xs shadow-sm hover:bg-slate-50 flex items-center gap-1 active:scale-95 transition-all"
                          >
                            <ChevronLeft className="w-4 h-4 text-brand-blue" />
                            <span>Ant.</span>
                          </button>

                          <div className="text-center px-2">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                              {currentTemplateIndex + 1} de {PRESET_TEMPLATES.length}
                            </span>
                            <span className="text-xs font-black text-slate-900 line-clamp-1 max-w-[150px]">
                              {activeTemplate.name}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={handleNextTemplate}
                            className="px-3 py-2 rounded-xl bg-white text-slate-800 font-bold text-xs shadow-sm hover:bg-slate-50 flex items-center gap-1 active:scale-95 transition-all"
                          >
                            <span>Sig.</span>
                            <ChevronRight className="w-4 h-4 text-brand-blue" />
                          </button>
                        </div>

                        {/* Tira Deslizable Horizontal (Swipe) de Mini-Pastillas de Plantillas */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
                          {PRESET_TEMPLATES.map((tmpl) => (
                            <button
                              key={tmpl.id}
                              type="button"
                              onClick={() => handleSelectTemplate(tmpl)}
                              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                                selectedTemplateId === tmpl.id
                                  ? 'bg-brand-navy text-white border-brand-navy shadow-md ring-2 ring-brand-cyan/50'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                                style={{ backgroundColor: tmpl.colors.primary }}
                              />
                              <span className="whitespace-nowrap">{tmpl.name.split(' ')[0]}</span>
                            </button>
                          ))}
                        </div>

                        {/* Botón Acción Principal Móvil */}
                        <div className="pt-2 flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={handleFinishAndSave}
                            className="w-full py-3.5 px-5 rounded-2xl bg-brand-navy hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-navy/20 transition-all active:scale-98"
                          >
                            <span>Guardar y Publicar Tarjeta (Paso 3)</span>
                            <ArrowRight className="w-4 h-4 text-brand-cyan" />
                          </button>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => setStep(1)}
                              className="text-xs font-bold text-slate-500 hover:text-slate-800 py-1"
                            >
                              ← Volver a Datos
                            </button>

                            <button
                              type="button"
                              onClick={() => setMobileStep2Tab('catalog')}
                              className="text-xs font-bold text-brand-blue hover:underline py-1"
                            >
                              Ver Catálogo Completo →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VISTA B: CATÁLOGO COMPLETO (Disponible siempre en desktop y como tab en móvil) */}
                  <div className={`space-y-5 ${mobileStep2Tab === 'simulator' ? 'hidden lg:block' : 'block'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                      {PRESET_TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => handleSelectTemplate(tmpl)}
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
                            <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-brand-navy">
                              <span className="flex items-center gap-1 text-emerald-600">
                                <Check className="w-3.5 h-3.5" />
                                <span>Seleccionada</span>
                              </span>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMobileStep2Tab('simulator');
                                }}
                                className="lg:hidden text-[10px] text-brand-blue underline"
                              >
                                Ver en simulador 📱
                              </span>
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

                  {/* Botones de Acción Inmediata (Móvil y Escritorio) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `¡Hola! Te comparto mi tarjeta de contacto digital ProConnect: ${publicUrl}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>Compartir por WhatsApp</span>
                    </a>

                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 bg-brand-navy hover:bg-slate-800 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 text-brand-cyan shrink-0" />
                      <span>Abrir mi Tarjeta en Vivo</span>
                    </a>
                  </div>

                  {/* Tarjeta de Acceso y Enlace Dinámico */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Tu Enlace Dinámico Público</label>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Listo para Compartir
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        readOnly
                        value={publicUrl}
                        className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-mono text-slate-800 select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="w-full sm:w-auto px-5 py-2.5 bg-brand-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-95"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                      </button>
                    </div>
                  </div>

                  {/* QR Code de Descarga Rápida */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0 flex flex-col items-center">
                      <QRCodeSVG
                        id="proconnect-qr-svg"
                        value={publicUrl}
                        size={130}
                        fgColor={activeTemplate.colors.primary}
                        level="Q"
                      />
                      <button
                        type="button"
                        onClick={handleDownloadQr}
                        className="mt-2.5 w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <Download className="w-3 h-3 text-slate-600" />
                        <span>Descargar PNG</span>
                      </button>
                    </div>
                    <div className="space-y-3 text-center sm:text-left flex-1">
                      <div>
                        <h3 className="text-sm font-bold text-brand-navy">Código QR para Compartir Contacto</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Cualquier persona que apunte la cámara de su teléfono escaneará tu perfil y guardará tus datos de inmediato.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                        <Link
                          href="/dashboard"
                          className="px-4 py-2 bg-brand-cyan text-brand-navy font-bold text-xs rounded-xl hover:bg-sky-300 transition-colors shadow-sm"
                        >
                          Ir a mi Panel de Control
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
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Volver y cambiar plantilla o datos</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Columna Derecha: Teléfono Inteligente en Vivo (5 Cols) */}
            <div className={`lg:col-span-5 flex flex-col items-center sticky top-24 self-start ${step !== 3 && mobileTab === 'editor' ? 'hidden lg:flex' : 'flex'}`}>
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

              {/* En móvil: Botón prominente para volver al editor de datos o plantillas */}
              <div className="lg:hidden mt-4 w-full max-w-[340px] sm:max-w-[360px] px-2">
                <button
                  type="button"
                  onClick={() => setMobileTab('editor')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>← Volver a {step === 1 ? 'Editar Datos' : 'Elegir Plantillas'}</span>
                </button>
              </div>

              {/* Botón de Acción Principal Directo bajo el Simulador (Desktop) */}
              {step !== 3 && (
                <div className="hidden lg:block w-full max-w-[340px] sm:max-w-[360px] mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={step === 1 ? goToStep2 : handleFinishAndSave}
                    disabled={isPublishing}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>{step === 1 ? 'Continuar a Elegir Plantilla →' : '🚀 Guardar y Publicar Tarjeta'}</span>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                  </button>
                  <p className="text-[11px] text-slate-400 text-center font-medium">
                    {step === 1 ? 'Paso 1 de 3 • Tus datos se sincronizan en tiempo real' : '¡Casi listo! Pulsa para activar tu enlace y chip NFC'}
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Barra de Acción Flotante Fija Inferior (Garantiza que NUNCA se pierda el botón) */}
        {step !== 3 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 p-2.5 sm:p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl safe-bottom">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                {/* Botón rápido para alternar móvil en móviles */}
                <button
                  type="button"
                  onClick={() => setMobileTab(mobileTab === 'editor' ? 'preview' : 'editor')}
                  className="lg:hidden px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  {mobileTab === 'editor' ? (
                    <>
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>📱 Ver Tarjeta</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5 text-sky-600" />
                      <span>✏️ Editar</span>
                    </>
                  )}
                </button>

                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {step === 1 ? 'Paso 1: Contacto e Identidad' : `Plantilla Activa: ${activeTemplate.name}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setMobileTab('editor');
                    }}
                    className="px-3 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
                  >
                    ← Volver
                  </button>
                )}
                <button
                  type="button"
                  onClick={step === 1 ? goToStep2 : handleFinishAndSave}
                  disabled={isPublishing}
                  className="flex-1 sm:flex-initial px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-75"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Publicando...</span>
                    </>
                  ) : (
                    <>
                      <span>{step === 1 ? 'Continuar a Plantillas →' : '🚀 Guardar y Publicar'}</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Autenticación Product-Led */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => publishCardWithUser(user)}
        title="Crea tu cuenta para publicar tu tarjeta"
        subtitle="Tu tarjeta digital inteligente y chip NFC quedarán protegidos bajo tu usuario en Supabase con Row Level Security."
      />

      {/* Modal de Recorte y Enfoque de Rostro */}
      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={cropperImgSrc || avatarUrl}
        onClose={() => setCropperOpen(false)}
        onCropComplete={handleCropComplete}
        title="Ajustar y Centrar Foto de Perfil"
        shape="rounded"
      />

      <Footer />
    </div>
  );
}
