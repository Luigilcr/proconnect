/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * DEFINICIONES DE TIPOS Y MODELOS DE DATOS (B2B & ADVANCED VISUAL ENGINE)
 */

export type UserRole = 'superadmin' | 'org_admin' | 'client';

export type LayoutType =
  | 'modern'
  | 'executive'
  | 'minimal'
  | 'banner_header'
  | 'card_id_badge'
  | 'creative_grid'
  | 'crimson_quote';

export type AvatarPosition =
  | 'top_center'
  | 'header_floating'
  | 'left_aligned'
  | 'hidden';

export type ButtonStyle =
  | 'solid'
  | 'filled'
  | 'outline'
  | 'glassmorphism'
  | 'gradient'
  | 'soft_shadow';

export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';

export type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold';

export type LinkType =
  | 'whatsapp'
  | 'phone'
  | 'email'
  | 'website'
  | 'instagram'
  | 'linkedin'
  | 'tiktok'
  | 'custom';

export type MediaType = 'pdf' | 'image' | 'video_embed';

export type AnalyticsEventType =
  | 'view'
  | 'vcard_download'
  | 'link_click'
  | 'whatsapp_lead';

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export type OrgType = 'corporate' | 'restaurant';
export type SubscriptionStatus = 'active' | 'suspended';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_colors: BrandColors;
  font_family: string;
  allowed_layouts: LayoutType[];
  enforce_brand_lock: boolean;
  max_cards: number;
  org_type?: OrgType;
  industry_type?: 'corporate' | 'restaurant' | 'real_estate' | 'legal' | 'health' | 'technology' | 'other';
  description?: string | null;
  mandatory_links?: { label: string; url: string; type: LinkType }[];
  legal_disclaimer?: string | null;
  subscription_status?: SubscriptionStatus;
  webhook_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: string;
  organization_id?: string | null;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

export interface Card {
  id: string;
  user_id: string;
  organization_id?: string | null;
  slug: string;
  is_active: boolean;

  // Datos personales e identidad corporativa
  full_name: string;
  job_title: string | null;
  company_name: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  cover_photo_url: string | null;
  logo_url: string | null;

  // Motor Visual Avanzado
  layout_type: LayoutType;
  avatar_position: AvatarPosition;
  button_style: ButtonStyle;
  border_radius: BorderRadius;

  // Paleta de 4 tonos
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;

  // Tipografía
  font_family: string;
  font_weight: FontWeight;

  // Configuración vCard
  include_photo: boolean;
  custom_vcf_notes: string | null;
  // Opciones avanzadas y complementos (CRM, Lead Capture)
  enable_crm_capture?: boolean;

  // Nuevos estilos prémium y personalización avanzada
  background_texture?: BackgroundTexture;
  avatar_effect?: AvatarEffect;
  card_badge?: CardBadge;

  created_at: string;
  updated_at?: string;
  expires_at?: string | null;
  plan_duration?: 'monthly' | 'annual' | 'lifetime' | 'custom';
  redirect_to_slug?: string | null;
  department?: string | null;
}

export type BackgroundTexture = 'none' | 'dots' | 'grid' | 'carbon' | 'subtle_noise' | 'mesh_gradient';
export type AvatarEffect = 'none' | 'glow_primary' | 'glow_accent' | 'metallic_ring' | 'glass_border';
export type CardBadge = 'none' | 'verified_pro' | 'vip_executive' | 'top_speaker' | 'official_partner';

export interface CardLink {
  id: string;
  card_id: string;
  type: LinkType;
  label: string;
  url: string;
  icon_name?: string | null;
  is_active: boolean;
  position_order: number;
  created_at?: string;
}

export interface CatalogMultimedia {
  id: string;
  card_id: string;
  file_type: MediaType;
  title: string;
  file_url: string;
  thumbnail_url?: string | null;
  position_order: number;
  created_at?: string;
}

export interface FullCard extends Card {
  links: CardLink[];
  multimedia: CatalogMultimedia[];
}

export interface AnalyticsEvent {
  id: string;
  card_id: string;
  event_type: AnalyticsEventType;
  metadata?: Record<string, any>;
  created_at: string;
}

export type LeadStatus = 'nuevo' | 'contactado' | 'propuesta' | 'ganado' | 'perdido';

export interface LeadActivityNote {
  id: string;
  author_name: string;
  author_role: string;
  text: string;
  created_at: string;
}

