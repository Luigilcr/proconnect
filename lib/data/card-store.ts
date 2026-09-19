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

export const DEMO_CARD_SLUGS = new Set([
  'carlos-fibraconnect',
  'maria-fibraconnect',
  'andres-fibraconnect',
  'elena-rodriguez',
  'marcos-tech',
  'sofia-valenzuela',
  'carlos-mendoza',
]);

export const DEMO_USER_EMAILS = new Set([
  'admin@proconnect.app',
  'elena@nexacorp.io',
  'carlos@mendozacapital.com',
]);

export const DEMO_ORG_SLUGS = new Set([
  'nexacorp',
  'mendoza-capital',
  'studio-minimal',
  'fibraconnect',
]);

export const DEMO_ORG_IDS = new Set([
  'e0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000003',
]);

/**
 * Purga de forma irreversible cualquier dato ficticio/demo del caché local del navegador
 */
export function purgeAllDemoData(): void {
  if (typeof window === 'undefined') return;
  try {
    // 1. Limpiar tarjetas
    const rawCards = localStorage.getItem(STORAGE_CARDS_KEY);
    if (rawCards) {
      const parsedCards = JSON.parse(rawCards);
      if (Array.isArray(parsedCards)) {
        const cleanCards = parsedCards.filter(
          (c) => c && c.slug && !DEMO_CARD_SLUGS.has(c.slug.toLowerCase().trim())
        );
        localStorage.setItem(STORAGE_CARDS_KEY, JSON.stringify(cleanCards));
      }
    }

    // 2. Limpiar organizaciones
    const rawOrgs = localStorage.getItem(STORAGE_ORGS_KEY);
    if (rawOrgs) {
      const parsedOrgs = JSON.parse(rawOrgs);
      if (Array.isArray(parsedOrgs)) {
        const cleanOrgs = parsedOrgs.filter(
          (o) =>
            o &&
            !DEMO_ORG_SLUGS.has(o.slug?.toLowerCase().trim()) &&
            !DEMO_ORG_IDS.has(o.id)
        );
        localStorage.setItem(STORAGE_ORGS_KEY, JSON.stringify(cleanOrgs));
      }
    } else {
      localStorage.setItem(STORAGE_ORGS_KEY, JSON.stringify([]));
    }

    // 3. Limpiar usuarios
    const rawUsers = localStorage.getItem(STORAGE_USERS_KEY);
    if (rawUsers) {
      const parsedUsers = JSON.parse(rawUsers);
      if (Array.isArray(parsedUsers)) {
        const cleanUsers = parsedUsers.filter(
          (u) => u && !DEMO_USER_EMAILS.has(u.email?.toLowerCase().trim())
        );
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(cleanUsers));
      }
    } else {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify([]));
    }
  } catch (e) {
    console.warn('Error purgando datos demo de localStorage:', e);
  }
}

// ============================================================================
// 1. GESTIÓN DE ORGANIZACIONES (B2B)
// ============================================================================

export function getStoredOrganizations(includeDemos: boolean = false): Organization[] {
  if (typeof window === 'undefined') return includeDemos ? DEMO_ORGANIZATIONS : [];
  try {
    const raw = localStorage.getItem(STORAGE_ORGS_KEY);
    if (!raw) {
      return includeDemos ? DEMO_ORGANIZATIONS : [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      if (!includeDemos) {
        return parsed.filter(
          (o) =>
            o &&
            !DEMO_ORG_SLUGS.has(o.slug?.toLowerCase().trim()) &&
            !DEMO_ORG_IDS.has(o.id)
        );
      }
      return parsed;
    }
    return includeDemos ? DEMO_ORGANIZATIONS : [];
  } catch {
    return includeDemos ? DEMO_ORGANIZATIONS : [];
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

export function getStoredCards(includeDemos: boolean = false): FullCard[] {
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const file = path.join(process.cwd(), 'data', 'cards.json');
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '').trim();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .filter((c: FullCard) => c && c.slug && (includeDemos || !DEMO_CARD_SLUGS.has(c.slug.toLowerCase().trim())))
            .map(ensureCardExpiration);
        }
      }
    } catch {}
    return includeDemos ? DEMO_CARDS.map(ensureCardExpiration) : [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_CARDS_KEY);
    if (!raw) {
      return includeDemos ? DEMO_CARDS.map(ensureCardExpiration) : [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
        .filter((c: FullCard) => c && c.slug && (includeDemos || !DEMO_CARD_SLUGS.has(c.slug.toLowerCase().trim())))
        .map(ensureCardExpiration);
    }
    return includeDemos ? DEMO_CARDS.map(ensureCardExpiration) : [];
  } catch {
    return includeDemos ? DEMO_CARDS.map(ensureCardExpiration) : [];
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

  let views = 0;
  let vcardDownloads = 0;
  let linkClicks = 0;

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

export function getStoredUsers(includeDemos: boolean = false): User[] {
  if (typeof window === 'undefined') return includeDemos ? DEMO_USERS : [];
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      return includeDemos ? DEMO_USERS : [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.filter(
        (u: User) => u && (includeDemos || !DEMO_USER_EMAILS.has(u.email?.toLowerCase().trim()))
      );
    }
    return includeDemos ? DEMO_USERS : [];
  } catch {
    return includeDemos ? DEMO_USERS : [];
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

  let totalViews = 0;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_ANALYTICS_KEY);
      if (raw) {
        const events: AnalyticsEvent[] = JSON.parse(raw);
        totalViews = events.filter((e) => e.event_type === 'view').length;
      }
    } catch {}
  }

  return {
    totalUsers: users.length,
    totalOrganizations: orgs.length,
    totalCards: cards.length,
    activeCards: cards.filter((c) => c.is_active).length,
    totalLinks,
    totalMultimedia,
    totalViews,
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

/**
 * Elimina una organización del almacén local
 */
export function deleteStoredOrganization(orgId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const orgs = getStoredOrganizations();
    const filtered = orgs.filter((o) => o.id !== orgId && o.slug !== orgId);
    if (filtered.length !== orgs.length) {
      localStorage.setItem(STORAGE_ORGS_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Elimina un lead (Exclusivo para Administrador de Empresa o Superadmin)
 */
export function deleteLead(leadId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const leads = getStoredLeads();
    const filtered = leads.filter((l) => l.id !== leadId);
    if (filtered.length !== leads.length) {
      localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Registra una nota de seguimiento o bitácora en un lead
 */
export function addLeadActivityNote(
  leadId: string,
  authorName: string,
  authorRole: string,
  text: string
): WhatsAppLead | null {
  if (typeof window === 'undefined' || !text.trim()) return null;
  try {
    const leads = getStoredLeads();
    const idx = leads.findIndex((l) => l.id === leadId);
    if (idx < 0) return null;

    const lead = leads[idx];
    const newNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      author_name: authorName,
      author_role: authorRole,
      text: text.trim(),
      created_at: new Date().toISOString(),
    };

    const notes = Array.isArray(lead.activity_notes) ? [...lead.activity_notes] : [];
    notes.unshift(newNote);

    lead.activity_notes = notes;
    lead.updated_at = new Date().toISOString();
    leads[idx] = lead;
    localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(leads));
    return lead;
  } catch {
    return null;
  }
}
