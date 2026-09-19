'use client';
// © ProConnect. Todos los derechos reservados.
// Queda prohibida la reproducción, copia o ingeniería inversa de este software.
//
// VISTA COMENSAL — Kiosco de Autoservicio Interactivo ProConnect Gastro
// Experiencia táctil tipo Kiosco Farmatodo / KFC para el smartphone del comensal.
// Ruta: /r/[slug]?mesa=3

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShoppingCart, Plus, Minus, X, BellRing, Receipt,
  ChevronRight, CheckCircle2, Upload, Loader2, Star,
  Search, Copy, Check, Sparkles, User, Clock,
  Flame, Utensils, AlertCircle, CreditCard, DollarSign
} from 'lucide-react';
import {
  getMenuCategories, getMenuItemsByCategory, getRestaurantTables,
  createOrder, callWaiterWithReason, requestBillWithTip,
  submitPaymentWithReceipt, getPaymentInfo, getOrdersByTable,
} from '@/lib/data/restaurant-store';
import { getOrganizationBySlug } from '@/lib/data/card-store';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { BRASA_CRIOLLA_ORG_ID } from '@/lib/data/demo-data';
import { compressImage } from '@/lib/image-compressor';
import {
  MenuCategory, MenuItem, OrderItem, TableOrder,
  RestaurantTable, RestaurantPaymentInfo,
} from '@/lib/types';

