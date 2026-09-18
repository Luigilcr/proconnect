'use client';
// © ProConnect. Todos los derechos reservados.
// Queda prohibida la reproducción, copia o ingeniería inversa de este software.
// VISTA COMENSAL — Menú Interactivo ProConnect Gastro
// Ruta: /r/[slug]?mesa=3

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShoppingCart, Plus, Minus, X, BellRing, Receipt,
  ChevronRight, CheckCircle2, Upload, Loader2, Star,
} from 'lucide-react';
import {
  getMenuCategories, getMenuItemsByCategory, getRestaurantTables,
  createOrder, callWaiter, requestBill, submitPayment,
  getPaymentInfo, getOrdersByTable,
} from '@/lib/data/restaurant-store';
import { getOrganizationBySlug } from '@/lib/data/card-store';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { BRASA_CRIOLLA_ORG_ID } from '@/lib/data/demo-data';
import {
  MenuCategory, MenuItem, OrderItem, TableOrder,
  RestaurantTable, RestaurantPaymentInfo,
} from '@/lib/types';

interface CartItem extends MenuItem {
  qty: number;
  notes: string;
}

function PaymentModal({
  order,
  paymentInfo,
  onPay,
  onClose,
}: {
  order: TableOrder;
  paymentInfo: RestaurantPaymentInfo | null;
  onPay: (method: string, reference: string, receipt: string | null) => void;
  onClose: () => void;
}) {
  const [method, setMethod] = useState('pago_movil');
  const [reference, setReference] = useState('');
  const [receiptB64, setReceiptB64] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptB64(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const methods = [
    { id: 'pago_movil', label: 'Pago Móvil', emoji: '📱' },
    { id: 'zelle', label: 'Zelle', emoji: '💵' },
    { id: 'transferencia', label: 'Transferencia', emoji: '🏦' },
    { id: 'efectivo', label: 'Efectivo', emoji: '💴' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl">
        <div className="sticky top-0 bg-white rounded-t-3xl px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-base">Pagar — $`${order.total.toFixed(2)}`</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {methods.map((pm) => (
              <button
                key={pm.id}
                onClick={() => setMethod(pm.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                  method === pm.id ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                <span className="text-base font-black">{pm.emoji}</span>
                <span>{pm.label}</span>
              </button>
            ))}
          </div>

          {paymentInfo && method === 'pago_movil' && (
            <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-1">
              <p><span className="text-slate-500">Teléfono:</span> <strong>{paymentInfo.pago_movil_phone}</strong></p>
              <p><span className="text-slate-500">Banco:</span> <strong>{paymentInfo.pago_movil_bank}</strong></p>
              <p><span className="text-slate-500">Cédula:</span> <strong>{paymentInfo.pago_movil_cedula}</strong></p>
            </div>
          )}

          {paymentInfo && method === 'zelle' && (
            <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-1">
              <p><span className="text-slate-500">Email:</span> <strong>{paymentInfo.zelle_email}</strong></p>
              <p><span className="text-slate-500">Nombre:</span> <strong>{paymentInfo.zelle_name}</strong></p>
            </div>
          )}

          {paymentInfo && method === 'transferencia' && (
            <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-1">
              <p><span className="text-slate-500">Banco:</span> <strong>{paymentInfo.bank_name}</strong></p>
              <p><span className="text-slate-500">Cuenta:</span> <strong>{paymentInfo.bank_account}</strong></p>
              <p><span className="text-slate-500">Titular:</span> <strong>{paymentInfo.bank_holder}</strong></p>
            </div>
          )}

          {method === 'efectivo' && (
            <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-600">
              Pague directamente al mesero. Monto a pagar: <strong>$`${order.total.toFixed(2)}`</strong>
            </div>
          )}

          {method !== 'efectivo' && (
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Número de referencia"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          )}

          {method !== 'efectivo' && (
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-xs font-semibold ${
                  receiptB64 ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-500'
                }`}
              >
                {receiptB64 ? (
                  <><CheckCircle2 className="w-4 h-4" /><span>Comprobante adjunto ✓</span></>
                ) : (
                  <><Upload className="w-4 h-4" /><span>Subir comprobante de pago</span></>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-amber-700 py-0.5">
                <span>{item.qty}x {item.name}</span>
                <span>$`${item.subtotal.toFixed(2)}`</span>
              </div>
            ))}
            <div className="border-t border-amber-300 mt-2 pt-2 flex justify-between font-black text-amber-900 text-sm">
              <span>TOTAL</span>
              <span>$`${order.total.toFixed(2)}`</span>
            </div>
          </div>

          <button
            onClick={() => onPay(method, reference, receiptB64)}
            disabled={method !== 'efectivo' && !reference.trim()}
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  );
}

function RestaurantMenuPageInner({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams();
  const tableNumber = parseInt(searchParams.get('mesa') || '1', 10);
  const [orgId, setOrgId] = useState<string>(BRASA_CRIOLLA_ORG_ID);

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, MenuItem[]>>({});
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [currentOrder, setCurrentOrder] = useState<TableOrder | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<RestaurantPaymentInfo | null>(null);
  const [showPayment, setShowPayment] = useState(false);
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

  useEffect(() => {
    const cats = getMenuCategories(orgId);
    setCategories(cats);
    if (cats.length > 0) setActiveCategory(cats[0].id);

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
  }, [orgId, tableNumber]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.id === item.id);
      if (ex) return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1, notes: '' }];
    });
    showToast(`${item.name} añadido`, 'info');
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.id === id);
      if (!ex) return prev;
      if (ex.qty <= 1) return prev.filter((c) => c.id !== id);
      return prev.map((c) => c.id === id ? { ...c, qty: c.qty - 1 } : c);
    });
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const handlePlaceOrder = async () => {
    if (!table || cart.length === 0) return;
    setIsOrdering(true);
    await new Promise((r) => setTimeout(r, 700));
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
    showToast('¡Pedido enviado a cocina! 🍗');
  };

  const handleCallWaiter = () => {
    if (!currentOrder) return;
    callWaiter(currentOrder.id);
    showToast('¡Mesero en camino! 🔔', 'info');
  };

  const handleRequestBill = () => {
    if (!currentOrder) return;
    requestBill(currentOrder.id);
    setShowPayment(true);
  };

  const handlePay = (method: string, reference: string, receipt: string | null) => {
    if (!currentOrder) return;
    submitPayment(currentOrder.id, method, reference, receipt);
    setShowPayment(false);
    setOrderPlaced(false);
    setCurrentOrder(null);
    showToast('¡Pago registrado! Muchas gracias 🙏');
  };

  return (
    <div className="min-h-screen flex flex-col bg-orange-50/50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-amber-100">
              <img
                src="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=200"
                alt="Brasa Criolla"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-black text-slate-900 text-base">Brasa Criolla</h1>
              <p className="text-xs text-amber-600 font-semibold">{table ? table.name : `Mesa ${tableNumber}`}</p>
            </div>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md hover:bg-amber-400 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Carrito</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-black flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold text-white ${
            toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {orderPlaced && currentOrder && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <p className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Pedido activo — $`${currentOrder.total.toFixed(2)}`
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={handleCallWaiter}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold hover:bg-amber-200"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Mesero</span>
              </button>
              <button
                onClick={handleRequestBill}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Cuenta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-2xl w-full mx-auto pb-32">
        <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-100">
          <div className="flex gap-1 px-4 py-2.5 overflow-x-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat.id ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">
          {categories
            .filter((c) => c.id === activeCategory)
            .map((cat) => (
              <div key={cat.id}>
                <h2 className="font-black text-slate-900 text-lg flex items-center gap-2 mb-3">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </h2>
                <div className="space-y-3">
                  {(itemsByCategory[cat.id] || []).map((item) => {
                    const inCart = cart.find((c) => c.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex gap-3 p-3"
                      >
                        {item.image_url && (
                          <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {item.is_featured && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-1.5 py-0.5 mb-1">
                              <Star className="w-2.5 h-2.5" /> Popular
                            </span>
                          )}
                          <h3 className="font-bold text-slate-900 text-sm leading-tight">{item.name}</h3>
                          {item.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-black text-amber-600 text-base">$`${item.price.toFixed(2)}`</span>
                            {inCart ? (
                              <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-1 py-0.5">
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-7 h-7 rounded-lg bg-white border border-amber-200 flex items-center justify-center text-amber-600 hover:bg-amber-100"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-black text-amber-700 text-sm w-5 text-center">{inCart.qty}</span>
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center hover:bg-amber-400"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 active:scale-95 transition-all"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Añadir</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </main>

      {orderPlaced && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
          <button
            onClick={handleCallWaiter}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border-2 border-amber-400 text-amber-700 font-black text-sm shadow-xl hover:bg-amber-50 active:scale-95 transition-all"
          >
            <BellRing className="w-4 h-4" />
            Llamar Mesero
          </button>
          <button
            onClick={handleRequestBill}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-xl hover:bg-emerald-500 active:scale-95 transition-all"
          >
            <Receipt className="w-4 h-4" />
            Pedir Cuenta
          </button>
        </div>
      )}

      {showCart && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowCart(false)}
        >
          <div
            className="w-full sm:max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white rounded-t-3xl px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
                Mi Pedido ({cartCount})
              </h3>
              <button onClick={() => setShowCart(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Tu carrito está vacío</p>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{item.name}</p>
                        <p className="text-xs text-slate-500">$`${item.price.toFixed(2)}` c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-black text-slate-900 w-5 text-center text-sm">{item.qty}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center hover:bg-amber-400"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-black text-amber-600 text-sm w-14 text-right">
                        $`${(item.price * item.qty).toFixed(2)}`
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                    <span className="font-black text-slate-900">TOTAL</span>
                    <span className="font-black text-amber-600 text-xl">$`${cartTotal.toFixed(2)}`</span>
                  </div>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isOrdering}
                    className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    {isOrdering ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /><span>Enviando...</span></>
                    ) : (
                      <><ChevronRight className="w-5 h-5" /><span>Confirmar Pedido — $`${cartTotal.toFixed(2)}`</span></>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showPayment && currentOrder && (
        <PaymentModal
          order={currentOrder}
          paymentInfo={paymentInfo}
          onPay={handlePay}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}

export default function RestaurantMenuPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-orange-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-amber-600 font-bold">Cargando menú...</p>
          </div>
        </div>
      }
    >
      <RestaurantMenuPageInner params={params} />
    </Suspense>
  );
}
