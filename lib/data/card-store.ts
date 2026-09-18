/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * SERVICIO Y ALMACÉN DE DATOS MULTI-TENANT & B2B
 */

import {
  FullCard,
  Organization,
  SystemMetrics,
  User,
  UserRole,
  WhatsAppLead,
  LeadStatus,
  AnalyticsEvent,
  AnalyticsEventType,
} from '../types';
import {
  DEMO_CARDS,
  DEMO_ORGANIZATIONS,
  DEMO_USERS,
  DEMO_LEADS,
  LUIGI_COLONICO_CARD,
} from './demo-data';

const STORAGE_CARDS_KEY = 'proconnect_cards_data_v2';
const STORAGE_ORGS_KEY = 'proconnect_orgs_data_v2';
const STORAGE_USERS_KEY = 'proconnect_users_data_v2';
const STORAGE_LEADS_KEY = 'proconnect_leads_data_v2';
const STORAGE_ANALYTICS_KEY = 'proconnect_analytics_data_v2';

// ============================================================================
// 1. GESTIÓN DE ORGANIZACIONES (B2B)
// ============================================================================

export function getStoredOrganizations(): Organization[] {
  if (typeof window === 'undefined') return DEMO_ORGANIZATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_ORGS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_ORGS_KEY, JSON.stringify(DEMO_ORGANIZATIONS));
      return DEMO_ORGANIZATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEMO_ORGANIZATIONS;
  } catch {
    return DEMO_ORGANIZATIONS;
  }
}

export function getOrganizationById(id: string): Organization | null {
  const orgs = getStoredOrganizations();
  return orgs.find((o) => o.id === id) || null;
}

export function getOrganizationBySlug(slug: string): Organization | null {
  const orgs = getStoredOrganizations();
  return orgs.find((o) => o.slug === slug) || null;
}

export function saveOrganization(org: Organization): Organization {
  const orgs = getStoredOrganizations();
  const index = orgs.findIndex((o) => o.id === org.id);
  if (index >= 0) {
    orgs[index] = { ...org, updated_at: new Date().toISOString() };
  } else {
    orgs.push({ ...org, created_at: new Date().toISOString() });
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_ORGS_KEY, JSON.stringify(orgs));
  }
  return org;
}

// ============================================================================
// 2. GESTIÓN DE TARJETAS (CARDS)
// ============================================================================

function ensureCardExpiration(card: FullCard): FullCard {
  if (card.expires_at) return card;
  const now = Date.now();
  // Asignar fechas demostrativas según el slug si aún no tiene expires_at
  if (card.slug === 'luigi-colonico') {
    return { ...card, expires_at: new Date(now + 30 * 86400000).toISOString(), plan_duration: 'monthly' };
  }
  if (card.slug === 'carlos-fibraconnect') {
    return { ...card, expires_at: new Date(now + 4 * 86400000).toISOString(), plan_duration: 'monthly' };
  }
  if (card.slug === 'elena-rodriguez') {
    return { ...card, expires_at: new Date(now - 3 * 86400000).toISOString(), plan_duration: 'monthly' };
  }
  if (card.slug === 'marcos-tech') {
    return { ...card, expires_at: new Date(now + 6 * 86400000).toISOString(), plan_duration: 'monthly' };
  }
  const created = card.created_at ? new Date(card.created_at).getTime() : now;
  return {
    ...card,
    expires_at: new Date(created + 30 * 86400000).toISOString(),
    plan_duration: card.plan_duration || 'monthly',
  };
}

