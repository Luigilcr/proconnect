// © ProConnect. Todos los derechos reservados.
// Queda prohibida la reproducción, copia o ingeniería inversa de este software.
//
// RESTAURANT STORE — Capa de datos para el módulo ProConnect Gastro
// Opera con localStorage en modo demo; conectable a Supabase en producción.

import {
  RestaurantTable,
  MenuCategory,
  MenuItem,
  TableOrder,
  OrderItem,
  OrderStatus,
  RestaurantPaymentInfo,
  RestaurantKPIs,
} from '@/lib/types';

const TABLES_KEY   = 'proconnect_restaurant_tables_v1';
const CATEG_KEY    = 'proconnect_menu_categories_v1';
const ITEMS_KEY    = 'proconnect_menu_items_v1';
const ORDERS_KEY   = 'proconnect_table_orders_v1';
const PAYMENT_KEY  = 'proconnect_payment_info_v1';

// ── Helpers ──────────────────────────────────────────────────
function load<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }
  catch { return fallback; }
}
function save<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}
function uid(): string {
  return 'r_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36);
}

// ── DEMO SEED — Brasa Criolla ─────────────────────────────────
import { getDemoRestaurantData } from './demo-data';

function ensureSeed(orgId: string) {
  const tables = load<RestaurantTable>(TABLES_KEY, []);
  if (tables.some((t) => t.organization_id === orgId)) return;
  const { tables: demoTables, categories, items, paymentInfo } = getDemoRestaurantData(orgId);
  save(TABLES_KEY, [...tables, ...demoTables]);
  const cats = load<MenuCategory>(CATEG_KEY, []);
  save(CATEG_KEY, [...cats, ...categories]);
  const menuItems = load<MenuItem>(ITEMS_KEY, []);
  save(ITEMS_KEY, [...menuItems, ...items]);
  const payments = load<{ org_id: string } & RestaurantPaymentInfo>(PAYMENT_KEY, []);
  if (!payments.some((p) => p.org_id === orgId)) {
    save(PAYMENT_KEY, [...payments, { org_id: orgId, ...paymentInfo }]);
  }
}

// ━━ TABLES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getRestaurantTables(orgId: string): RestaurantTable[] {
  ensureSeed(orgId);
  return load<RestaurantTable>(TABLES_KEY, []).filter((t) => t.organization_id === orgId);
}

export function saveRestaurantTable(table: RestaurantTable): void {
  const all = load<RestaurantTable>(TABLES_KEY, []);
  const idx = all.findIndex((t) => t.id === table.id);
  if (idx >= 0) all[idx] = table; else all.push(table);
  save(TABLES_KEY, all);
}

export function addRestaurantTable(orgId: string, slug: string): RestaurantTable {
  const existing = getRestaurantTables(orgId);
  const maxNum = existing.reduce((m, t) => Math.max(m, t.table_number), 0);
  const tableNum = maxNum + 1;
  const table: RestaurantTable = {
    id: uid(),
    organization_id: orgId,
    table_number: tableNum,
    slug,
    name: `Mesa ${tableNum}`,
    capacity: 4,
    is_active: true,
    created_at: new Date().toISOString(),
  };
  saveRestaurantTable(table);
  return table;
}

export function toggleTableStatus(tableId: string): void {
  const all = load<RestaurantTable>(TABLES_KEY, []);
  const idx = all.findIndex((t) => t.id === tableId);
  if (idx >= 0) { all[idx].is_active = !all[idx].is_active; save(TABLES_KEY, all); }
}

// ━━ MENU CATEGORIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getMenuCategories(orgId: string): MenuCategory[] {
  ensureSeed(orgId);
  return load<MenuCategory>(CATEG_KEY, [])
    .filter((c) => c.organization_id === orgId)
    .sort((a, b) => a.position_order - b.position_order);
}

export function saveMenuCategory(cat: MenuCategory): void {
  const all = load<MenuCategory>(CATEG_KEY, []);
  const idx = all.findIndex((c) => c.id === cat.id);
  if (idx >= 0) all[idx] = cat; else all.push(cat);
  save(CATEG_KEY, all);
}

export function addMenuCategory(orgId: string, name: string, icon: string): MenuCategory {
  const existing = getMenuCategories(orgId);
  const cat: MenuCategory = {
    id: uid(),
    organization_id: orgId,
    name,
    icon,
    position_order: existing.length,
  };
  saveMenuCategory(cat);
  return cat;
}

// ━━ MENU ITEMS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getMenuItems(orgId: string): MenuItem[] {
  ensureSeed(orgId);
  return load<MenuItem>(ITEMS_KEY, [])
    .filter((i) => i.organization_id === orgId)
    .sort((a, b) => a.position_order - b.position_order);
}

export function getMenuItemsByCategory(categoryId: string): MenuItem[] {
  return load<MenuItem>(ITEMS_KEY, [])
    .filter((i) => i.category_id === categoryId && i.status === 'available')
    .sort((a, b) => a.position_order - b.position_order);
}

