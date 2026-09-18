-- ==============================================================================
-- PROCONNECT: SEGURIDAD ROW LEVEL SECURITY (RLS) & MULTI-TENANCY
-- ==============================================================================
-- Este script activa el aislamiento total de tarjetas y datos por usuario y empresa.
-- Ejecutar en el SQL Editor de tu proyecto Supabase:
-- https://supabase.com/dashboard/project/cmbaglbehyuptaohdhhl/sql/new
-- ==============================================================================

-- 1. ACTIVAR RLS EN TODAS LAS TABLAS SENSIBLES
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogs_multimedia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 2. FUNCIONES HELPER DE SEGURIDAD (SECURITY DEFINER)
-- Verifica si el usuario actual es Superadmin (ej: Luigi Colonico)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() 
          AND (role = 'superadmin' OR LOWER(email) = 'luigicolonico@gmail.com')
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verifica si el usuario actual es Administrador Corporativo de la organización
CREATE OR REPLACE FUNCTION public.is_org_admin_for_card(card_org_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
          AND role = 'org_admin'
          AND organization_id IS NOT NULL
          AND organization_id = card_org_id
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. POLÍTICAS PARA LA TABLA CARDS (MULTI-TENANCY AISLADO)
DROP POLICY IF EXISTS "cards_select_isolated" ON public.cards;
DROP POLICY IF EXISTS "cards_insert_isolated" ON public.cards;
DROP POLICY IF EXISTS "cards_update_isolated" ON public.cards;
DROP POLICY IF EXISTS "cards_delete_isolated" ON public.cards;
DROP POLICY IF EXISTS "Lectura pública de tarjetas activas" ON public.cards;
DROP POLICY IF EXISTS "Gestión de tarjetas por dueño o admin" ON public.cards;

-- SELECT: El usuario solo puede ver sus propias tarjetas, o las de su empresa si es Admin Corporativo, o todas si es Superadmin
CREATE POLICY "cards_select_isolated"
    ON public.cards FOR SELECT
    USING (
        user_id = auth.uid() 
        OR (organization_id IS NOT NULL AND public.is_org_admin_for_card(organization_id))
        OR public.is_superadmin()
    );

-- INSERT: Solo puede insertar tarjetas asociadas a su propio auth.uid(), o un Admin Corporativo para su empresa
CREATE POLICY "cards_insert_isolated"
    ON public.cards FOR INSERT
    WITH CHECK (
        user_id = auth.uid() 
        OR (organization_id IS NOT NULL AND public.is_org_admin_for_card(organization_id))
        OR public.is_superadmin()
    );

-- UPDATE: Solo el dueño de la tarjeta, el Admin Corporativo de esa empresa, o el Superadmin
CREATE POLICY "cards_update_isolated"
    ON public.cards FOR UPDATE
    USING (
        user_id = auth.uid() 
        OR (organization_id IS NOT NULL AND public.is_org_admin_for_card(organization_id))
        OR public.is_superadmin()
    )
    WITH CHECK (
        user_id = auth.uid() 
        OR (organization_id IS NOT NULL AND public.is_org_admin_for_card(organization_id))
        OR public.is_superadmin()
    );

-- DELETE: Solo el dueño de la tarjeta, el Admin Corporativo de esa empresa, o el Superadmin
CREATE POLICY "cards_delete_isolated"
    ON public.cards FOR DELETE
    USING (
        user_id = auth.uid() 
        OR (organization_id IS NOT NULL AND public.is_org_admin_for_card(organization_id))
        OR public.is_superadmin()
    );

-- 4. FUNCIÓN SEGURA PARA LECTURA PÚBLICA DE TARJETAS (PÁGINAS /c/[slug] Y CHIPS NFC)
-- Esta función permite a visitantes anónimos ver una tarjeta por su slug sin dar acceso a SELECT general de la tabla cards
CREATE OR REPLACE FUNCTION public.get_public_card(p_slug TEXT)
RETURNS JSONB AS $$
DECLARE
    v_card JSONB;
    v_links JSONB;
    v_multimedia JSONB;
    v_card_id UUID;
BEGIN
    SELECT id INTO v_card_id
    FROM public.cards
    WHERE LOWER(TRIM(slug)) = LOWER(TRIM(p_slug))
      AND is_active = true
    LIMIT 1;

    IF v_card_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT to_jsonb(c) INTO v_card
    FROM public.cards c
    WHERE c.id = v_card_id;

    SELECT COALESCE(jsonb_agg(to_jsonb(l) ORDER BY l.position_order ASC), '[]'::jsonb)
    INTO v_links
    FROM public.card_links l
    WHERE l.card_id = v_card_id AND l.is_active = true;

    SELECT COALESCE(jsonb_agg(to_jsonb(m) ORDER BY m.position_order ASC), '[]'::jsonb)
    INTO v_multimedia
    FROM public.catalogs_multimedia m
    WHERE m.card_id = v_card_id;

    RETURN v_card || jsonb_build_object('links', v_links, 'multimedia', v_multimedia);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permiso de ejecución pública para visitantes de tarjetas NFC
GRANT EXECUTE ON FUNCTION public.get_public_card(TEXT) TO anon, authenticated, service_role;

-- 5. POLÍTICAS PARA ENLACES (CARD_LINKS)
DROP POLICY IF EXISTS "card_links_management" ON public.card_links;
CREATE POLICY "card_links_management"
    ON public.card_links FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.cards
            WHERE cards.id = card_links.card_id
              AND (
                  cards.user_id = auth.uid() 
                  OR (cards.organization_id IS NOT NULL AND public.is_org_admin_for_card(cards.organization_id))
                  OR public.is_superadmin()
              )
        )
    );

-- 6. POLÍTICAS PARA USUARIOS (USERS)
DROP POLICY IF EXISTS "users_self_management" ON public.users;
CREATE POLICY "users_self_management"
    ON public.users FOR ALL
    USING (
        id = auth.uid() 
        OR public.is_superadmin()
    );

-- 7. POLÍTICAS PARA ORGANIZACIONES (ORGANIZATIONS)
DROP POLICY IF EXISTS "orgs_read_and_admin" ON public.organizations;
CREATE POLICY "orgs_read_and_admin"
    ON public.organizations FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "orgs_update_admin" ON public.organizations;
CREATE POLICY "orgs_update_admin"
    ON public.organizations FOR UPDATE
    USING (
        id IN (SELECT organization_id FROM public.users WHERE id = auth.uid() AND role = 'org_admin')
        OR public.is_superadmin()
    );