export function getStoredCards(): FullCard[] {
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const file = path.join(process.cwd(), 'data', 'cards.json');
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '').trim();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, FullCard>();
          DEMO_CARDS.forEach((c) => map.set(c.slug.toLowerCase().trim(), ensureCardExpiration(c)));
          parsed.forEach((c: FullCard) => {
            if (c && c.slug) map.set(c.slug.toLowerCase().trim(), ensureCardExpiration(c));
          });
          return Array.from(map.values());
        }
      }
    } catch {}
    return DEMO_CARDS.map(ensureCardExpiration);
  }
  try {
    const raw = localStorage.getItem(STORAGE_CARDS_KEY);
    if (!raw) {
      const initial = DEMO_CARDS.map(ensureCardExpiration);
      localStorage.setItem(STORAGE_CARDS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (!parsed.some((c: FullCard) => c?.slug === 'luigi-colonico')) {
        parsed.unshift(ensureCardExpiration(LUIGI_COLONICO_CARD));
      }
      const updated = parsed.map(ensureCardExpiration);
      try {
        localStorage.setItem(STORAGE_CARDS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    }
    return DEMO_CARDS.map(ensureCardExpiration);
  } catch {
    return DEMO_CARDS.map(ensureCardExpiration);
  }
}

export function persistCards(cards: FullCard[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_CARDS_KEY, JSON.stringify(cards));
  } catch (error) {
    console.error('Error saving cards to storage:', error);
  }
}

export function getCardBySlug(slug: string): FullCard | null {
  const cards = getStoredCards();
  const normalized = slug.toLowerCase().trim();
  return cards.find((c) => c.slug.toLowerCase().trim() === normalized) || null;
}

export function getCardById(id: string): FullCard | null {
  const cards = getStoredCards();
  return cards.find((c) => c.id === id) || null;
}

export function getCardsByOrganizationId(orgId: string): FullCard[] {
  const cards = getStoredCards();
  return cards.filter((c) => c.organization_id === orgId);
}

export function saveCard(updatedCard: FullCard): FullCard {
  const cards = getStoredCards();
  const index = cards.findIndex(
    (c) => c.id === updatedCard.id || (c.slug && c.slug.toLowerCase() === updatedCard.slug.toLowerCase())
  );

  let finalCard: FullCard = {
    ...updatedCard,
    expires_at: updatedCard.expires_at || new Date(Date.now() + 30 * 86400000).toISOString(),
    plan_duration: updatedCard.plan_duration || 'monthly',
  };

  if (index >= 0) {
    cards[index] = {
      ...cards[index],
      ...finalCard,
      updated_at: new Date().toISOString(),
    };
    finalCard = cards[index];
  } else {
    finalCard = {
      ...finalCard,
      created_at: finalCard.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    cards.unshift(finalCard);
  }

  persistCards(cards);

  // Sincronización transparente con el servidor /api/cards
  if (typeof window !== 'undefined') {
    fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card: finalCard }),
    }).catch((err) => console.warn('Error sincronizando tarjeta con servidor:', err));
  }

  return finalCard;
}

export function renewCardSubscription(cardId: string, daysToAdd: number = 30): FullCard | null {
  const cards = getStoredCards();
  const index = cards.findIndex((c) => c.id === cardId || c.slug === cardId);
  if (index < 0) return null;

  const card = cards[index];
  const now = Date.now();
  const currentExpiry = card.expires_at ? new Date(card.expires_at).getTime() : now;
  const baseTime = currentExpiry > now ? currentExpiry : now;
  const newExpiry = new Date(baseTime + daysToAdd * 86400000).toISOString();

  card.expires_at = newExpiry;
  card.is_active = true;
  card.updated_at = new Date().toISOString();

  cards[index] = card;
  persistCards(cards);

  if (typeof window !== 'undefined') {
    fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card }),
    }).catch((err) => console.warn('Error renovando tarjeta en servidor:', err));
  }

  return card;
}

export function toggleCardActiveStatus(cardId: string): boolean {
  const cards = getStoredCards();
  const card = cards.find((c) => c.id === cardId);
  if (!card) return false;

  card.is_active = !card.is_active;
  persistCards(cards);

  if (typeof window !== 'undefined') {
    fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card }),
    }).catch((err) => console.warn('Error sincronizando estado activo en servidor:', err));
  }

  return card.is_active;
}