export function saveMenuItem(item: MenuItem): void {
  const all = load<MenuItem>(ITEMS_KEY, []);
  const idx = all.findIndex((i) => i.id === item.id);
  if (idx >= 0) all[idx] = item; else all.push(item);
  save(ITEMS_KEY, all);
}

export function addMenuItem(orgId: string, categoryId: string, partial: Partial<MenuItem>): MenuItem {
  const existing = getMenuItems(orgId).filter((i) => i.category_id === categoryId);
  const item: MenuItem = {
    id: uid(),
    category_id: categoryId,
    organization_id: orgId,
    name: partial.name || 'Nuevo Plato',
    description: partial.description || null,
    price: partial.price || 0,
    image_url: partial.image_url || null,
    status: 'available',
    is_featured: false,
    position_order: existing.length,
  };
  saveMenuItem(item);
  return item;
}

// ━━ ORDERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getActiveOrders(orgId: string): TableOrder[] {
  return load<TableOrder>(ORDERS_KEY, [])
    .filter((o) => o.organization_id === orgId && o.status !== 'paid' && o.status !== 'cancelled')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getAllOrdersByOrg(orgId: string): TableOrder[] {
  return load<TableOrder>(ORDERS_KEY, [])
    .filter((o) => o.organization_id === orgId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getOrdersByTable(tableId: string): TableOrder[] {
  return load<TableOrder>(ORDERS_KEY, [])
    .filter((o) => o.table_id === tableId && o.status !== 'paid' && o.status !== 'cancelled');
}

export function createOrder(
  orgId: string,
  table: RestaurantTable,
  items: OrderItem[]
): TableOrder {
  const total = items.reduce((s, i) => s + i.subtotal, 0);
  const order: TableOrder = {
    id: uid(),
    table_id: table.id,
    organization_id: orgId,
    table_number: table.table_number,
    table_name: table.name,
    items,
    status: 'pending',
    total,
    payment_data: null,
    waiter_called: false,
    bill_requested: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const all = load<TableOrder>(ORDERS_KEY, []);
  save(ORDERS_KEY, [...all, order]);
  return order;
}

export function updateOrderStatus(orderId: string, status: OrderStatus): void {
  const all = load<TableOrder>(ORDERS_KEY, []);
  const idx = all.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    all[idx].status = status;
    all[idx].updated_at = new Date().toISOString();
    save(ORDERS_KEY, all);
  }
}

export function callWaiter(orderId: string): void {
  const all = load<TableOrder>(ORDERS_KEY, []);
  const idx = all.findIndex((o) => o.id === orderId);
  if (idx >= 0) { all[idx].waiter_called = true; all[idx].updated_at = new Date().toISOString(); save(ORDERS_KEY, all); }
}

export function requestBill(orderId: string): void {
  const all = load<TableOrder>(ORDERS_KEY, []);
  const idx = all.findIndex((o) => o.id === orderId);
  if (idx >= 0) { all[idx].bill_requested = true; all[idx].updated_at = new Date().toISOString(); save(ORDERS_KEY, all); }
}

export function submitPayment(orderId: string, method: string, reference: string, receipt_base64: string | null): void {
  const all = load<TableOrder>(ORDERS_KEY, []);
  const idx = all.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    all[idx].payment_data = {
      method: method as any,
      reference,
      receipt_base64,
      confirmed_at: null,
    };
    all[idx].status = 'paid';
    all[idx].updated_at = new Date().toISOString();
    save(ORDERS_KEY, all);
  }
}

// ━━ PAYMENT INFO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getPaymentInfo(orgId: string): RestaurantPaymentInfo | null {
  ensureSeed(orgId);
  const all = load<{ org_id: string } & RestaurantPaymentInfo>(PAYMENT_KEY, []);
  const found = all.find((p) => p.org_id === orgId);
  if (!found) return null;
  const { org_id: _, ...info } = found;
  return info;
}

export function savePaymentInfo(orgId: string, info: RestaurantPaymentInfo): void {
  const all = load<{ org_id: string } & RestaurantPaymentInfo>(PAYMENT_KEY, []);
  const idx = all.findIndex((p) => p.org_id === orgId);
  const entry = { org_id: orgId, ...info };
  if (idx >= 0) all[idx] = entry; else all.push(entry);
  save(PAYMENT_KEY, all);
}

// ━━ WAITER ASSIGNMENT & CALLS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function assignWaiterToTable(tableId: string, waiterName: string | null): void {
  const all = load<RestaurantTable>(TABLES_KEY, []);
  const idx = all.findIndex((t) => t.id === tableId);
  if (idx >= 0) {
    all[idx].assigned_waiter = waiterName;
    save(TABLES_KEY, all);
  }
}

export function assignWaiterToOrder(orderId: string, waiterName: string | null): void {
  const all = load<TableOrder>(ORDERS_KEY, []);
  const idx = all.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    all[idx].assigned_waiter = waiterName;
    all[idx].updated_at = new Date().toISOString();
    save(ORDERS_KEY, all);
  }
}

