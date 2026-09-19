/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * MOTOR VISUAL DINÁMICO DE TARJETA (6 LAYOUTS, 4 TONOS & ESTILOS DE BOTÓN)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { FullCard, CardLink, ButtonStyle, BorderRadius } from '@/lib/types';
import {
  Share2,
  CheckCircle2,
  Building2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  QrCode,
  Radio,
  Fingerprint,
} from 'lucide-react';
import { IconRenderer } from './IconRenderer';
import { VCardDownloadButton } from './VCardDownloadButton';
import { SmartWhatsAppModal } from './SmartWhatsAppModal';
import { QRCodeModal } from './QRCodeModal';
import { MultimediaViewer } from './MultimediaViewer';
import { recordAnalyticsEvent } from '@/lib/data/card-store';

interface DigitalCardProps {
  card: FullCard;
  isSimulator?: boolean;
}

export const DigitalCard: React.FC<DigitalCardProps> = ({
  card,
  isSimulator = false,
}) => {
  const [selectedWhatsApp, setSelectedWhatsApp] = useState<CardLink | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Registrar evento analítico de vista en perfil público
  useEffect(() => {
    if (!isSimulator && card.id) {
      recordAnalyticsEvent(card.id, 'view');
    }
  }, [card.id, isSimulator]);

  // URL pública
  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/c/${card.slug}`
      : `https://proconnect.app/c/${card.slug}`;

  // Enlaces activos con deduplicación defensiva por tipo + URL
  const seenLinkKeys = new Set<string>();
  const activeLinks = (card.links || [])
    .filter((l) => l.is_active)
    .filter((l) => {
      const normalizedUrl = (l.url || '').trim().toLowerCase().replace(/\/$/, '');
      const key = `${l.type}:${normalizedUrl}`;
      if (seenLinkKeys.has(key)) return false;
      seenLinkKeys.add(key);
      return true;
    })
    .sort((a, b) => a.position_order - b.position_order);

  // Clic en enlace
  const handleLinkClick = (link: CardLink, e: React.MouseEvent) => {
    if (card.id && !isSimulator) {
      recordAnalyticsEvent(card.id, 'link_click', { linkId: link.id, label: link.label });
    }
    if (link.type === 'whatsapp') {
      e.preventDefault();
      const rawUrl = (link.url || '').trim();
      const cleanDigits = rawUrl.replace(/[^\d]/g, '');
      const defaultMsg = encodeURIComponent(
        `Hola ${card.full_name}, vi tu tarjeta digital ProConnect y me gustaría ponerme en contacto contigo.`
      );

      let targetUrl = '';
      if (rawUrl.startsWith('http')) {
        if (rawUrl.includes('text=')) {
          targetUrl = rawUrl;
        } else {
          targetUrl = `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}text=${defaultMsg}`;
        }
      } else if (cleanDigits) {
        targetUrl = `https://wa.me/${cleanDigits}?text=${defaultMsg}`;
      } else {
        targetUrl = `https://wa.me/?text=${defaultMsg}`;
      }

      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (link.type === 'phone') {
      window.location.href = `tel:${link.url.replace(/[^\d+]/g, '')}`;
      return;
    }
    if (link.type === 'email') {
      const email = link.url.replace(/^mailto:/i, '');
      window.location.href = `mailto:${email}`;
      return;
    }
    const finalUrl = link.url.startsWith('http') ? link.url : `https://${link.url}`;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  // Helper: clases de radio de borde
  const getRadiusClass = (radius?: BorderRadius): string => {
    switch (radius) {
      case 'none':
        return 'rounded-none';
      case 'sm':
        return 'rounded-md';
      case 'md':
        return 'rounded-xl';
      case 'lg':
        return 'rounded-3xl';
      case 'full':
        return 'rounded-full';
      default:
        return 'rounded-2xl';
    }
  };

  // Helper: estilos de botones
  const getButtonCustomStyle = (style?: ButtonStyle) => {
    const primary = card.primary_color || '#0ea5e9';
    const secondary = card.secondary_color || '#0369a1';
    const accent = card.accent_color || '#38bdf8';

    switch (style) {
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${primary}, ${secondary})`,
          color: '#ffffff',
          border: 'none',
        };
      case 'outline':
        return {
          background: 'transparent',
          color: primary,
          border: `1.5px solid ${primary}`,
        };
      case 'glassmorphism':
        return {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
        };
      case 'soft_shadow':
        return {
          backgroundColor: primary,
          color: '#ffffff',
          boxShadow: `0 8px 20px ${primary}40`,
        };
      default: // solid
        return {
          backgroundColor: primary,
          color: '#ffffff',
        };
    }
  };

  // Helper: clase de fuente y peso
  const getFontFamilyStyle = () => {
    switch (card.font_family?.toLowerCase()) {
      case 'poppins':
        return 'font-poppins';
      case 'playfair display':
      case 'playfair':
        return 'font-playfair';
      case 'roboto':
        return 'font-roboto';
      case 'montserrat':
        return 'font-montserrat';
      case 'cinzel':
        return 'font-serif tracking-wider';
      case 'syne':
        return 'font-sans font-bold tracking-wide';
      default:
        return 'font-sans';
    }
  };

  const getFontWeightStyle = () => {
    switch (card.font_weight) {
      case 'bold':
        return 'font-bold';
      case 'semibold':
        return 'font-semibold';
      case 'normal':
        return 'font-normal';
      default:
        return 'font-medium';
    }
  };

  // Helper: Texturas de fondo CSS dinámicas
  const getTextureStyle = () => {
    switch (card.background_texture) {
      case 'dots':
        return {
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        };
      case 'grid':
        return {
          backgroundImage:
            'linear-gradient(to right, rgba(255, 255, 255, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.07) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        };
      case 'carbon':
        return {
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.25) 0px, rgba(0, 0, 0, 0.25) 2px, transparent 2px, transparent 4px)',
        };
      case 'subtle_noise':
        return {
          backgroundImage:
            'radial-gradient(ellipse at top left, rgba(255,255,255,0.08), transparent 70%), radial-gradient(ellipse at bottom right, rgba(0,0,0,0.3), transparent 70%)',
        };
      case 'mesh_gradient':
        return {
          backgroundImage: `radial-gradient(circle at 15% 15%, ${card.primary_color}35, transparent 50%), radial-gradient(circle at 85% 85%, ${
            card.accent_color || card.secondary_color
          }30, transparent 50%)`,
        };
      default:
        return {};
    }
  };

  // Helper: Efecto de avatar (glow, metallic ring, glass)
  const getAvatarEffectStyle = () => {
    switch (card.avatar_effect) {
      case 'glow_primary':
        return {
          borderColor: card.primary_color,
          boxShadow: `0 0 25px ${card.primary_color}90, 0 0 50px ${card.primary_color}35`,
        };
      case 'glow_accent':
        return {
          borderColor: card.accent_color || '#38bdf8',
          boxShadow: `0 0 25px ${card.accent_color || '#38bdf8'}95, 0 0 50px ${card.accent_color || '#38bdf8'}35`,
        };
      case 'metallic_ring':
        return {
          borderColor: '#F59E0B',
          boxShadow: '0 0 18px rgba(245, 158, 11, 0.55), inset 0 0 10px rgba(245, 158, 11, 0.3)',
        };
      case 'glass_border':
        return {
          borderColor: 'rgba(255, 255, 255, 0.45)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          backdropFilter: 'blur(8px)',
        };
      default:
        return {
          borderColor: card.primary_color,
          boxShadow: `0 0 20px ${card.primary_color}40`,
        };
    }
  };

  // Helper: Insignia de verificación
  const renderCardBadge = () => {
    if (!card.card_badge || card.card_badge === 'none') return null;

    switch (card.card_badge) {
      case 'verified_pro':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 tracking-wide">
            <CheckCircle2 className="w-3 h-3 text-sky-400 shrink-0" />
            PRO VERIFICADO
          </span>
        );
      case 'vip_executive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 tracking-wide">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            VIP EXECUTIVE
          </span>
        );
      case 'top_speaker':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 tracking-wide">
            <Radio className="w-3 h-3 text-purple-400 shrink-0" />
            TOP SPEAKER
          </span>
        );
      case 'official_partner':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tracking-wide">
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            PARTNER OFICIAL
          </span>
        );
      default:
        return null;
    }
  };

  const radiusClass = getRadiusClass(card.border_radius);

  // ============================================================================
  // RENDERIZADOR DEL AVATAR SEGÚN POSICIÓN
  // ============================================================================
  const renderAvatar = (extraClass = '') => {
    if (card.avatar_position === 'hidden') return null;

    const avatarUrl =
      card.profile_photo_url ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600';

    return (
      <div
        className={`relative overflow-hidden bg-slate-800 shrink-0 border-2 ${radiusClass} ${extraClass}`}
        style={getAvatarEffectStyle()}
      >
        <img
          src={avatarUrl}
          alt={card.full_name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  };

  // ============================================================================
  // LAYOUT: CRIMSON QUOTE & BIO ACCENT (ESTILO ROSSANA / PROELCA DARK)
  // ============================================================================
  if (card.layout_type === 'crimson_quote') {
    const primaryAccent = card.primary_color || '#DC2626';
    const bgContainer = card.background_color || '#0D1117';

    return (
      <div
        className={`w-full max-w-md mx-auto min-h-screen text-slate-100 flex flex-col justify-between ${getFontFamilyStyle()} ${
          isSimulator ? 'min-h-0' : ''
        }`}
        style={{ backgroundColor: bgContainer, ...getTextureStyle() }}
      >
        <div className="p-4 sm:p-6">
          {/* Main Card Container */}
          <div className="p-6 sm:p-7 rounded-[28px] bg-[#0E131F] border border-slate-800/80 shadow-2xl relative overflow-hidden space-y-5">
            
            {/* Top Share & QR Trigger */}
            <div className="flex items-center justify-between">
              {card.logo_url ? (
                <div className="h-8 px-2.5 py-1 bg-white/10 rounded-xl flex items-center border border-white/10 shadow-sm">
                  <img src={card.logo_url} alt="Logo" className="max-h-6 object-contain" />
                </div>
              ) : (
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold">
                  {card.company_name || 'ProConnect Smart Card'}
                </span>
              )}
              <button
                onClick={() => setIsQRModalOpen(true)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                title="Compartir QR / NFC"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Header: Circular Avatar with Glowing Crimson Ring & Info */}
            <div className="flex items-center gap-3.5">
              <div
                className="relative rounded-full overflow-hidden w-14 h-14 sm:w-16 sm:h-16 shrink-0 border-2"
                style={{
                  borderColor: primaryAccent,
                  boxShadow: `0 0 15px ${primaryAccent}50`,
                }}
              >
                <img
                  src={
                    card.profile_photo_url ||
                    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'
                  }
                  alt={card.full_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-normal leading-snug break-normal">
                    {card.full_name}
                  </h1>
                  {renderCardBadge()}
                </div>
                {card.job_title && (
                  <p
                    className="text-xs sm:text-sm font-bold tracking-tight leading-snug break-normal"
                    style={{ color: primaryAccent }}
                  >
                    {card.job_title}
                  </p>
                )}
                {card.company_name && (
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 tracking-wider uppercase break-normal">
                    {card.company_name}
                  </p>
                )}
              </div>
            </div>

            {/* Quote Box with Left Accent Border */}
            <div
              className="p-4 rounded-2xl bg-[#080C12] border border-white/5 relative"
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: primaryAccent,
              }}
            >
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal italic">
                "{card.bio || 'Somos tu aliado confiable para alcanzar tus objetivos profesionales y corporativos.'}"
              </p>
            </div>

            {/* VCard Download Button (Pill Styled) */}
            <div>
              <VCardDownloadButton
                card={card}
                publicUrl={publicUrl}
                className="w-full rounded-2xl font-bold py-3.5 shadow-lg"
              />
            </div>

            {/* Dynamic Active Links */}
            <div className="space-y-3 pt-1">
              {activeLinks.map((link, idx) => {
                const isFirst = idx === 0;
                return (
                  <button
                    key={link.id}
                    onClick={(e) => handleLinkClick(link, e)}
                    style={
                      isFirst
                        ? {
                            backgroundColor: primaryAccent,
                            boxShadow: `0 10px 25px ${primaryAccent}40`,
                          }
                        : undefined
                    }
                    className={`w-full flex items-center justify-center gap-2.5 p-3.5 text-xs sm:text-sm font-bold rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.98] ${
                      isFirst
                        ? 'text-white'
                        : 'bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-700/60'
                    }`}
                  >
                    <IconRenderer type={link.type} iconName={link.icon_name} className="w-4 h-4" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Multimedia Viewer */}
            {card.multimedia && card.multimedia.length > 0 && (
              <div className="pt-2">
                <MultimediaViewer items={card.multimedia} primaryColor={primaryAccent} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-xs text-slate-500 border-t border-white/5">
          <p className="text-[10px] uppercase font-mono tracking-widest">
            ProConnect • Verified Digital ID
          </p>
        </div>

        {selectedWhatsApp && (
          <SmartWhatsAppModal
            isOpen={Boolean(selectedWhatsApp)}
            onClose={() => setSelectedWhatsApp(null)}
            cardId={card.id}
            recipientName={card.full_name}
            rawPhoneNumber={selectedWhatsApp.url}
          />
        )}

        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          fullUrl={publicUrl}
          cardName={card.full_name}
          companyName={card.company_name}
          primaryColor={primaryAccent}
        />
      </div>
    );
  }

  // ============================================================================
  // LAYOUT 1: CARD ID BADGE (CREDENCIAL CORPORATIVA CON CHIP)
  // ============================================================================
  if (card.layout_type === 'card_id_badge') {
    return (
      <div
        className={`w-full max-w-md mx-auto min-h-screen text-slate-100 flex flex-col justify-between ${getFontFamilyStyle()} ${
          isSimulator ? 'min-h-0' : ''
        }`}
        style={{ backgroundColor: card.background_color || '#0F172A', ...getTextureStyle() }}
      >
        <div className="p-6">
          {/* Gafete / Card Container */}
          <div
            className={`p-6 border border-white/10 bg-slate-900/90 shadow-2xl relative overflow-hidden ${radiusClass}`}
          >
            {/* Hologram Ribbon */}
            <div
              className="absolute top-0 left-0 right-0 h-2"
              style={{
                background: `linear-gradient(90deg, ${card.primary_color}, ${card.accent_color || card.primary_color}, ${card.secondary_color})`,
              }}
            />

            {/* Header del Gafete */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  {card.company_name || 'ProConnect ID Card'}
                </span>
              </div>
              <button
                onClick={() => setIsQRModalOpen(true)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar & Simulado Chip Holográfico */}
            <div className="flex items-start gap-4 mb-5">
              {renderAvatar('w-24 h-28')}
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-amber-400 font-mono mb-2 border border-amber-400/20">
                  <Fingerprint className="w-3 h-3" />
                  <span>NFC SECURE ID</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-lg font-black text-white truncate">
                    {card.full_name}
                  </h1>
                  {renderCardBadge()}
                </div>
                <p
                  style={{ color: card.primary_color }}
                  className="text-xs font-semibold truncate"
                >
                  {card.job_title}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  ID: #{card.slug.toUpperCase().slice(0, 8)}
                </p>
              </div>
            </div>

            {/* Bio */}
            {card.bio && (
              <p className="text-xs text-slate-300/90 leading-relaxed mb-5 bg-white/5 p-3 rounded-xl border border-white/5">
                {card.bio}
              </p>
            )}

            {/* Botón vCard */}
            <div className="mb-5">
              <VCardDownloadButton card={card} publicUrl={publicUrl} className={radiusClass} />
            </div>

            {/* Canales */}
            <div className="space-y-2 mb-5">
              {activeLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={(e) => handleLinkClick(link, e)}
                  style={getButtonCustomStyle(card.button_style)}
                  className={`w-full flex items-center justify-between p-3.5 text-xs font-semibold transition-all hover:scale-[1.01] active:scale-[0.98] ${radiusClass}`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconRenderer type={link.type} iconName={link.icon_name} className="w-4 h-4" />
                    <span>{link.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                </button>
              ))}
            </div>

            {/* Multimedia */}
            {card.multimedia && card.multimedia.length > 0 && (
              <div className="mb-4">
                <MultimediaViewer items={card.multimedia} primaryColor={card.primary_color} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-xs text-slate-500 border-t border-white/5">
          <p className="text-[10px] uppercase font-mono tracking-widest">
            ProConnect • Verified Digital ID
          </p>
        </div>

        {selectedWhatsApp && (
          <SmartWhatsAppModal
            isOpen={Boolean(selectedWhatsApp)}
            onClose={() => setSelectedWhatsApp(null)}
            cardId={card.id}
            recipientName={card.full_name}
            rawPhoneNumber={selectedWhatsApp.url}
          />
        )}

        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          fullUrl={publicUrl}
          cardName={card.full_name}
          companyName={card.company_name}
          primaryColor={card.primary_color}
        />
      </div>
    );
  }

  // ============================================================================
  // LAYOUT 2: BANNER HEADER (CABECERA PANORÁMICA MODERNA)
  // ============================================================================
  if (card.layout_type === 'banner_header') {
    return (
      <div
        className={`w-full max-w-md mx-auto min-h-screen text-slate-100 flex flex-col justify-between ${getFontFamilyStyle()} ${
          isSimulator ? 'min-h-0' : ''
        }`}
        style={{ backgroundColor: card.background_color || '#0F172A', ...getTextureStyle() }}
      >
        <div className="w-full">
          {/* Panoramic Cover */}
          <div className="relative h-48 w-full bg-slate-800 overflow-hidden">
            {card.cover_photo_url ? (
              <img
                src={card.cover_photo_url}
                alt="Portada"
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, ${card.primary_color}, ${card.secondary_color})`,
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Top Bar with Logo & Share */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              {card.logo_url ? (
                <div className="h-9 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-xl flex items-center shadow-lg">
                  <img src={card.logo_url} alt="Logo" className="max-h-6 object-contain" />
                </div>
              ) : (
                <span className="text-xs font-bold text-white tracking-wide uppercase bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-md">
                  {card.company_name || 'ProConnect'}
                </span>
              )}
              <button
                onClick={() => setIsQRModalOpen(true)}
                className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Section */}
          <div className="px-6 -mt-14 pb-6">
            <div
              className={`flex items-end gap-4 mb-4 ${
                card.avatar_position === 'top_center'
                  ? 'flex-col items-center text-center'
                  : 'justify-between'
              }`}
            >
              {renderAvatar('w-24 h-24')}
              <button
                onClick={() => setIsQRModalOpen(true)}
                className={`px-3.5 py-2 bg-white/10 hover:bg-white/15 backdrop-blur-md text-xs font-semibold text-white border border-white/20 flex items-center gap-1.5 transition-colors ${radiusClass}`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>NFC / QR</span>
              </button>
            </div>

            <div className="space-y-1 mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`text-2xl font-black text-white ${getFontWeightStyle()}`}>
                  {card.full_name}
                </h1>
                {renderCardBadge()}
              </div>
              {card.job_title && (
                <p className="text-xs text-slate-300 font-medium">
                  {card.job_title}
                </p>
              )}
              {card.company_name && (
                <p
                  style={{ color: card.accent_color || card.primary_color }}
                  className="text-xs font-semibold flex items-center gap-1"
                >
                  <Building2 className="w-3 h-3" />
                  <span>{card.company_name}</span>
                </p>
              )}
              {card.bio && (
                <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-white/10 mt-3">
                  {card.bio}
                </p>
              )}
            </div>

            {/* VCF Button */}
            <div className="mb-5">
              <VCardDownloadButton card={card} publicUrl={publicUrl} className={radiusClass} />
            </div>

            {/* Links */}
            <div className="space-y-2.5 mb-5">
              {activeLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={(e) => handleLinkClick(link, e)}
                  style={getButtonCustomStyle(card.button_style)}
                  className={`w-full flex items-center justify-between p-3.5 text-xs font-semibold transition-all hover:scale-[1.01] active:scale-[0.98] ${radiusClass}`}
                >
                  <div className="flex items-center gap-3">
                    <IconRenderer type={link.type} iconName={link.icon_name} className="w-4 h-4" />
                    <span>{link.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                </button>
              ))}
            </div>

            {/* Multimedia */}
            {card.multimedia && card.multimedia.length > 0 && (
              <div className="mb-4">
                <MultimediaViewer items={card.multimedia} primaryColor={card.primary_color} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-xs text-slate-500 border-t border-white/5">
          <p className="text-[10px]">ProConnect • Banner Edition</p>
        </div>

        {selectedWhatsApp && (
          <SmartWhatsAppModal
            isOpen={Boolean(selectedWhatsApp)}
            onClose={() => setSelectedWhatsApp(null)}
            cardId={card.id}
            recipientName={card.full_name}
            rawPhoneNumber={selectedWhatsApp.url}
          />
        )}

        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          fullUrl={publicUrl}
          cardName={card.full_name}
          companyName={card.company_name}
          primaryColor={card.primary_color}
        />
      </div>
    );
  }

  // ============================================================================
  // LAYOUT 3: CREATIVE GRID (BENTO GRID MODULAR)
  // ============================================================================
  if (card.layout_type === 'creative_grid') {
    return (
      <div
        className={`w-full max-w-md mx-auto min-h-screen text-slate-100 flex flex-col justify-between ${getFontFamilyStyle()} ${
          isSimulator ? 'min-h-0' : ''
        }`}
        style={{ backgroundColor: card.background_color || '#18181B', ...getTextureStyle() }}
      >
        <div className="p-6">
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-6">
            <span
              style={{ color: card.accent_color || card.primary_color }}
              className="text-xs font-black uppercase tracking-widest"
            >
              {card.company_name || 'Creative Studio'}
            </span>
            <button
              onClick={() => setIsQRModalOpen(true)}
              className="p-2 rounded-full bg-white/10 text-white"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Bento Block 1: Profile & Identity */}
          <div
            className={`p-5 mb-4 border border-white/10 bg-white/5 flex items-center gap-4 ${radiusClass}`}
          >
            {renderAvatar('w-20 h-20')}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className={`text-lg font-black text-white truncate ${getFontWeightStyle()}`}>
                  {card.full_name}
                </h1>
                {renderCardBadge()}
              </div>
              <p className="text-xs text-slate-300 truncate">{card.job_title}</p>
              <span
                style={{ backgroundColor: card.primary_color }}
                className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white"
              >
                Online • NFC Ready
              </span>
            </div>
          </div>

          {/* Bento Block 2: Bio */}
          {card.bio && (
            <div className={`p-4 mb-4 border border-white/10 bg-white/5 ${radiusClass}`}>
              <p className="text-xs text-slate-300 leading-relaxed">{card.bio}</p>
            </div>
          )}

          {/* VCF Button */}
          <div className="mb-4">
            <VCardDownloadButton card={card} publicUrl={publicUrl} className={radiusClass} />
          </div>

          {/* Bento Grid: 2 Column Links */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {activeLinks.map((link) => (
              <button
                key={link.id}
                onClick={(e) => handleLinkClick(link, e)}
                style={getButtonCustomStyle(card.button_style)}
                className={`p-3.5 flex flex-col items-center justify-center text-center text-xs font-semibold gap-2 transition-transform hover:scale-105 ${radiusClass}`}
              >
                <IconRenderer type={link.type} iconName={link.icon_name} className="w-5 h-5" />
                <span className="truncate max-w-[120px]">{link.label}</span>
              </button>
            ))}
          </div>

          {/* Multimedia */}
          {card.multimedia && card.multimedia.length > 0 && (
            <div className="mb-4">
              <MultimediaViewer items={card.multimedia} primaryColor={card.primary_color} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-xs text-slate-500 border-t border-white/5">
          <p className="text-[10px]">ProConnect • Creative Bento Edition</p>
        </div>

        {selectedWhatsApp && (
          <SmartWhatsAppModal
            isOpen={Boolean(selectedWhatsApp)}
            onClose={() => setSelectedWhatsApp(null)}
            cardId={card.id}
            recipientName={card.full_name}
            rawPhoneNumber={selectedWhatsApp.url}
          />
        )}

        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          fullUrl={publicUrl}
          cardName={card.full_name}
          companyName={card.company_name}
          primaryColor={card.primary_color}
        />
      </div>
    );
  }

  // ============================================================================
  // LAYOUT 4: EXECUTIVE (FORMAL CORPORATIVO)
  // ============================================================================
  if (card.layout_type === 'executive') {
    return (
      <div
        className={`w-full max-w-md mx-auto min-h-screen text-stone-200 flex flex-col justify-between ${getFontFamilyStyle()} ${
          isSimulator ? 'min-h-0' : ''
        }`}
        style={{ backgroundColor: card.background_color || '#18181B', ...getTextureStyle() }}
      >
        <div className="w-full px-6 pt-8 pb-6">
          {/* Header Superior */}
          <div className="flex items-center justify-between border-b border-stone-700/60 pb-5 mb-6">
            <div>
              {card.logo_url ? (
                <img src={card.logo_url} alt="Logo" className="h-8 object-contain" />
              ) : (
                <span
                  style={{ color: card.primary_color }}
                  className="text-xs font-serif font-bold uppercase tracking-widest"
                >
                  {card.company_name || 'Executive Card'}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsQRModalOpen(true)}
              className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700/80 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Retrato Ejecutivo */}
          <div className="flex flex-col items-center text-center mb-6">
            {renderAvatar('w-32 h-32 mb-4')}
            <div className="flex items-center justify-center gap-2 flex-wrap mb-1">
              <h1 className={`text-2xl font-serif text-stone-100 ${getFontWeightStyle()}`}>
                {card.full_name}
              </h1>
              {renderCardBadge()}
            </div>
            {card.job_title && (
              <p
                style={{ color: card.primary_color }}
                className="text-xs font-medium uppercase tracking-wider mb-1"
              >
                {card.job_title}
              </p>
            )}
            {card.company_name && (
              <p className="text-xs text-stone-400 font-serif italic mb-3">
                {card.company_name}
              </p>
            )}
            {card.bio && (
              <p className="text-xs text-stone-300 leading-relaxed max-w-sm px-2">
                {card.bio}
              </p>
            )}
          </div>

          {/* Botón Descarga VCF */}
          <div className="mb-6">
            <VCardDownloadButton card={card} publicUrl={publicUrl} className={radiusClass} />
          </div>

          {/* Enlaces de Contacto */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-stone-500 mb-2">
              <div className="h-px bg-stone-800 flex-1" />
              <span className="text-[10px] uppercase font-bold tracking-widest">
                Canales Oficiales
              </span>
              <div className="h-px bg-stone-800 flex-1" />
            </div>

            {activeLinks.map((link) => (
              <button
                key={link.id}
                onClick={(e) => handleLinkClick(link, e)}
                style={getButtonCustomStyle(card.button_style)}
                className={`w-full flex items-center justify-between p-3.5 text-xs font-medium transition-all ${radiusClass}`}
              >
                <div className="flex items-center gap-3">
                  <IconRenderer type={link.type} iconName={link.icon_name} className="w-4 h-4" />
                  <span>{link.label}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            ))}
          </div>

          {/* Multimedia */}
          {card.multimedia && card.multimedia.length > 0 && (
            <div className="mb-6">
              <MultimediaViewer items={card.multimedia} primaryColor={card.primary_color} />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-800/80 text-center text-xs text-stone-500">
          <p className="text-[10px] uppercase tracking-widest">
            ProConnect Executive Edition
          </p>
        </div>

        {selectedWhatsApp && (
          <SmartWhatsAppModal
            isOpen={Boolean(selectedWhatsApp)}
            onClose={() => setSelectedWhatsApp(null)}
            cardId={card.id}
            recipientName={card.full_name}
            rawPhoneNumber={selectedWhatsApp.url}
          />
        )}

        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          fullUrl={publicUrl}
          cardName={card.full_name}
          companyName={card.company_name}
          primaryColor={card.primary_color}
        />
      </div>
    );
  }

  // ============================================================================
  // LAYOUT 5: MINIMAL (ESENCIAL Y LIMPIO)
  // ============================================================================
  if (card.layout_type === 'minimal') {
    return (
      <div
        className={`w-full max-w-md mx-auto min-h-screen text-slate-800 flex flex-col justify-between ${getFontFamilyStyle()} ${
          isSimulator ? 'min-h-0' : ''
        }`}
        style={{ backgroundColor: card.background_color || '#FAFAFA', ...getTextureStyle() }}
      >
        <div className="w-full px-6 pt-10 pb-6">
          <div className="flex items-center justify-between mb-8">
            {renderAvatar('w-16 h-16')}
            <button
              onClick={() => setIsQRModalOpen(true)}
              className="p-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className={`text-2xl font-bold tracking-tight text-slate-900 ${getFontWeightStyle()}`}>
                {card.full_name}
              </h1>
              {renderCardBadge()}
            </div>
            {card.job_title && (
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
                {card.job_title}
              </p>
            )}
            {card.company_name && (
              <p style={{ color: card.primary_color }} className="text-xs font-medium">
                {card.company_name}
              </p>
            )}
            {card.bio && (
              <p className="text-xs text-slate-600 leading-relaxed mt-3">{card.bio}</p>
            )}
          </div>

          <div className="mb-6">
            <VCardDownloadButton card={card} publicUrl={publicUrl} className={radiusClass} />
          </div>

          <div className="space-y-2 mb-6">
            {activeLinks.map((link) => (
              <button
                key={link.id}
                onClick={(e) => handleLinkClick(link, e)}
                style={getButtonCustomStyle(card.button_style)}
                className={`w-full flex items-center justify-between p-3.5 text-xs font-medium transition-all ${radiusClass}`}
              >
                <div className="flex items-center gap-3">
                  <IconRenderer type={link.type} iconName={link.icon_name} className="w-4 h-4" />
                  <span>{link.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-80" />
              </button>
            ))}
          </div>

          {card.multimedia && card.multimedia.length > 0 && (
            <div className="mb-6">
              <MultimediaViewer items={card.multimedia} primaryColor={card.primary_color} />
            </div>
          )}
        </div>

        <div className="px-6 py-4 text-center text-xs text-slate-400 border-t border-slate-200/60">
          <p className="text-[11px]">ProConnect • Tarjeta Inteligente</p>
        </div>

        {selectedWhatsApp && (
          <SmartWhatsAppModal
            isOpen={Boolean(selectedWhatsApp)}
            onClose={() => setSelectedWhatsApp(null)}
            cardId={card.id}
            recipientName={card.full_name}
            rawPhoneNumber={selectedWhatsApp.url}
          />
        )}

        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          fullUrl={publicUrl}
          cardName={card.full_name}
          companyName={card.company_name}
          primaryColor={card.primary_color}
        />
      </div>
    );
  }

  // ============================================================================
  // LAYOUT 6: MODERN (DEFAULT FLOTANTE CON DEGRADADO)
  // ============================================================================
  return (
    <div
      className={`w-full max-w-md mx-auto min-h-screen text-slate-100 flex flex-col justify-between ${getFontFamilyStyle()} ${
        isSimulator ? 'min-h-0' : ''
      }`}
      style={{ backgroundColor: card.background_color || '#0F172A', ...getTextureStyle() }}
    >
      <div className="w-full">
        {/* Cover */}
        <div className="relative h-44 w-full overflow-hidden bg-slate-800">
          {card.cover_photo_url ? (
            <img src={card.cover_photo_url} alt="Portada" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${card.primary_color}, ${card.secondary_color})`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <button
            onClick={() => setIsQRModalOpen(true)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {card.logo_url && (
            <div className="absolute top-4 left-4 h-10 px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-md flex items-center shadow-lg">
              <img src={card.logo_url} alt="Logo" className="max-h-7 object-contain" />
            </div>
          )}
        </div>

        {/* Floating Identity Box */}
        <div className="relative px-5 -mt-16 pb-6">
          <div className="flex items-end justify-between mb-4">
            {renderAvatar('w-28 h-28')}
            <button
              onClick={() => setIsQRModalOpen(true)}
              className={`px-3.5 py-2 bg-white/10 hover:bg-white/15 backdrop-blur-md text-xs font-semibold text-white border border-white/20 flex items-center gap-1.5 transition-colors ${radiusClass}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>NFC / QR</span>
            </button>
          </div>

          <div className="space-y-1 mb-5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-xl font-bold text-white tracking-tight ${getFontWeightStyle()}`}>
                {card.full_name}
              </h1>
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 fill-sky-400/20" />
              {renderCardBadge()}
            </div>

            {card.job_title && (
              <p className="text-sm font-medium text-slate-300">{card.job_title}</p>
            )}

            {card.company_name && (
              <div
                style={{ color: card.accent_color || card.primary_color }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold mt-0.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{card.company_name}</span>
              </div>
            )}

            {card.bio && (
              <p className="text-xs text-slate-300/90 leading-relaxed pt-2 border-t border-white/10 mt-3">
                {card.bio}
              </p>
            )}
          </div>

          {/* VCF Button */}
          <div className="mb-6">
            <VCardDownloadButton card={card} publicUrl={publicUrl} className={radiusClass} />
          </div>

          {/* Dynamic Links */}
          <div className="space-y-2.5 mb-6">
            {activeLinks.map((link) => (
              <button
                key={link.id}
                onClick={(e) => handleLinkClick(link, e)}
                style={getButtonCustomStyle(card.button_style)}
                className={`w-full flex items-center justify-between p-3.5 text-xs font-semibold transition-all hover:scale-[1.01] active:scale-[0.98] ${radiusClass}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <IconRenderer type={link.type} iconName={link.icon_name} className="w-4 h-4" />
                  <span className="truncate">{link.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-80 shrink-0" />
              </button>
            ))}
          </div>

          {/* Multimedia */}
          {card.multimedia && card.multimedia.length > 0 && (
            <div className="mb-6">
              <MultimediaViewer items={card.multimedia} primaryColor={card.primary_color} />
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-white/10 text-center text-xs text-slate-400">
        <p className="text-[11px]">ProConnect • Smart Card</p>
      </div>

      {selectedWhatsApp && (
        <SmartWhatsAppModal
          isOpen={Boolean(selectedWhatsApp)}
          onClose={() => setSelectedWhatsApp(null)}
          cardId={card.id}
          recipientName={card.full_name}
          rawPhoneNumber={selectedWhatsApp.url}
        />
      )}

      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        fullUrl={publicUrl}
        cardName={card.full_name}
        companyName={card.company_name}
        primaryColor={card.primary_color}
      />
    </div>
  );
};
