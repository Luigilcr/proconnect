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

  created_at: string;
  updated_at?: string;
  expires_at?: string | null;
  plan_duration?: 'monthly' | 'annual' | 'lifetime' | 'custom';
}

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
}

// ????????????????????????????????????????????????????
// M�DULO PROCONNECT GASTRO � MESAS INTELIGENTES
// ????????????????????????????????????????????????????

export interface RestaurantTable {
  id: string;
  organization_id: string;
  table_number: number;
  slug: string;        // p.e. "pollos-mario"  ? /r/pollos-mario?mesa=3
  name: string;        // "Mesa 3", "Terraza 1", "VIP 2"
  capacity: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  organization_id: string;
  name: string;        // "Entradas", "Platos Fuertes", "Bebidas", "Postres"
  icon: string;        // emoji: "??", "??", "??"
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
  bill_requested: boolean;
  created_at: string;
  updated_at: string;
}

// Info de pago de la organizaci�n restaurante
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
