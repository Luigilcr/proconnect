/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * ALMACÉN Y GESTOR DE CUPONES DE DESCUENTO Y PAGOS B2B
 */

import { DiscountCoupon, OrganizationPayment } from '../types';

const STORAGE_COUPONS_KEY = 'proconnect_discount_coupons_v1';
const STORAGE_PAYMENTS_KEY = 'proconnect_org_payments_v1';

// Cupones iniciales preconfigurados
const DEFAULT_COUPONS: DiscountCoupon[] = [
  {
    id: 'coup_launch_50',
    code: 'PROMO50',
    discount_type: 'percentage',
    discount_value: 50,
    applicable_plan: 'all',
    max_uses: 100,
    times_used: 0,
    expires_at: null,
    is_active: true,
    created_at: new Date().toISOString(),
    notes: 'Cupón de lanzamiento 50% de descuento',
  },
  {
    id: 'coup_b2b_20',
    code: 'EMPRESAS20',
    discount_type: 'percentage',
    discount_value: 20,
    applicable_plan: 'all',
    max_uses: 50,
    times_used: 0,
    expires_at: null,
    is_active: true,
    created_at: new Date().toISOString(),
    notes: 'Descuento especial 20% para empresas',
  },
  {
    id: 'coup_admin_luigi',
    code: 'LUIGI100',
    discount_type: 'percentage',
    discount_value: 100,
    applicable_plan: 'all',
    max_uses: null,
    times_used: 0,
    expires_at: null,
    is_active: true,
    created_at: new Date().toISOString(),
    notes: 'Cupón VIP de Cortesía 100% de descuento',
  },
];

export function getStoredCoupons(): DiscountCoupon[] {
  if (typeof window === 'undefined') return DEFAULT_COUPONS;
  try {
    const raw = localStorage.getItem(STORAGE_COUPONS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_COUPONS_KEY, JSON.stringify(DEFAULT_COUPONS));
      return DEFAULT_COUPONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_COUPONS;
  } catch {
    return DEFAULT_COUPONS;
  }
}

export function saveCoupon(coupon: DiscountCoupon): DiscountCoupon {
  const coupons = getStoredCoupons();
  const normalizedCode = coupon.code.toUpperCase().trim();
  const existingIdx = coupons.findIndex((c) => c.id === coupon.id || c.code.toUpperCase() === normalizedCode);

  const updatedCoupon: DiscountCoupon = {
    ...coupon,
    code: normalizedCode,
  };

  if (existingIdx >= 0) {
    coupons[existingIdx] = updatedCoupon;
  } else {
    coupons.unshift(updatedCoupon);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_COUPONS_KEY, JSON.stringify(coupons));
    } catch (e) {
      console.warn('Error saving coupon to localStorage:', e);
    }
  }

  return updatedCoupon;
}

export function deleteCoupon(id: string): boolean {
  const coupons = getStoredCoupons();
  const filtered = coupons.filter((c) => c.id !== id);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_COUPONS_KEY, JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function validateCoupon(
  code: string,
  planId: string,
  subtotal: number
): {
  valid: boolean;
  discountAmount: number;
  finalPrice: number;
  coupon?: DiscountCoupon;
  message: string;
} {
  if (!code || !code.trim()) {
    return { valid: false, discountAmount: 0, finalPrice: subtotal, message: 'Ingresa un código de cupón.' };
  }

  const normalized = code.toUpperCase().trim();
  const coupons = getStoredCoupons();
  const found = coupons.find((c) => c.code.toUpperCase() === normalized);

  if (!found) {
    return { valid: false, discountAmount: 0, finalPrice: subtotal, message: 'El cupón ingresado no existe.' };
  }

  if (!found.is_active) {
    return { valid: false, discountAmount: 0, finalPrice: subtotal, message: 'Este cupón está desactivado.' };
  }

  if (found.expires_at) {
    const expiry = new Date(found.expires_at).getTime();
    if (Date.now() > expiry) {
      return { valid: false, discountAmount: 0, finalPrice: subtotal, message: 'Este cupón ha caducado.' };
    }
  }

  if (found.max_uses !== null && found.times_used >= found.max_uses) {
    return { valid: false, discountAmount: 0, finalPrice: subtotal, message: 'Este cupón ha alcanzado su límite de usos.' };
  }

  if (found.applicable_plan !== 'all' && found.applicable_plan !== planId) {
    return {
      valid: false,
      discountAmount: 0,
      finalPrice: subtotal,
      message: `Este cupón solo es válido para el ${found.applicable_plan.toUpperCase()}.`,
    };
  }

  let discount = 0;
  if (found.discount_type === 'percentage') {
    discount = (subtotal * found.discount_value) / 100;
  } else {
    discount = found.discount_value;
  }

  discount = Math.min(discount, subtotal);
  const finalPrice = Math.max(0, subtotal - discount);

  return {
    valid: true,
    discountAmount: Math.round(discount * 100) / 100,
    finalPrice: Math.round(finalPrice * 100) / 100,
    coupon: found,
    message: `¡Cupón ${found.code} aplicado! Descuento de ${
      found.discount_type === 'percentage' ? `${found.discount_value}%` : `$${found.discount_value} USD`
    }.`,
  };
}

export function recordCouponUsage(code: string): void {
  const coupons = getStoredCoupons();
  const normalized = code.toUpperCase().trim();
  const found = coupons.find((c) => c.code.toUpperCase() === normalized);
  if (found) {
    found.times_used = (found.times_used || 0) + 1;
    saveCoupon(found);
  }
}

// ──────────────────────────────────────────
// REGISTRO DE PAGOS B2B
// ──────────────────────────────────────────

export function getStoredPayments(): OrganizationPayment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_PAYMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOrganizationPayment(payment: OrganizationPayment): OrganizationPayment {
  const payments = getStoredPayments();
  const existingIdx = payments.findIndex((p) => p.id === payment.id);

  if (existingIdx >= 0) {
    payments[existingIdx] = payment;
  } else {
    payments.unshift(payment);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify(payments));
    } catch (e) {
      console.warn('Error saving payment to localStorage:', e);
    }
  }

  return payment;
}

export function updatePaymentStatus(
  id: string,
  status: 'pending' | 'verified' | 'rejected'
): boolean {
  const payments = getStoredPayments();
  const found = payments.find((p) => p.id === id);
  if (found) {
    found.status = status;
    saveOrganizationPayment(found);
    return true;
  }
  return false;
}
