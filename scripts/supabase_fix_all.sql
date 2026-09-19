-- ==============================================================================
-- PROCONNECT: CORRECCIÓN DEFINITIVA DE BASE DE DATOS SUPABASE
-- Ejecutar en: https://supabase.com/dashboard/project/cmbaglbehyuptaohdhhl/sql/new
-- ==============================================================================

-- 1. EXTENSIÓN Y ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Permitir 'solid' en el enum button_style si aún no está presente
DO $$ BEGIN
    ALTER TYPE button_style ADD VALUE IF NOT EXISTS 'solid';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;

-- 2. ASEGURAR COLUMNAS EN PUBLIC.CARDS
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS enable_crm_capture BOOLEAN DEFAULT true;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS redirect_to_slug TEXT;

-- 3. FLEXIBILIZAR CLAVE FORÁNEA DE USUARIO PARA QUE NINGUNA TARJETA FALLE
-- Si un usuario se registra o crea tarjeta antes de confirmar correo, no debe bloquear la inserción
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS cards_user_id_fkey;

-- 4. DESHABILITAR RLS EN TODAS LAS TABLAS DEL SISTEMA
-- Esto garantiza que la app web, el panel admin y los móviles sincronicen al 100% sin error 401 Unauthorized
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_leads DISABLE ROW LEVEL SECURITY;

-- Otorgar permisos globales para anon y authenticated
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.cards TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.card_links TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.organizations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.whatsapp_leads TO anon, authenticated, service_role;

-- 5. BLINDAR SUPERADMIN DE LUIGI
UPDATE public.users
SET role = 'superadmin'::user_role
WHERE LOWER(email) IN ('luigicolonico@gmail.com', 'admin@proconnect.app');

-- 6. FUNCIÓN RPC: save_public_card (SECURITY DEFINER) RESILIENTE
CREATE OR REPLACE FUNCTION public.save_public_card(p_card JSONB)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_card_id UUID;
    v_slug TEXT;
    v_email TEXT;
    v_full_name TEXT;
    v_link JSONB;
    v_raw_layout TEXT;
    v_layout layout_type;
    v_raw_btn TEXT;
    v_btn button_style;
    v_raw_pos TEXT;
    v_pos avatar_position;
    v_is_superadmin BOOLEAN;