export interface WhatsAppLead {
  id: string;
  card_id: string;
  organization_id?: string | null;
  visitor_name: string;
  subject: string;
  phone_number: string;
  email?: string | null;
  company_name?: string | null;
  interest_notes?: string | null;
  status?: LeadStatus;
  salesperson_name?: string | null;
  activity_notes?: LeadActivityNote[];
  created_at: string;
  updated_at?: string;
}

export type Lead = WhatsAppLead;

export interface SystemMetrics {
  totalUsers: number;
  totalOrganizations: number;
  totalCards: number;
  activeCards: number;
  totalLinks: number;
  totalMultimedia: number;
  totalViews: number;
  totalLeads: number;
}

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  layout_type: LayoutType;
  avatar_position: AvatarPosition;
  button_style: ButtonStyle;
  border_radius: BorderRadius;
  colors: BrandColors;
  font_family: string;
  font_weight: FontWeight;
  background_texture?: BackgroundTexture;
  avatar_effect?: AvatarEffect;
  card_badge?: CardBadge;
}

// ====================================================
// MÓDULO PROCONNECT GASTRO — MESAS INTELIGENTES
// ====================================================

export interface RestaurantTable {
  id: string;
  organization_id: string;
  table_number: number;
  slug: string;        // p.e. "brasa-criolla"  -> /r/brasa-criolla?mesa=3
  name: string;        // "Mesa 3", "Terraza 1", "VIP 2"
  capacity: number;
  assigned_waiter?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  organization_id: string;
  name: string;        // "Entradas", "Platos Fuertes", "Combos", "Bebidas", "Postres"
  icon: string;        // emoji: "🥗", "🍗", "🔥"
  position_order: number;
}

export type MenuItemStatus = 'available' | 'unavailable' | 'out_of_stock';

export interface MenuItem {
  id: string;
  category_id: string;
  organization_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  status: MenuItemStatus;
  is_featured: boolean;
  badge?: 'mas_vendido' | 'chef_recommend' | 'combo_familiar' | 'nuevo' | null;
  position_order: number;
}

export interface OrderItem {
  menu_item_id: string;
  name: string;
  qty: number;
  unit_price: number;
  subtotal: number;
  notes: string | null;
}

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'paid'
  | 'cancelled';

export type PaymentMethod =
  | 'pago_movil'
  | 'zelle'
  | 'transferencia'
  | 'efectivo'
  | 'tarjeta';

export interface PaymentData {
  method: PaymentMethod;
  reference: string | null;
  receipt_base64: string | null;  // comprobante subido por el cliente
  confirmed_at: string | null;
  status?: 'pending_approval' | 'approved' | 'rejected';
}

export interface TableOrder {
  id: string;
  table_id: string;
  organization_id: string;
  table_number: number;
  table_name: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  payment_data: PaymentData | null;
  waiter_called: boolean;
  waiter_call_reason?: string | null;
  bill_requested: boolean;
  tip_amount?: number;
  assigned_waiter?: string | null;
  prep_started_at?: string | null;
  delivered_at?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Info de pago de la organización restaurante
export interface RestaurantPaymentInfo {
  pago_movil_phone: string | null;
  pago_movil_bank: string | null;
  pago_movil_cedula: string | null;
  zelle_email: string | null;
  zelle_name: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_holder: string | null;
}

export interface RestaurantKPIs {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  activeTablesCount: number;
  topSellingItems: { name: string; qty: number; revenue: number }[];
  lowSellingItems: { name: string; qty: number; revenue: number }[];
  avgPreparationMinutes: number;
}

// ── SISTEMA DE CUPONES DE DESCUENTO B2B ──
export interface DiscountCoupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  applicable_plan: 'all' | 'pyme' | 'corporativo' | 'enterprise';
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  notes?: string | null;
}

// ── REGISTRO Y AUDITORÍA DE PAGOS B2B ──
export interface OrganizationPayment {
  id: string;
  organization_id: string;
  organization_name: string;
  plan_id: string;
  plan_name: string;
  billing_cycle: 'monthly' | 'annual';
  subtotal: number;
  discount_amount: number;
  total_paid: number;
  coupon_code: string | null;
  payment_method: 'card' | 'transfer' | 'pago_movil' | 'zelle';
  reference_number: string;
  receipt_url: string | null;
  admin_email: string;
  admin_name: string;
  admin_phone?: string | null;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

