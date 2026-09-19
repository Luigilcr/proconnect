import { FullCard, ButtonStyle, LayoutType, AvatarPosition, LinkType } from './types';

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return (
    e === 'luigicolonico@gmail.com' ||
    e === 'asesordeseguridad.luigilcr@gmail.com' ||
    e === 'admin@proconnect.app' ||
    e.includes('luigilcr') ||
    e.includes('luigicolonico')
  );
}

const VALID_BUTTON_STYLES: Set<string> = new Set([
  'filled',
  'solid', // Postgres may have solid if migration ran, but we normalize solid to filled for safety
  'outline',
  'glassmorphism',
  'gradient',
  'soft_shadow',
]);

const VALID_LAYOUT_TYPES: Set<string> = new Set([
  'modern',
  'executive',
  'minimal',
  'banner_header',
  'card_id_badge',
  'creative_grid',
]);

const VALID_AVATAR_POSITIONS: Set<string> = new Set([
  'top_center',
  'header_floating',
  'left_aligned',
  'hidden',
]);

const VALID_LINK_TYPES: Set<string> = new Set([
  'whatsapp',
  'phone',
  'email',
  'website',
  'instagram',
  'linkedin',
  'tiktok',
  'custom',
  'twitter',
  'facebook',
]);

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id.trim());
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Normaliza y sanea cualquier tarjeta para inserción 100% segura en PostgreSQL / Supabase,
 * evitando errores de enum ("solid" vs "filled"), errores de UUIDs malformados y violaciones de restricciones.
 */
export function normalizeCardForDatabase(
  rawCard: Partial<FullCard> & Record<string, any>,
  targetUserId?: string,
  userEmail?: string
) {
  const cardId = isValidUuid(rawCard.id) ? rawCard.id! : generateUuid();
  const userId = isValidUuid(targetUserId)
    ? targetUserId!
    : isValidUuid(rawCard.user_id)
    ? rawCard.user_id!
    : generateUuid();

  // Button Style: 'solid' en el frontend debe ser 'filled' en el enum de Supabase
  let rawBtn = String(rawCard.button_style || 'filled').toLowerCase().trim();
  if (rawBtn === 'solid' || !VALID_BUTTON_STYLES.has(rawBtn)) {
    rawBtn = 'filled';
  }

  // Layout Type
  let rawLayout = String(rawCard.layout_type || 'modern').toLowerCase().trim();
  if (!VALID_LAYOUT_TYPES.has(rawLayout)) {
    rawLayout = 'modern';
  }

  // Avatar Position
  let rawAvatarPos = String(rawCard.avatar_position || 'header_floating').toLowerCase().trim();
  if (!VALID_AVATAR_POSITIONS.has(rawAvatarPos)) {
    rawAvatarPos = 'header_floating';
  }

  // Slug
  const cleanSlug = (rawCard.slug || 'tarjeta')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-');

  // Enlaces sanitizados
  const rawLinks = Array.isArray(rawCard.links) ? rawCard.links : [];
  const sanitizedLinks = rawLinks.map((l: any, idx: number) => {
    const linkType = String(l.type || 'website').toLowerCase().trim();
    return {
      id: isValidUuid(l.id) ? l.id : generateUuid(),
      card_id: cardId,
      type: (VALID_LINK_TYPES.has(linkType) ? linkType : 'website') as LinkType,
      label: String(l.label || 'Enlace').slice(0, 100),
      url: String(l.url || '').slice(0, 500),
      icon_name: l.icon_name || null,
      is_active: l.is_active ?? true,
      position_order: idx + 1,
    };
  });

  return {
    id: cardId,
    user_id: userId,
    organization_id: isValidUuid(rawCard.organization_id) ? rawCard.organization_id : null,
    slug: cleanSlug,
    is_active: rawCard.is_active ?? true,
    full_name: String(rawCard.full_name || 'Mi Perfil').slice(0, 150),
    job_title: rawCard.job_title ? String(rawCard.job_title).slice(0, 150) : null,
    company_name: rawCard.company_name ? String(rawCard.company_name).slice(0, 150) : null,
    bio: rawCard.bio ? String(rawCard.bio).slice(0, 500) : null,
    profile_photo_url: rawCard.profile_photo_url || null,
    cover_photo_url: rawCard.cover_photo_url || null,
    logo_url: rawCard.logo_url || null,
    layout_type: rawLayout as LayoutType,
    avatar_position: rawAvatarPos as AvatarPosition,
    button_style: rawBtn as ButtonStyle,
    border_radius: rawCard.border_radius || 'md',
    primary_color: rawCard.primary_color || '#0EA5E9',
    secondary_color: rawCard.secondary_color || '#0369A1',
    accent_color: rawCard.accent_color || '#38BDF8',
    background_color: rawCard.background_color || '#0F172A',
    font_family: rawCard.font_family || 'Inter',
    font_weight: rawCard.font_weight || 'medium',
    include_photo: rawCard.include_photo ?? true,
    custom_vcf_notes: rawCard.custom_vcf_notes || '',
    expires_at: rawCard.expires_at || new Date(Date.now() + 30 * 86400000).toISOString(),
    links: sanitizedLinks,
    multimedia: Array.isArray(rawCard.multimedia) ? rawCard.multimedia : [],
    created_at: rawCard.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_email: userEmail || rawCard.user_email || rawCard.email || null,
  } as FullCard;
}