export function deleteCard(cardId: string): boolean {
  const cards = getStoredCards();
  const filtered = cards.filter((c) => c.id !== cardId);
  if (filtered.length === cards.length) return false;

  persistCards(filtered);
  return true;
}

// Verifica si la tarjeta tiene los colores y logotipo bloqueados por su empresa
export function isBrandLockedForCard(card: FullCard): {
  isLocked: boolean;
  organizationName?: string;
  brandColors?: Organization['brand_colors'];
} {
  if (!card.organization_id) return { isLocked: false };
  const org = getOrganizationById(card.organization_id);
  if (!org || !org.enforce_brand_lock) return { isLocked: false };

  return {
    isLocked: true,
    organizationName: org.name,
    brandColors: org.brand_colors,
  };
}

// ============================================================================
// 3. ANALÍTICAS Y LEADS DE WHATSAPP
// ============================================================================

export function getStoredLeads(): WhatsAppLead[] {
  if (typeof window === 'undefined') return DEMO_LEADS;
  try {
    const raw = localStorage.getItem(STORAGE_LEADS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(DEMO_LEADS));
      return DEMO_LEADS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEMO_LEADS;
  } catch {
    return DEMO_LEADS;
  }
}

export function recordWhatsAppLead(
  cardId: string,
  visitorName: string,
  subject: string,
  phoneNumber: string
): WhatsAppLead {
  const leads = getStoredLeads();
  const newLead: WhatsAppLead = {
    id: 'lead_' + Date.now(),
    card_id: cardId,
    visitor_name: visitorName,
    subject,
    phone_number: phoneNumber,
    created_at: new Date().toISOString(),
  };

  leads.unshift(newLead);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(leads));
  }

  // Registrar también evento analítico
  recordAnalyticsEvent(cardId, 'whatsapp_lead', { visitorName, subject });
  return newLead;
}

export function getLeadsByCardId(cardId: string): WhatsAppLead[] {
  const leads = getStoredLeads();
  return leads.filter((l) => l.card_id === cardId);
}

export function recordAnalyticsEvent(
  cardId: string,
  eventType: AnalyticsEventType,
  metadata?: Record<string, any>
): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_ANALYTICS_KEY);
    const events: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    events.push({
      id: 'event_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      card_id: cardId,
      event_type: eventType,
      metadata,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_ANALYTICS_KEY, JSON.stringify(events));
  } catch {}
}

export function getAnalyticsForCard(cardId: string): {
  views: number;
  vcardDownloads: number;
  linkClicks: number;
  leads: number;
} {
  const leads = getLeadsByCardId(cardId);

  let views = 142;
  let vcardDownloads = 38;
  let linkClicks = 64;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_ANALYTICS_KEY);
      if (raw) {
        const events: AnalyticsEvent[] = JSON.parse(raw);
        const cardEvents = events.filter((e) => e.card_id === cardId);
        views += cardEvents.filter((e) => e.event_type === 'view').length;
        vcardDownloads += cardEvents.filter((e) => e.event_type === 'vcard_download').length;
        linkClicks += cardEvents.filter((e) => e.event_type === 'link_click').length;
      }
    } catch {}
  }

  return {
    views,
    vcardDownloads,
    linkClicks,
    leads: leads.length,
  };
}

// ============================================================================
// 4. GESTIÓN DE USUARIOS Y MÉTRICAS GLOBALES
// ============================================================================

export function getStoredUsers(): User[] {
  if (typeof window === 'undefined') return DEMO_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEMO_USERS));
      return DEMO_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEMO_USERS;
  } catch {
    return DEMO_USERS;
  }
}

export function updateUserRole(userId: string, role: UserRole): boolean {
  const users = getStoredUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return false;

  user.role = role;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  }
  return true;
}