export function callWaiterWithReason(orderId: string, reason: string): void {
  const all = load<TableOrder>(ORDERS_KEY, []);
  const idx = all.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    all[idx].waiter_called = true;
    all[idx].waiter_call_reason = reason;
    all[idx].updated_at = new Date().toISOString();
    save(ORDERS_KEY, all);
  }
}

export function dismissWaiterCall(orderId: string): void {
  const all = load<TableOrder>(ORDERS_KEY, []);
  const idx = all.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    all[idx].waiter_called = false;
    all[idx].waiter_call_reason = null;
    all[idx].updated_at = new Date().toISOString();
    save(ORDERS_KEY, all);
  }
}

export function requestBillWithTip(orderId: string, tipAmount: number): void {
  const all = load<TableOrder>(ORDERS_KEY, []);
  const idx = all.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    all[idx].bill_requested = true;
    all[idx].tip_amount = tipAmount;
    all[idx].updated_at = new Date().toISOString();
    save(ORDERS_KEY, all);
  }
}

export function dismissBillRequest(orderId: string): void {
  const all = load<TableOrder>(ORDERS_KEY, []);
  const idx = all.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    all[idx].bill_requested = false;
    all[idx].updated_at = new Date().toISOString();
    save(ORDERS_KEY, all);
  }
}

// ━━ KDS & PREPARATION TIMERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function updateOrderPrepStatus(orderId: string, status: OrderStatus): void {
  const all = load<TableOrder>(ORDERS_KEY, []);
  const idx = all.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    all[idx].status = status;
    const now = new Date().toISOString();
    if (status === 'preparing' && !all[idx].prep_started_at) {
      all[idx].prep_started_at = now;
    }
    if (status === 'delivered' && !all[idx].delivered_at) {
      all[idx].delivered_at = now;
    }
    if (status === 'paid' && !all[idx].paid_at) {
      all[idx].paid_at = now;
    }
    all[idx].updated_at = now;
    save(ORDERS_KEY, all);
  }
}

// ━━ RECEIPT REVIEW & CASHIER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function submitPaymentWithReceipt(
  orderId: string,
  method: string,
  reference: string,
  receipt_base64: string | null
): void {
  const all = load<TableOrder>(ORDERS_KEY, []);
  const idx = all.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    all[idx].payment_data = {
      method: method as any,
      reference,
      receipt_base64,
      confirmed_at: null,
      status: 'pending_approval',
    };
    all[idx].updated_at = new Date().toISOString();
    save(ORDERS_KEY, all);
  }
}

export function reviewPaymentReceipt(orderId: string, approved: boolean): void {
  const all = load<TableOrder>(ORDERS_KEY, []);
  const idx = all.findIndex((o) => o.id === orderId);
  if (idx >= 0 && all[idx].payment_data) {
    all[idx].payment_data!.status = approved ? 'approved' : 'rejected';
    all[idx].payment_data!.confirmed_at = approved ? new Date().toISOString() : null;
    if (approved) {
      all[idx].status = 'paid';
      all[idx].paid_at = new Date().toISOString();
    }
    all[idx].updated_at = new Date().toISOString();
    save(ORDERS_KEY, all);
  }
}

// ━━ RESTAURANT KPIS & ANALYTICS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getRestaurantKPIs(orgId: string): RestaurantKPIs {
  ensureSeed(orgId);
  const orders = getAllOrdersByOrg(orgId);
  const menuItems = getMenuItems(orgId);

  const totalRevenue = orders.reduce((sum, o) => {
    const tip = o.tip_amount || 0;
    return sum + (o.total || 0) + tip;
  }, 0);

  const totalOrders = orders.length;
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const activeTablesCount = new Set(
    orders.filter((o) => o.status !== 'paid' && o.status !== 'cancelled').map((o) => o.table_id)
  ).size;

  const salesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  menuItems.forEach((m) => {
    salesMap[m.name] = { name: m.name, qty: 0, revenue: 0 };
  });

  orders.forEach((ord) => {
    ord.items?.forEach((item) => {
      if (!salesMap[item.name]) {
        salesMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
      }
      salesMap[item.name].qty += item.qty;
      salesMap[item.name].revenue += item.subtotal;
    });
  });

  const sortedItems = Object.values(salesMap).sort((a, b) => b.qty - a.qty);
  const topSellingItems = sortedItems.slice(0, 5);
  const lowSellingItems = [...sortedItems].reverse().slice(0, 5);

  let totalPrepMinutes = 0;
  let prepCount = 0;
  orders.forEach((o) => {
    if (o.prep_started_at && o.delivered_at) {
      const diffMs = new Date(o.delivered_at).getTime() - new Date(o.prep_started_at).getTime();
      const mins = Math.max(1, Math.round(diffMs / 60000));
      totalPrepMinutes += mins;
      prepCount++;
    }
  });

  const avgPreparationMinutes = prepCount > 0 ? Math.round(totalPrepMinutes / prepCount) : 14;

  return {
    totalRevenue,
    totalOrders,
    averageTicket,
    activeTablesCount,
    topSellingItems,
    lowSellingItems,
    avgPreparationMinutes,
  };
}
