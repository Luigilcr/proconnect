/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * MOTOR DE CICLO DE VIDA, VENCIMIENTO Y ALERTAS DE TARJETAS
 */

import { Card } from './types';

export interface CardExpirationInfo {
  status: 'active' | 'expiring_soon' | 'expired' | 'lifetime';
  daysRemaining: number;
  formattedCreated: string;
  formattedExpires: string;
  badgeLabel: string;
  badgeColor: 'emerald' | 'amber' | 'red' | 'slate';
  isExpiringSoon: boolean;
  isExpired: boolean;
  alertMessage?: string;
}

/**
 * Calcula el estado de vencimiento y alertas de una tarjeta digital.
 * Alerta cuando faltan 7 días o menos para el vencimiento de su mes/año.
 */
export function getCardExpirationInfo(
  card: Pick<Card, 'created_at' | 'expires_at' | 'is_active'>,
  warningDaysThreshold: number = 5
): CardExpirationInfo {
  const createdDate = card.created_at ? new Date(card.created_at) : new Date();

  // Si no tiene fecha de vencimiento definida, calculamos 30 días desde su creación
  let expiresDate: Date;
  if (card.expires_at) {
    expiresDate = new Date(card.expires_at);
  } else {
    expiresDate = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  const now = new Date();
  const diffMs = expiresDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };

  const formattedCreated = createdDate.toLocaleDateString('es-ES', options);
  const formattedExpires = expiresDate.toLocaleDateString('es-ES', options);

  if (daysRemaining < 0) {
    const expiredDaysAgo = Math.abs(daysRemaining);
    return {
      status: 'expired',
      daysRemaining,
      formattedCreated,
      formattedExpires,
      badgeLabel: expiredDaysAgo === 1 ? 'Expiró ayer' : `Vencida (${expiredDaysAgo}d)`,
      badgeColor: 'red',
      isExpiringSoon: false,
      isExpired: true,
      alertMessage: `La tarjeta ha vencido hace ${expiredDaysAgo} días. Su enlace y chip NFC requieren renovación.`,
    };
  }

  if (daysRemaining <= warningDaysThreshold) {
    const label =
      daysRemaining === 0
        ? '¡Vence hoy!'
        : daysRemaining === 1
        ? '¡Vence mañana!'
        : `Vence en ${daysRemaining} días`;

    return {
      status: 'expiring_soon',
      daysRemaining,
      formattedCreated,
      formattedExpires,
      badgeLabel: label,
      badgeColor: 'amber',
      isExpiringSoon: true,
      isExpired: false,
      alertMessage: `Atención: Quedan ${daysRemaining} días para culminar el periodo mensual. Alerta preventiva para cobro/renovación.`,
    };
  }

  return {
    status: 'active',
    daysRemaining,
    formattedCreated,
    formattedExpires,
    badgeLabel: `${daysRemaining} días restantes`,
    badgeColor: 'emerald',
    isExpiringSoon: false,
    isExpired: false,
  };
}
