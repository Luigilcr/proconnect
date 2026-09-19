/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * DIRECTORIO CORPORATIVO PÚBLICO B2B (/org/[slug])
 * Muestra el perfil institucional de la empresa, enlaces oficiales,
 * buscador interactivo de colaboradores y acceso directo a sus tarjetas inteligentes.
 */

import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { getOrganizationBySlug, getCardsByOrganizationId } from '@/lib/data/card-store';
import { Organization, FullCard } from '@/lib/types';
import { OrgDirectoryClient } from './OrgDirectoryClient';

interface PageProps {
  params: {
    slug: string;
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getOrgData(slug: string): Promise<{ org: Organization; cards: FullCard[] } | null> {
  const cleanSlug = decodeURIComponent(slug || '').toLowerCase().trim();
  if (!cleanSlug) return null;

  let org: Organization | null = null;
  let cards: FullCard[] = [];

  // 1. Consultar Supabase
  if (isSupabaseEnabled && supabase) {
    try {
      const { data: dbOrg, error: orgErr } = await supabase
        .from('organizations')
        .select('*')
        .ilike('slug', cleanSlug)
        .maybeSingle();

      if (!orgErr && dbOrg) {
        org = dbOrg;
        const { data: dbCards, error: cardErr } = await supabase
          .from('cards')
          .select('*, links:card_links(*)')
          .eq('organization_id', dbOrg.id)
          .eq('is_active', true)
          .order('full_name', { ascending: true });

        if (!cardErr && dbCards) {
          cards = dbCards;
        }
      }
    } catch (e) {
      console.warn('Error fetching org data from Supabase:', e);
    }
  }

  // 2. Fallback a tienda local
  if (!org) {
    org = getOrganizationBySlug(cleanSlug);
    if (org) {
      cards = getCardsByOrganizationId(org.id).filter((c) => c.is_active);
    }
  }

  if (!org) return null;

  return { org, cards };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getOrgData(params.slug);

  if (!data) {
    return {
      title: 'Directorio Corporativo | ProConnect',
      description: 'Directorio oficial de colaboradores y tarjetas digitales verificadas.',
    };
  }

  const { org, cards } = data;
  const title = `${org.name} | Directorio Oficial de Colaboradores`;
  const description = org.description || `Conoce al equipo profesional de ${org.name}. Accede a sus credenciales digitales verificadas y comunícate directamente.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'ProConnect Enterprise',
      images: org.logo_url ? [{ url: org.logo_url }] : [],
    },
  };
}

export default async function OrgDirectoryPage({ params }: PageProps) {
  const data = await getOrgData(params.slug);

  if (!data) {
    notFound();
  }

  return <OrgDirectoryClient initialOrg={data.org} initialCards={data.cards} />;
}
