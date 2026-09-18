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

  // Imagen para previsualización (Foto de perfil, o portada, o fallback)
  const imageUrl =
    card.profile_photo_url && !card.profile_photo_url.startsWith('data:')
      ? card.profile_photo_url
      : card.cover_photo_url && !card.cover_photo_url.startsWith('data:')
      ? card.cover_photo_url
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800';

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
          width: 800,
          height: 800,
          alt: card.full_name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
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
