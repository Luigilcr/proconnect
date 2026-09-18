/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * ESQUEMA DE BASE DE DATOS PARA SUPABASE / POSTGRESQL (AMPLIACIÓN B2B Y MOTOR VISUAL)
 * Plataforma SaaS Multi-Tenant para Tarjetas de Presentación Digitales NFC y QR.
 */

-- ==============================================================================
-- 1. EXTENSIONES Y ENUMS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rol de usuario (B2B multi-nivel)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('superadmin', 'org_admin', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipos de Maquetado Visual (6 Layouts)
DO $$ BEGIN
    CREATE TYPE layout_type AS ENUM (
        'modern',
        'executive',
        'minimal',
        'banner_header',
        'card_id_badge',
        'creative_grid'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Posición del Avatar
DO $$ BEGIN
    CREATE TYPE avatar_position AS ENUM (
        'top_center',
        'header_floating',
        'left_aligned',
        'hidden'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Estilo de Botones
DO $$ BEGIN
    CREATE TYPE button_style AS ENUM (
        'solid',
        'outline',
        'glassmorphism',
        'gradient',
        'soft_shadow'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Radio de Bordes
DO $$ BEGIN
    CREATE TYPE border_radius_type AS ENUM (
        'none',
        'sm',
        'md',
        'lg',
        'full'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipos de enlaces soportados
DO $$ BEGIN
    CREATE TYPE link_type AS ENUM (
        'whatsapp',
        'phone',
        'email',
        'website',
        'instagram',
        'linkedin',
        'tiktok',
        'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipos de archivos multimedia y catálogos
DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('pdf', 'image', 'video_embed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipos de eventos analíticos
DO $$ BEGIN
    CREATE TYPE analytics_event_type AS ENUM (
        'view',
        'vcard_download',
        'link_click',
        'whatsapp_lead'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. TABLAS DEL SISTEMA (JERARQUÍA B2B)
-- ==============================================================================

-- 1. Tabla de Organizaciones / Empresas (B2B)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    brand_colors JSONB NOT NULL DEFAULT '{"primary": "#0EA5E9", "secondary": "#0369A1", "accent": "#38BDF8", "background": "#0F172A"}'::jsonb,
    font_family VARCHAR(50) NOT NULL DEFAULT 'Inter',
    allowed_layouts TEXT[] NOT NULL DEFAULT ARRAY['modern', 'executive', 'minimal', 'banner_header', 'card_id_badge', 'creative_grid'],
    enforce_brand_lock BOOLEAN NOT NULL DEFAULT TRUE,
    max_cards INT NOT NULL DEFAULT 10,
    webhook_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Usuarios (Sincronizada con auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role user_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla de Tarjetas Digitales (Motor Visual Avanzado)
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Datos de Identidad y Contacto
    full_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255),
    company_name VARCHAR(255),
    bio TEXT,
    profile_photo_url TEXT,
    cover_photo_url TEXT,
    logo_url TEXT,
    
    -- Motor Visual Avanzado (Paleta de 4 tonos, Layouts y Botones)
    layout_type layout_type NOT NULL DEFAULT 'modern',
    avatar_position avatar_position NOT NULL DEFAULT 'header_floating',
    button_style button_style NOT NULL DEFAULT 'solid',
    border_radius border_radius_type NOT NULL DEFAULT 'md',
    primary_color VARCHAR(20) NOT NULL DEFAULT '#0EA5E9',
    secondary_color VARCHAR(20) NOT NULL DEFAULT '#0369A1',
    accent_color VARCHAR(20) NOT NULL DEFAULT '#38BDF8',
    background_color VARCHAR(20) NOT NULL DEFAULT '#0F172A',
    font_family VARCHAR(50) NOT NULL DEFAULT 'Inter',
    font_weight VARCHAR(20) NOT NULL DEFAULT 'medium',
    
    -- Configuración vCard
    include_photo BOOLEAN NOT NULL DEFAULT TRUE,
    custom_vcf_notes TEXT,
    
    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabla de Enlaces y Redes Sociales
CREATE TABLE IF NOT EXISTS public.card_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    type link_type NOT NULL DEFAULT 'website',
    label VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    icon_name VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    position_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabla de Catálogos y Archivos Multimedia
CREATE TABLE IF NOT EXISTS public.catalogs_multimedia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    file_type media_type NOT NULL DEFAULT 'pdf',
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    position_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabla de Eventos Analíticos
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    event_type analytics_event_type NOT NULL DEFAULT 'view',
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Tabla de Leads Capturados por WhatsApp Inteligente
CREATE TABLE IF NOT EXISTS public.whatsapp_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    visitor_name VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. ÍNDICES DE RENDIMIENTO
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_cards_slug ON public.cards(slug);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_org_id ON public.cards(organization_id);
CREATE INDEX IF NOT EXISTS idx_cards_is_active ON public.cards(is_active);
CREATE INDEX IF NOT EXISTS idx_card_links_card_id ON public.card_links(card_id);
CREATE INDEX IF NOT EXISTS idx_analytics_card_id ON public.analytics_events(card_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_leads_card_id ON public.whatsapp_leads(card_id);

-- ==============================================================================
-- 4. TRIGGERS Y FUNCIONES AUXILIARES
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_cards_updated_at ON public.cards;
CREATE TRIGGER tr_cards_updated_at
    BEFORE UPDATE ON public.cards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_orgs_updated_at ON public.organizations;
CREATE TRIGGER tr_orgs_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Función para sincronizar nuevos usuarios de Supabase Auth a public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogs_multimedia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_leads ENABLE ROW LEVEL SECURITY;

-- Helper: verificar si el usuario conectado es superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'superadmin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas Organizations
DROP POLICY IF EXISTS "Lectura pública de organizaciones" ON public.organizations;
CREATE POLICY "Lectura pública de organizaciones"
    ON public.organizations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Org admins o superadmins gestionan su empresa" ON public.organizations;
CREATE POLICY "Org admins o superadmins gestionan su empresa"
    ON public.organizations FOR ALL
    USING (
        public.is_superadmin() OR EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() 
            AND users.organization_id = organizations.id 
            AND users.role IN ('superadmin', 'org_admin')
        )
    );

-- Políticas Cards
DROP POLICY IF EXISTS "Lectura pública de tarjetas activas" ON public.cards;
CREATE POLICY "Lectura pública de tarjetas activas"
    ON public.cards FOR SELECT
    USING (is_active = true OR auth.uid() = user_id OR public.is_superadmin());

DROP POLICY IF EXISTS "Propietarios administran sus tarjetas" ON public.cards;
CREATE POLICY "Propietarios administran sus tarjetas"
    ON public.cards FOR ALL
    USING (auth.uid() = user_id OR public.is_superadmin());

-- Políticas Analytics & Leads
DROP POLICY IF EXISTS "Inserción pública de analíticas" ON public.analytics_events;
CREATE POLICY "Inserción pública de analíticas"
    ON public.analytics_events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Propietarios ven analíticas de sus tarjetas" ON public.analytics_events;
CREATE POLICY "Propietarios ven analíticas de sus tarjetas"
    ON public.analytics_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.cards WHERE cards.id = analytics_events.card_id AND (cards.user_id = auth.uid() OR public.is_superadmin())
        )
    );

DROP POLICY IF EXISTS "Inserción pública de leads de WhatsApp" ON public.whatsapp_leads;
CREATE POLICY "Inserción pública de leads de WhatsApp"
    ON public.whatsapp_leads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Propietarios ven sus leads" ON public.whatsapp_leads;
CREATE POLICY "Propietarios ven sus leads"
    ON public.whatsapp_leads FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.cards WHERE cards.id = whatsapp_leads.card_id AND (cards.user_id = auth.uid() OR public.is_superadmin())
        )
    );

-- ==============================================================================
-- 6. DATOS DE PRUEBA / SEMILLA B2B (SEED DATA)
-- ==============================================================================

DO $$
DECLARE
    v_org_id UUID := 'e0000000-0000-0000-0000-000000000001';
    v_user_admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_user_elena_id UUID := 'a0000000-0000-0000-0000-000000000002';
    v_card_elena_id UUID := 'c0000000-0000-0000-0000-000000000001';
BEGIN
    -- 1. Organización B2B Demo
    INSERT INTO public.organizations (
        id,
        name,
        slug,
        logo_url,
        brand_colors,
        font_family,
        allowed_layouts,
        enforce_brand_lock,
        max_cards
    ) VALUES (
        v_org_id,
        'NexaCorp Technologies',
        'nexacorp',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200',
        '{"primary": "#0EA5E9", "secondary": "#0369A1", "accent": "#38BDF8", "background": "#0F172A"}'::jsonb,
        'Inter',
        ARRAY['modern', 'executive', 'minimal', 'banner_header', 'card_id_badge', 'creative_grid'],
        true,
        25
    )
    ON CONFLICT (slug) DO NOTHING;

    -- 2. Usuarios con roles B2B
    INSERT INTO public.users (id, organization_id, email, full_name, role)
    VALUES
        (v_user_admin_id, v_org_id, 'admin@proconnect.app', 'Super Administrador ProConnect', 'superadmin'),
        (v_user_elena_id, v_org_id, 'elena@nexacorp.io', 'Elena Rodríguez Morales', 'org_admin')
    ON CONFLICT (id) DO UPDATE
    SET organization_id = EXCLUDED.organization_id,
        role = EXCLUDED.role;

    -- 3. Tarjeta de Elena con Motor Visual Avanzado
    INSERT INTO public.cards (
        id,
        user_id,
        organization_id,
        slug,
        is_active,
        full_name,
        job_title,
        company_name,
        bio,
        profile_photo_url,
        cover_photo_url,
        logo_url,
        layout_type,
        avatar_position,
        button_style,
        border_radius,
        primary_color,
        secondary_color,
        accent_color,
        background_color,
        font_family,
        font_weight,
        include_photo,
        custom_vcf_notes
    ) VALUES (
        v_card_elena_id,
        v_user_elena_id,
        v_org_id,
        'elena-rodriguez',
        true,
        'Elena Rodríguez Morales',
        'Chief Innovation Officer & Co-Founder',
        'NexaCorp Technologies',
        'Liderando la transformación digital, soluciones basadas en IA y hardware IoT en América Latina y Europa.',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200',
        'banner_header',
        'header_floating',
        'gradient',
        'lg',
        '#0EA5E9',
        '#0369A1',
        '#38BDF8',
        '#0F172A',
        'Inter',
        'semibold',
        true,
        'Contacto corporativo verificado vía chip físico NFC ProConnect.'
    )
    ON CONFLICT (slug) DO NOTHING;

    -- 4. Leads de prueba en WhatsApp
    INSERT INTO public.whatsapp_leads (card_id, visitor_name, subject, phone_number)
    VALUES
        (v_card_elena_id, 'Martín Cárdenas', 'Contrato IoT para 500 empleados', '+34699112233'),
        (v_card_elena_id, 'Laura Gómez', 'Alianza de consultoría tecnológica', '+34688445566')
    ON CONFLICT DO NOTHING;
END $$;

-- ==============================================================================
-- M�DULO PROCONNECT GASTRO � MESAS INTELIGENTES PARA RESTAURANTES
-- ==============================================================================

-- Mesas del restaurante
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    table_number INT NOT NULL,
    slug VARCHAR(100) NOT NULL,         -- slug de la org (e.g. "pollos-mario")
    name VARCHAR(100) NOT NULL DEFAULT 'Mesa',
    capacity INT NOT NULL DEFAULT 4,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, table_number)
);

-- Categor�as del men�
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10) NOT NULL DEFAULT '???',
    position_order INT NOT NULL DEFAULT 0
);

