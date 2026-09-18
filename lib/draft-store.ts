/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * ALMACÉN DE PERSISTENCIA TEMPORAL (AUTO-SAVE) PARA BORRADORES DE TARJETA
 */

import { FullCard } from './types';

const DRAFT_STORAGE_KEY = 'proconnect_card_draft_v1';

export interface DraftData {
  card: Partial<FullCard>;
  meta?: {
    phoneNumber?: string;
    email?: string;
    website?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
    selectedTemplateId?: string;
    step?: number;
    [key: string]: any;
  };
  savedAt: string;
}

/**
 * Guarda en tiempo real el borrador de la tarjeta en localStorage
 */
export function saveCardDraft(card: Partial<FullCard>, meta?: DraftData['meta']): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: DraftData = {
      card,
      meta,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[DraftStore] Error al guardar borrador temporal:', err);
  }
}

/**
 * Carga el borrador existente si está disponible
 */
export function loadCardDraft(): DraftData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.card) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Limpia el borrador temporal tras publicar exitosamente o al descartar
 */
export function clearCardDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (err) {
    console.warn('[DraftStore] Error al limpiar borrador temporal:', err);
  }
}

/**
 * Comprueba si existe un borrador guardado
 */
export function hasCardDraft(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!localStorage.getItem(DRAFT_STORAGE_KEY);
  } catch {
    return false;
  }
}

const DASHBOARD_DRAFT_PREFIX = 'proconnect_dashboard_draft_';

/**
 * Guarda borrador en tiempo real para el editor del dashboard
 */
export function saveDashboardDraft(cardId: string, card: FullCard): void {
  if (typeof window === 'undefined' || !cardId) return;
  try {
    localStorage.setItem(
      `${DASHBOARD_DRAFT_PREFIX}${cardId}`,
      JSON.stringify({ card, savedAt: new Date().toISOString() })
    );
  } catch (e) {
    console.warn('[DraftStore] Error guardando borrador de dashboard:', e);
  }
}

/**
 * Carga borrador de dashboard para una tarjeta
 */
export function loadDashboardDraft(cardId: string): { card: FullCard; savedAt: string } | null {
  if (typeof window === 'undefined' || !cardId) return null;
  try {
    const raw = localStorage.getItem(`${DASHBOARD_DRAFT_PREFIX}${cardId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Limpia borrador de dashboard tras guardar permanentemente
 */
export function clearDashboardDraft(cardId: string): void {
  if (typeof window === 'undefined' || !cardId) return;
  try {
    localStorage.removeItem(`${DASHBOARD_DRAFT_PREFIX}${cardId}`);
  } catch (e) {
    console.warn('[DraftStore] Error limpiando borrador de dashboard:', e);
  }
}

