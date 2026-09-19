/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * SERVIDOR DINÁMICO & OPEN GRAPH METADATA (/c/[slug])
 * Genera previsualización enriquecida con foto, cargo y descripción para WhatsApp, Telegram,
 * LinkedIn, iMessage y redes sociales, delegando la interactividad a PublicCardClient.
 */

import { Metadata } from 'next';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { getCardBySlug } from '@/lib/data/card-store';
import { FullCard } from '@/lib/types';
import { PublicCardClient } from '@/components/card/PublicCardClient';

interface PageProps {
  params: {
    slug: string;
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getCardForServer(slug: string): Promise<FullCard | null> {
  const cleanSlug = decodeURIComponent(slug || '').toLowerCase().trim();
  if (!cleanSlug) return null;

  // 1. Consultar Supabase en tiempo real
  if (isSupabaseEnabled && supabase) {
    try {
      const { data: dbCard, error } = await supabase
        .from('cards')
        .select('*, links:card_links(*)')
        .ilike('slug', cleanSlug)
        .maybeSingle();

      if (!error && dbCard) {
        return dbCard;
      }

      // Fallback a RPC con Security Definer (necesario cuando RLS está activo)
      const { data: rpcCard } = await supabase.rpc('get_public_card', {
        p_slug: cleanSlug,
      });
      if (rpcCard) {
        return rpcCard;
      }
    } catch (e) {
      console.warn('Error en getCardForServer Supabase:', e);
    }
  }

  // 2. Fallback a tienda local / demo data
  return getCardBySlug(cleanSlug) || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const card = await getCardForServer(params.slug);

  if (!card) {
    return {
      title: 'Tarjeta Digital ProConnect',
      description: 'Conéctate al instante con tarjetas inteligentes NFC y perfiles digitales interactivos.',
    };
  }

  const title = `${card.full_name} | Tarjeta Digital ProConnect`;
  const companyPart = card.company_name ? ` en ${card.company_name}` : '';
  const titlePart = card.job_title ? `${card.job_title}${companyPart}. ` : '';
  const description = `${titlePart}${card.bio || 'Toca para guardar mi contacto en tu teléfono o comunicarte conmigo al instante.'}`;
  const publicUrl = `https://proconnect-pearl.vercel.app/c/${card.slug}`;

  // Imagen para previsualización en WhatsApp / redes
  let imageUrl = `https://proconnect-pearl.vercel.app/api/cards/image?slug=${encodeURIComponent(card.slug)}`;
  if (card.profile_photo_url && (card.profile_photo_url.startsWith('http://') || card.profile_photo_url.startsWith('https://'))) {
    imageUrl = card.profile_photo_url;
  }

  return {
    title,
    description,
    alternates: {
      canonical: publicUrl,
    },
    openGraph: {
      title,
      description,
      url: publicUrl,
      siteName: 'ProConnect - Tarjetas Inteligentes NFC',
      type: 'profile',
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          type: 'image/jpeg',
          width: 600,
          height: 600,
          alt: card.full_name,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PublicCardPage({ params }: PageProps) {
  const card = await getCardForServer(params.slug);

  return <PublicCardClient slug={params.slug} initialCard={card} />;
}