-- Platos / �tems del men�
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    image_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available','unavailable','out_of_stock')),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    position_order INT NOT NULL DEFAULT 0
);

-- Comandas / �rdenes por mesa
CREATE TABLE IF NOT EXISTS public.table_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    table_number INT NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','preparing','ready','delivered','paid','cancelled')),
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_data JSONB,
    waiter_called BOOLEAN NOT NULL DEFAULT FALSE,
    bill_requested BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- �ndices
CREATE INDEX IF NOT EXISTS idx_rest_tables_org ON public.restaurant_tables(organization_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_cat ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_table ON public.table_orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_org_status ON public.table_orders(organization_id, status);

-- Trigger updated_at para commandas
DROP TRIGGER IF EXISTS tr_orders_updated_at ON public.table_orders;
CREATE TRIGGER tr_orders_updated_at
    BEFORE UPDATE ON public.table_orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- DATOS DEMO: POLLOS MARIO � Restaurante NFC con Mesas Inteligentes
-- (Se insertan solo si no existen)
-- ==============================================================================

DO $$
DECLARE
    v_org_id UUID := 'b0000000-0000-0000-0000-000000000099'::UUID;
    v_cat_entradas UUID := 'c1000000-0000-0000-0000-000000000001'::UUID;
    v_cat_fuertes UUID := 'c1000000-0000-0000-0000-000000000002'::UUID;
    v_cat_bebidas UUID := 'c1000000-0000-0000-0000-000000000003'::UUID;
    v_cat_postres UUID := 'c1000000-0000-0000-0000-000000000004'::UUID;
BEGIN
    -- Nota: En producci�n estas semillas se insertan v�a Supabase Studio o CLI.
    -- En modo demo, los datos viven en localStorage (lib/data/demo-data.ts).
    NULL;
END $$;