interface CartItem extends MenuItem {
  qty: number;
  notes: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE PERSONALIZACIÓN DEL PLATO (ESTILO KIOSCO KFC / FARMATODO)
// ─────────────────────────────────────────────────────────────────────────────
function DishCustomizationModal({
  item,
  onAddToCart,
  onClose,
}: {
  item: MenuItem;
  onAddToCart: (item: MenuItem, qty: number, notes: string) => void;
  onClose: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const quickNotes = [
    'Sin cebolla',
    'Término medio',
    'Salsa aparte',
    'Poco picante',
    'Bien dorado / cocido',
    'Para llevar',
  ];

  const toggleQuickNote = (note: string) => {
    if (notes.includes(note)) {
      setNotes(notes.replace(note, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim());
    } else {
      setNotes(notes ? `${notes}, ${note}` : note);
    }
  };

  const totalPrice = item.price * qty;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover / Imagen */}
        {item.image_url && (
          <div className="relative h-56 w-full bg-slate-900 shrink-0">
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            {item.badge && (
              <span className="absolute bottom-4 left-4 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500 text-white shadow-lg">
                <Flame className="w-3.5 h-3.5" />
                {item.badge.replace('_', ' ')}
              </span>
            )}
          </div>
        )}

        {/* Encabezado info si no tiene foto */}
        {!item.image_url && (
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">{item.name}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Contenido */}
        <div className="p-5 space-y-5 flex-1">
          {item.image_url && (
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{item.name}</h3>
                <span className="text-xl font-black text-amber-600">${item.price.toFixed(2)}</span>
              </div>
              {item.description && (
                <p className="text-xs text-slate-600 leading-relaxed mt-1.5">{item.description}</p>
              )}
            </div>
          )}

          {/* Instrucciones para la Cocina */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-500" />
              <span>Instrucciones Especiales para Cocina</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickNotes.map((qn) => {
                const active = notes.includes(qn);
                return (
                  <button
                    key={qn}
                    type="button"
                    onClick={() => toggleQuickNote(qn)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      active
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {qn}
                  </button>
                );
              })}
            </div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribe notas adicionales (ej. carne sin sal, jugo con hielo aparte)..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none bg-slate-50"
            />
          </div>

          {/* Cantidad y Botón de Añadir */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-9 h-9 rounded-xl bg-white text-slate-700 font-black shadow-sm flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-black text-base text-slate-900 w-6 text-center">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                className="w-9 h-9 rounded-xl bg-amber-500 text-white font-black shadow-sm flex items-center justify-center hover:bg-amber-400 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onAddToCart(item, qty, notes);
                onClose();
              }}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 flex items-center justify-between transition-all active:scale-[0.98]"
            >
              <span>Agregar al Pedido</span>
              <span>${totalPrice.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL LLAMAR AL MESERO (CON MOTIVO SELECCIONABLE)
// ─────────────────────────────────────────────────────────────────────────────
function CallWaiterModal({
  orderId,
  waiterName,
  onCall,
  onClose,
}: {
  orderId: string;
  waiterName?: string | null;
  onCall: (reason: string) => void;
  onClose: () => void;
}) {
  const reasons = [
    { id: 'cubiertos', label: 'Servilletas o Cubiertos', emoji: '🍴' },
    { id: 'bebida', label: 'Hielo o Bebida Adicional', emoji: '🧊' },
    { id: 'menu', label: 'Consulta sobre el Menú', emoji: '❓' },
    { id: 'cuenta', label: 'Cuenta en Efectivo / Terminal', emoji: '🧾' },
    { id: 'urgente', label: 'Atención Prioritaria', emoji: '🚨' },
  ];

  const [selectedReason, setSelectedReason] = useState(reasons[0].label);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Llamar a Mesero</h3>
              <p className="text-[11px] text-slate-500">
                {waiterName ? `Atiende tu mesa: ${waiterName}` : 'Personal de servicio en sala'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 font-semibold">¿Qué necesitas en tu mesa?</p>

        <div className="space-y-2">
          {reasons.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedReason(r.label)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-xs font-bold text-left transition-all ${
                selectedReason === r.label
                  ? 'border-amber-500 bg-amber-50/70 text-amber-900 shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-lg">{r.emoji}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            onCall(selectedReason);
            onClose();
          }}
          className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <BellRing className="w-4 h-4" />
          <span>Enviar Solicitud a Mesero</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL VER FACTURA & CALCULAR PROPINA
// ─────────────────────────────────────────────────────────────────────────────
function BillBreakdownModal({
  order,
  onProceedToPayment,
  onClose,
}: {
  order: TableOrder;
  onProceedToPayment: (tipAmount: number) => void;
  onClose: () => void;
}) {
  const [tipPercentage, setTipPercentage] = useState<number>(10);
  const subtotal = order.total;
  const tipAmount = (subtotal * tipPercentage) / 100;
  const grandTotal = subtotal + tipAmount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Cuenta • {order.table_name}</h3>
              <p className="text-[11px] text-slate-500">Comprobante de consumo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desglose de Platos */}
        <div className="bg-slate-50 rounded-2xl p-4 divide-y divide-slate-200/60 max-h-52 overflow-y-auto text-xs">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-2 first:pt-0 last:pb-0 flex justify-between items-start gap-2">
              <div>
                <span className="font-bold text-slate-900">
                  {item.qty}x {item.name}
                </span>
                {item.notes && (
                  <p className="text-[10px] text-amber-700 italic">Nota: {item.notes}</p>
                )}
              </div>
              <span className="font-bold text-slate-800 shrink-0">
                ${item.subtotal.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Selector de Propina */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Propina para el equipo de sala</span>
            <span className="text-emerald-600 font-black">+${tipAmount.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setTipPercentage(pct)}
                className={`py-2 rounded-xl text-xs font-black transition-all ${
                  tipPercentage === pct
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {pct === 0 ? 'Sin propina' : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Resumen Total */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl p-4 space-y-1.5 shadow-md">
          <div className="flex justify-between text-xs opacity-90">
            <span>Subtotal consumo</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs opacity-90">
            <span>Propina ({tipPercentage}%)</span>
            <span>${tipAmount.toFixed(2)}</span>
          </div>
          <div className="border-t border-white/20 pt-2 flex justify-between font-black text-lg">
            <span>TOTAL A PAGAR</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={() => {
            onProceedToPayment(tipAmount);
            onClose();
          }}
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <CreditCard className="w-5 h-5" />
          <span>Proceder al Pago Móvil / Zelle / Efectivo</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE PAGO (KIOSCO MULTI-MÉTODO CON 1-CLICK CLIPBOARD & COMPRESIÓN)
// ─────────────────────────────────────────────────────────────────────────────
function PaymentModal({
  order,
  tipAmount,
  paymentInfo,
  onPay,
  onClose,
}: {
  order: TableOrder;
  tipAmount: number;
  paymentInfo: RestaurantPaymentInfo | null;
  onPay: (method: string, reference: string, receipt: string | null) => void;
  onClose: () => void;
}) {
  const [method, setMethod] = useState('pago_movil');
  const [reference, setReference] = useState('');
  const [receiptB64, setReceiptB64] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalWithTip = (order.total || 0) + (tipAmount || 0);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
      const reader = new FileReader();
      reader.onload = (ev) => {
        setReceiptB64(ev.target?.result as string);
        setIsCompressing(false);
      };
      reader.readAsDataURL(compressed);
    } catch {
      setIsCompressing(false);
    }
  };

  const methods = [
    { id: 'pago_movil', label: 'Pago Móvil', emoji: '📱' },
    { id: 'zelle', label: 'Zelle', emoji: '💵' },
    { id: 'transferencia', label: 'Transferencia', emoji: '🏦' },
    { id: 'efectivo', label: 'Efectivo en Mesa', emoji: '💴' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white rounded-t-3xl px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between z-10">
          <div>
            <h3 className="font-black text-slate-900 text-base">
              Pagar Kiosco — ${totalWithTip.toFixed(2)}
            </h3>
            <p className="text-[11px] text-slate-500">Mesa {order.table_number}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 flex-1">
          {/* Métodos */}
          <div className="grid grid-cols-2 gap-2">
            {methods.map((pm) => (
              <button
                key={pm.id}
                onClick={() => setMethod(pm.id)}
                className={`flex items-center gap-2 p-3 rounded-2xl border-2 text-xs font-bold transition-all ${
                  method === pm.id
                    ? 'border-amber-500 bg-amber-50/80 text-amber-900 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-xl">{pm.emoji}</span>
                <span>{pm.label}</span>
              </button>
            ))}
          </div>

          {/* Datos Bancarios con 1-Click Copy */}
          {paymentInfo && method === 'pago_movil' && (
            <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Teléfono:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(paymentInfo.pago_movil_phone || '', 'phone')}
                  className="font-mono font-bold text-slate-900 flex items-center gap-1 hover:text-amber-600"
                >
                  <span>{paymentInfo.pago_movil_phone}</span>
                  {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Cédula:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(paymentInfo.pago_movil_cedula || '', 'cedula')}
                  className="font-mono font-bold text-slate-900 flex items-center gap-1 hover:text-amber-600"
                >
                  <span>{paymentInfo.pago_movil_cedula}</span>
                  {copiedField === 'cedula' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Banco:</span>
                <span className="font-bold text-slate-900">{paymentInfo.pago_movil_bank}</span>
              </div>
            </div>
          )}

          {paymentInfo && method === 'zelle' && (
            <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Email Zelle:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(paymentInfo.zelle_email || '', 'zelle')}
                  className="font-mono font-bold text-slate-900 flex items-center gap-1 hover:text-amber-600 truncate max-w-[200px]"
                >
                  <span className="truncate">{paymentInfo.zelle_email}</span>
                  {copiedField === 'zelle' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Titular:</span>
                <span className="font-bold text-slate-900">{paymentInfo.zelle_name}</span>
              </div>
            </div>
          )}

          {paymentInfo && method === 'transferencia' && (
            <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Banco:</span>
                <span className="font-bold text-slate-900">{paymentInfo.bank_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Cuenta:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(paymentInfo.bank_account || '', 'cuenta')}
                  className="font-mono font-bold text-slate-900 flex items-center gap-1 hover:text-amber-600 truncate max-w-[200px]"
                >
                  <span className="truncate">{paymentInfo.bank_account}</span>
                  {copiedField === 'cuenta' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Titular:</span>
                <span className="font-bold text-slate-900">{paymentInfo.bank_holder}</span>
              </div>
            </div>
          )}

          {method === 'efectivo' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
              <p className="font-bold">Pago directo en mesa</p>
              <p className="text-[11px] text-amber-800">
                Tu mesero se acercará con la cuenta y el cambio correspondiente. Monto exacto: <strong>${totalWithTip.toFixed(2)}</strong>
              </p>
            </div>
          )}

          {method !== 'efectivo' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Referencia / Comprobante *
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Últimos 4 o 6 dígitos de la transferencia"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Captura de Pago (Opcional, acelera la verificación)
                </label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={isCompressing}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed text-xs font-bold transition-all ${
                    receiptB64
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {isCompressing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Optimizando captura...</span></>
                  ) : receiptB64 ? (
                    <><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span>Comprobante Adjunto ✓</span></>
                  ) : (
                    <><Upload className="w-4 h-4 text-slate-400" /><span>Subir Captura de Pantalla</span></>
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </div>
            </div>
          )}

          <button
            onClick={() => onPay(method, reference, receiptB64)}
            disabled={(method !== 'efectivo' && !reference.trim()) || isCompressing}
            className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Enviar a Caja para Validación</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL INTERACTIVA DEL KIOSCO
// ─────────────────────────────────────────────────────────────────────────────
function RestaurantMenuPageInner({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams();
  const tableNumber = parseInt(searchParams.get('mesa') || '1', 10);
  const [orgId, setOrgId] = useState<string>(BRASA_CRIOLLA_ORG_ID);

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, MenuItem[]>>({});
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [currentOrder, setCurrentOrder] = useState<TableOrder | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<RestaurantPaymentInfo | null>(null);

  // Modales
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [showCallWaiterModal, setShowCallWaiterModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);

  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const showToast = useCallback((msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Resolver ID de organización dinámicamente por slug
  useEffect(() => {
    async function resolveOrg() {
      const slug = params.slug?.toLowerCase().trim();
      if (!slug) return;

      if (isSupabaseEnabled && supabase) {
        try {
          const { data: org, error } = await supabase
            .from('organizations')
            .select('id')
            .ilike('slug', slug)
            .maybeSingle();

          if (!error && org?.id) {
            setOrgId(org.id);
            return;
          }
        } catch (err) {
          console.warn('Error resolving org from Supabase:', err);
        }
      }

      const localOrg = getOrganizationBySlug(slug);
      if (localOrg?.id) {
        setOrgId(localOrg.id);
      } else {
        setOrgId(BRASA_CRIOLLA_ORG_ID);
      }
    }

    resolveOrg();
  }, [params.slug]);

  const loadData = useCallback(() => {
    const cats = getMenuCategories(orgId);
    setCategories(cats);
    if (cats.length > 0 && !activeCategory) setActiveCategory(cats[0].id);

    const byCategory: Record<string, MenuItem[]> = {};
    cats.forEach((c) => {
      byCategory[c.id] = getMenuItemsByCategory(c.id);
    });
    setItemsByCategory(byCategory);

    const tables = getRestaurantTables(orgId);
    const found = tables.find((t) => t.table_number === tableNumber) || tables[0];
    setTable(found || null);
    setPaymentInfo(getPaymentInfo(orgId));

    if (found) {
      const existing = getOrdersByTable(found.id);
      if (existing.length > 0) {
        setCurrentOrder(existing[0]);
        setOrderPlaced(true);
      }
    }
  }, [orgId, tableNumber, activeCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling ligero para actualizar estado de la comanda
  useEffect(() => {
    const timer = setInterval(() => {
      if (table) {
        const existing = getOrdersByTable(table.id);
        if (existing.length > 0) {
          setCurrentOrder(existing[0]);
          setOrderPlaced(true);
        }
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [table]);

  const handleAddToCartWithNotes = (item: MenuItem, qty: number, notes: string) => {
    setCart((prev) => {
      const exIdx = prev.findIndex((c) => c.id === item.id && c.notes === notes);
      if (exIdx >= 0) {
        const copy = [...prev];
        copy[exIdx].qty += qty;
        return copy;
      }
      return [...prev, { ...item, qty, notes }];
    });
    showToast(`${item.name} agregado a tu comanda ✓`, 'info');
  };

  const removeFromCart = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCartQty = (idx: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const newQty = copy[idx].qty + delta;
      if (newQty <= 0) return prev.filter((_, i) => i !== idx);
      copy[idx].qty = newQty;
      return copy;
    });
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const handlePlaceOrder = async () => {
    if (!table || cart.length === 0) return;
    setIsOrdering(true);
    await new Promise((r) => setTimeout(r, 600));
    const items: OrderItem[] = cart.map((c) => ({
      menu_item_id: c.id,
      name: c.name,
      qty: c.qty,
      unit_price: c.price,
      subtotal: c.price * c.qty,
      notes: c.notes || null,
    }));
    const order = createOrder(orgId, table, items);
    setCurrentOrder(order);
    setOrderPlaced(true);
    setShowCart(false);
    setCart([]);
    setIsOrdering(false);
    showToast('¡Tu orden está en cocina! 👨‍🍳🔥');
  };

  const handleCallWaiterWithReason = (reason: string) => {
    if (!currentOrder) return;
    callWaiterWithReason(currentOrder.id, reason);
    showToast(`Mesero avisado: "${reason}" 🔔`, 'info');
  };

  const handleProceedToPayment = (tipAmount: number) => {
    if (!currentOrder) return;
    setCurrentTip(tipAmount);
    requestBillWithTip(currentOrder.id, tipAmount);
    setShowPaymentModal(true);
  };

  const handlePay = (method: string, reference: string, receipt: string | null) => {
    if (!currentOrder) return;
    submitPaymentWithReceipt(currentOrder.id, method, reference, receipt);
    setShowPaymentModal(false);
    showToast('¡Comprobante enviado a caja para validación! 🙏');
  };

  // Filtrado de platos con búsqueda
  const allItems = Object.values(itemsByCategory).flat();
  const filteredItems = searchQuery.trim()
    ? allItems.filter(
        (it) =>
          it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (it.description && it.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-500 selection:text-white">
      {/* ── KIOSK HEADER ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-amber-100 shrink-0 border border-amber-200 shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=200"
                alt="Brasa Criolla"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-slate-900 text-sm truncate">Brasa Criolla</h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                  {table ? table.name : `Mesa ${tableNumber}`}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                <User className="w-3 h-3 text-amber-500" />
                <span>{table?.assigned_waiter ? `Atiende: ${table.assigned_waiter}` : 'Kiosco Táctil en Mesa'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500 text-white font-black text-xs shadow-md shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition-all shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Comanda</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-black flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Buscador Rápido de Platos */}
        <div className="max-w-xl mx-auto px-4 pb-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar parrillas, combos, hamburguesas, cócteles..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs focus:bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Toast Notificaciones */}
      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-black text-white flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── BANNER DESTACADO / COMBOS DEL DÍA (ESTILO FARMATODO / KFC) ── */}
      <div className="max-w-xl w-full mx-auto px-4 pt-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500 text-white p-5 shadow-lg">
          <div className="relative z-10 max-w-[70%]">
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full inline-block mb-2">
              🔥 Combo Especial Kiosco
            </span>
            <h2 className="text-lg font-black leading-tight">Parrilla Mixta Familiar (4 personas)</h2>
            <p className="text-xs text-amber-100 mt-1">Incluye carne, pollo, chorizo, yuca frita y 4 bebidas.</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xl font-black">$38.00</span>
              <button
                onClick={() => {
                  const combo = allItems.find((i) => i.name.toLowerCase().includes('parrilla')) || allItems[0];
                  if (combo) setCustomizingItem(combo);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white text-amber-700 text-xs font-black hover:bg-amber-50 shadow-md active:scale-95 transition-all"
              >
                Pedir Combo →
              </button>
            </div>
          </div>
          <img
            src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=350"
            alt="Parrilla"
            className="absolute -right-4 -bottom-6 w-36 h-36 object-cover rounded-full shadow-2xl border-4 border-white/20"
          />
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL / MENÚ ── */}
      <main className="flex-1 max-w-xl w-full mx-auto pb-40">
        {/* Selector Sticky de Categorías (solo si no hay búsqueda activa) */}
        {!searchQuery && (
          <div className="sticky top-[108px] z-20 bg-white/95 backdrop-blur-md border-b border-slate-100 py-2.5 px-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all ${
                    activeCategory === cat.id
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-102'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Listado de Platos */}
        <div className="px-4 py-4 space-y-4">
          {searchQuery ? (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-3">
                Resultados para &quot;{searchQuery}&quot; ({filteredItems?.length || 0})
              </p>
              <div className="space-y-3">
                {filteredItems?.map((item) => (
                  <DishCard
                    key={item.id}
                    item={item}
                    onCustomize={() => setCustomizingItem(item)}
                  />
                ))}
              </div>
            </div>
          ) : (
            categories
              .filter((c) => c.id === activeCategory)
              .map((cat) => (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-black text-slate-900 text-base flex items-center gap-2">
                      <span className="text-lg">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </h2>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {(itemsByCategory[cat.id] || []).length} opciones
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(itemsByCategory[cat.id] || []).map((item) => (
                      <DishCard
                        key={item.id}
                        item={item}
                        onCustomize={() => setCustomizingItem(item)}
                      />
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      </main>

      {/* ── BARRA FLOTANTE DE COMANDAS & SEGUIMIENTO (DOCK KIOSCO) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 p-3 shadow-2xl">
        <div className="max-w-xl mx-auto space-y-2">
          {/* Tracking de Estado si la comanda está activa */}
          {orderPlaced && currentOrder && (
            <div className="p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 animate-spin">
                  ⏳
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-amber-400">
                      {currentOrder.status === 'pending'
                        ? 'Enviado a Cocina'
                        : currentOrder.status === 'preparing'
                        ? 'En Preparación'
                        : currentOrder.status === 'ready'
                        ? 'Listo para Servir'
                        : currentOrder.status === 'delivered'
                        ? 'Servido en Mesa'
                        : 'Comanda Finalizada'}
                    </span>
                    <span className="text-[10px] text-slate-400">• Total: ${currentOrder.total.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 truncate">
                    {currentOrder.payment_data?.status === 'pending_approval'
                      ? 'Pago en revisión de caja...'
                      : 'Puedes pedir la cuenta o llamar mesero cuando gustes'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCallWaiterModal(true)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1 transition-all"
                  title="Llamar mesero"
                >
                  <BellRing className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowBillModal(true)}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 shadow-md transition-all active:scale-95"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Cuenta</span>
                </button>
              </div>
            </div>
          )}

          {/* Si hay items en carrito (Comanda por Enviar) */}
          {cartCount > 0 && (
            <button
              type="button"
              onClick={() => setShowCart(true)}
              className="w-full py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-between transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span>Ver Comanda ({cartCount} platos)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">${cartTotal.toFixed(2)}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* ── MODALES INTERACTIVOS ── */}
      {customizingItem && (
        <DishCustomizationModal
          item={customizingItem}
          onAddToCart={handleAddToCartWithNotes}
          onClose={() => setCustomizingItem(null)}
        />
      )}

      {showCallWaiterModal && currentOrder && (
        <CallWaiterModal
          orderId={currentOrder.id}
          waiterName={table?.assigned_waiter}
          onCall={handleCallWaiterWithReason}
          onClose={() => setShowCallWaiterModal(false)}
        />
      )}

      {showBillModal && currentOrder && (
        <BillBreakdownModal
          order={currentOrder}
          onProceedToPayment={handleProceedToPayment}
          onClose={() => setShowBillModal(false)}
        />
      )}

      {showPaymentModal && currentOrder && (
        <PaymentModal
          order={currentOrder}
          tipAmount={currentTip}
          paymentInfo={paymentInfo}
          onPay={handlePay}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* Modal Carrito / Comanda antes de enviar a cocina */}
      {showCart && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowCart(false)}
        >
          <div
            className="w-full sm:max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white rounded-t-3xl px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
                <span>Comanda de Mesa {table?.table_number} ({cartCount})</span>
              </h3>
              <button onClick={() => setShowCart(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1">
              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs font-semibold">Tu comanda está vacía.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5 max-h-64 overflow-y-auto">
                    {cart.map((cItem, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 text-xs truncate">{cItem.name}</p>
                          <p className="text-[10px] text-slate-500">${cItem.price.toFixed(2)} c/u</p>
                          {cItem.notes && (
                            <p className="text-[10px] text-amber-700 italic truncate mt-0.5">
                              Nota: {cItem.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => updateCartQty(idx, -1)}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-black text-xs w-4 text-center">{cItem.qty}</span>
                          <button
                            onClick={() => updateCartQty(idx, 1)}
                            className="w-7 h-7 rounded-lg bg-amber-500 text-white font-bold flex items-center justify-center hover:bg-amber-400"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="font-black text-xs text-amber-600 w-14 text-right shrink-0">
                          ${(cItem.price * cItem.qty).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                    <span className="font-black text-slate-900 text-sm">TOTAL COMANDA</span>
                    <span className="font-black text-amber-600 text-xl">${cartTotal.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isOrdering}
                    className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    {isOrdering ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /><span>Enviando a cocina...</span></>
                    ) : (
                      <><Utensils className="w-5 h-5" /><span>Confirmar y Enviar a Cocina ⚡</span></>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponente Tarjeta de Plato
function DishCard({
  item,
  onCustomize,
}: {
  item: MenuItem;
  onCustomize: () => void;
}) {
  return (
    <div
      onClick={onCustomize}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-3 flex gap-3 cursor-pointer active:scale-[0.99] group"
    >
      {item.image_url && (
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          {item.badge && (
            <span className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
              {item.badge === 'mas_vendido' ? '🔥 Top' : '⭐ Chef'}
            </span>
          )}
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-black text-slate-900 text-xs sm:text-sm leading-snug truncate">
              {item.name}
            </h3>
          </div>
          {item.description && (
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="font-black text-amber-600 text-sm sm:text-base">
            ${item.price.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCustomize();
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white text-xs font-black transition-colors flex items-center gap-1 border border-amber-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RestaurantMenuPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-black text-amber-600">Iniciando Kiosco Táctil de Mesa...</p>
          </div>
        </div>
      }
    >
      <RestaurantMenuPageInner params={params} />
    </Suspense>
  );
}