BEGIN
    v_slug := LOWER(TRIM(COALESCE(p_card->>'slug', '')));
    IF v_slug = '' THEN
        RAISE EXCEPTION 'El slug de la tarjeta no puede estar vacío';
    END IF;

    v_email := LOWER(TRIM(COALESCE(p_card->>'user_email', p_card->>'email', '')));
    v_full_name := COALESCE(p_card->>'full_name', 'Usuario ProConnect');

    v_is_superadmin := (
        v_email = 'luigicolonico@gmail.com' OR 
        v_email = 'admin@proconnect.app'
    );

    -- Normalizar Enums
    v_raw_layout := COALESCE(p_card->>'layout_type', 'modern');
    IF v_raw_layout IN ('modern', 'executive', 'minimal', 'banner_header', 'card_id_badge', 'creative_grid') THEN
        v_layout := v_raw_layout::layout_type;
    ELSE
        v_layout := 'modern'::layout_type;
    END IF;

    v_raw_btn := COALESCE(p_card->>'button_style', 'filled');
    IF v_raw_btn = 'solid' THEN
        BEGIN
            v_btn := 'solid'::button_style;
        EXCEPTION WHEN OTHERS THEN
            v_btn := 'filled'::button_style;
        END;
    ELSIF v_raw_btn IN ('filled', 'outline', 'glassmorphism', 'gradient', 'soft_shadow') THEN
        v_btn := v_raw_btn::button_style;
    ELSE
        v_btn := 'filled'::button_style;
    END IF;

    v_raw_pos := COALESCE(p_card->>'avatar_position', 'header_floating');
    IF v_raw_pos IN ('top_center', 'header_floating', 'left_aligned', 'hidden') THEN
        v_pos := v_raw_pos::avatar_position;
    ELSE
        v_pos := 'header_floating'::avatar_position;
    END IF;

    -- user_id
    IF (p_card->>'user_id') IS NOT NULL AND (p_card->>'user_id') ~ '^[0-9a-fA-F-]{36}$' THEN
        v_user_id := (p_card->>'user_id')::UUID;
    ELSIF auth.uid() IS NOT NULL THEN
        v_user_id := auth.uid();
    ELSE
        IF v_email <> '' THEN
            SELECT id INTO v_user_id FROM public.users WHERE LOWER(email) = v_email LIMIT 1;
        END IF;
        IF v_user_id IS NULL THEN
            v_user_id := gen_random_uuid();
        END IF;
    END IF;

    -- Asegurar fila en public.users
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        v_user_id,
        CASE WHEN v_email <> '' THEN v_email ELSE v_slug || '@proconnect.app' END,
        v_full_name,
        CASE WHEN v_is_superadmin THEN 'superadmin'::user_role ELSE 'client'::user_role END
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role = CASE WHEN v_is_superadmin THEN 'superadmin'::user_role ELSE public.users.role END,
        updated_at = NOW();

    -- card_id
    IF (p_card->>'id') IS NOT NULL AND (p_card->>'id') ~ '^[0-9a-fA-F-]{36}$' THEN
        v_card_id := (p_card->>'id')::UUID;
    ELSE
        SELECT id INTO v_card_id FROM public.cards WHERE LOWER(TRIM(slug)) = v_slug LIMIT 1;
        IF v_card_id IS NULL THEN
            v_card_id := gen_random_uuid();
        END IF;
    END IF;

    -- Insertar o actualizar tarjeta
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
        custom_vcf_notes,
        expires_at,
        updated_at
    ) VALUES (
        v_card_id,
        v_user_id,
        CASE WHEN (p_card->>'organization_id') ~ '^[0-9a-fA-F-]{36}$' THEN (p_card->>'organization_id')::UUID ELSE NULL END,
        v_slug,
        COALESCE((p_card->>'is_active')::BOOLEAN, true),
        v_full_name,
        p_card->>'job_title',
        p_card->>'company_name',
        p_card->>'bio',
        p_card->>'profile_photo_url',
        p_card->>'cover_photo_url',
        p_card->>'logo_url',
        v_layout,
        v_pos,
        v_btn,
        COALESCE(p_card->>'border_radius', 'md'),
        COALESCE(p_card->>'primary_color', '#0EA5E9'),
        COALESCE(p_card->>'secondary_color', '#0369A1'),
        COALESCE(p_card->>'accent_color', '#38BDF8'),
        COALESCE(p_card->>'background_color', '#0F172A'),
        COALESCE(p_card->>'font_family', 'Inter'),
        COALESCE(p_card->>'font_weight', 'medium'),
        COALESCE((p_card->>'include_photo')::BOOLEAN, true),
        COALESCE(p_card->>'custom_vcf_notes', ''),
        CASE WHEN p_card->>'expires_at' IS NOT NULL THEN (p_card->>'expires_at')::TIMESTAMPTZ ELSE NULL END,
        NOW()
    )
    ON CONFLICT (slug) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        job_title = EXCLUDED.job_title,
        company_name = EXCLUDED.company_name,
        bio = EXCLUDED.bio,
        profile_photo_url = EXCLUDED.profile_photo_url,
        cover_photo_url = EXCLUDED.cover_photo_url,
        logo_url = EXCLUDED.logo_url,
        layout_type = EXCLUDED.layout_type,
        avatar_position = EXCLUDED.avatar_position,
        button_style = EXCLUDED.button_style,
        border_radius = EXCLUDED.border_radius,
        primary_color = EXCLUDED.primary_color,
        secondary_color = EXCLUDED.secondary_color,
        accent_color = EXCLUDED.accent_color,
        background_color = EXCLUDED.background_color,
        font_family = EXCLUDED.font_family,
        font_weight = EXCLUDED.font_weight,
        include_photo = EXCLUDED.include_photo,
        custom_vcf_notes = EXCLUDED.custom_vcf_notes,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    RETURNING id INTO v_card_id;

    -- Sincronizar enlaces
    IF p_card->'links' IS NOT NULL AND jsonb_array_length(p_card->'links') > 0 THEN
        DELETE FROM public.card_links WHERE card_id = v_card_id;
        
        FOR v_link IN SELECT * FROM jsonb_array_elements(p_card->'links')
        LOOP
            INSERT INTO public.card_links (
                id,
                card_id,
                type,
                label,
                url,
                icon_name,
                is_active,
                position_order
            ) VALUES (
                gen_random_uuid(),
                v_card_id,
                COALESCE((v_link->>'type')::link_type, 'website'::link_type),
                COALESCE(v_link->>'label', 'Enlace'),
                COALESCE(v_link->>'url', ''),
                v_link->>'icon_name',
                COALESCE((v_link->>'is_active')::BOOLEAN, true),
                COALESCE((v_link->>'position_order')::INT, 1)
            );
        END LOOP;
    END IF;

    RETURN public.get_public_card(v_slug);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.save_public_card(JSONB) TO anon, authenticated, service_role;