export function getSystemMetrics(): SystemMetrics {
  const cards = getStoredCards();
  const orgs = getStoredOrganizations();
  const users = getStoredUsers();
  const leads = getStoredLeads();

  const totalLinks = cards.reduce(
    (acc, card) => acc + (card.links ? card.links.length : 0),
    0
  );
  const totalMultimedia = cards.reduce(
    (acc, card) => acc + (card.multimedia ? card.multimedia.length : 0),
    0
  );

  return {
    totalUsers: users.length,
    totalOrganizations: orgs.length,
    totalCards: cards.length,
    activeCards: cards.filter((c) => c.is_active).length,
    totalLinks,
    totalMultimedia,
    totalViews: 1845,
    totalLeads: leads.length,
  };
}

/**
 * Guarda o actualiza un prospecto (Lead) en el CRM
 */
export function saveLead(lead: WhatsAppLead): WhatsAppLead {
  if (typeof window === 'undefined') return lead;
  try {
    const leads = getStoredLeads();
    const idx = leads.findIndex((l) => l.id === lead.id);
    const updatedLead = {
      ...lead,
      updated_at: new Date().toISOString(),
    };
    if (idx >= 0) {
      leads[idx] = updatedLead;
    } else {
      leads.unshift(updatedLead);
    }
    localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(leads));
    return updatedLead;
  } catch {
    return lead;
  }
}

/**
 * Actualiza el estado de un lead en el embudo (nuevo -> contactado -> propuesta -> ganado -> perdido)
 */
export function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
  notes?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const leads = getStoredLeads();
    const idx = leads.findIndex((l) => l.id === leadId);
    if (idx >= 0) {
      leads[idx] = {
        ...leads[idx],
        status,
        ...(notes ? { interest_notes: notes } : {}),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(leads));
    }
  } catch {}
}

/**
 * Obtiene todos los prospectos de una organización
 */
export function getLeadsByOrgId(orgId: string): WhatsAppLead[] {
  const cards = getCardsByOrganizationId(orgId);
  const cardIds = new Set(cards.map((c) => c.id));
  const allLeads = getStoredLeads();
  return allLeads.filter((l) => l.organization_id === orgId || cardIds.has(l.card_id));
}

/**
 * Obtiene todos los prospectos del sistema
 */
export function getAllLeads(): WhatsAppLead[] {
  return getStoredLeads();
}

/**
 * Alterna el estado de suscripción de una empresa (Activa / Suspendida por Falta de Pago)
 * Kill Switch para el Superadmin
 */
export function toggleOrganizationSubscription(orgId: string): Organization | null {
  if (typeof window === 'undefined') return null;
  try {
    const orgs = getStoredOrganizations();
    const idx = orgs.findIndex((o) => o.id === orgId);
    if (idx >= 0) {
      const current = orgs[idx].subscription_status || 'active';
      const updated: Organization = {
        ...orgs[idx],
        subscription_status: current === 'active' ? 'suspended' : 'active',
        updated_at: new Date().toISOString(),
      };
      orgs[idx] = updated;
      localStorage.setItem(STORAGE_ORGS_KEY, JSON.stringify(orgs));
      return updated;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Crea una nueva organización (Superadmin)
 */
export function createNewOrganization(
  data: Partial<Organization> & { name: string; slug: string }
): Organization {
  const orgs = getStoredOrganizations();
  const newOrg: Organization = {
    id: 'org_' + Date.now() + '_' + Math.random().toString(36).substring(7),
    name: data.name,
    slug: data.slug,
    logo_url: data.logo_url || null,
    brand_colors: data.brand_colors || {
      primary: '#0A2540',
      secondary: '#1E3A8A',
      accent: '#00B4D8',
      background: '#F8FAFC',
    },
    font_family: data.font_family || 'Inter',
    allowed_layouts: data.allowed_layouts || ['modern', 'banner_header', 'card_id_badge'],
    enforce_brand_lock: data.enforce_brand_lock ?? false,
    max_cards: data.max_cards || 10,
    org_type: data.org_type || 'corporate',
    subscription_status: 'active',
    webhook_url: data.webhook_url || null,
    created_at: new Date().toISOString(),
  };
  saveOrganization(newOrg);
  return newOrg;
}
