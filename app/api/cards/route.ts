import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DEMO_CARDS } from '@/lib/data/demo-data';
import { FullCard } from '@/lib/types';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { normalizeCardForDatabase } from '@/lib/db-normalize';

import { DEMO_CARD_SLUGS } from '@/lib/data/card-store';

const DATA_FILE = path.join(process.cwd(), 'data', 'cards.json');

// In-memory fallback and deleted cards blacklist
let inMemoryCards: FullCard[] = [];
const deletedCardsIds = new Set<string>();
const deletedCardsSlugs = new Set<string>();

function loadServerCards(): FullCard[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8').replace(/^\uFEFF/, '').trim();
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemoryCards = parsed.filter(
          (c) =>
            c &&
            c.slug &&
            !DEMO_CARD_SLUGS.has(c.slug.toLowerCase().trim()) &&
            !deletedCardsIds.has(c.id) &&
            !deletedCardsSlugs.has(c.slug.toLowerCase().trim())
        );
        return inMemoryCards;
      }
    }
  } catch (err) {
    console.error('Error reading cards file:', err);
  }
  return inMemoryCards.filter(
    (c) =>
      c &&
      c.slug &&
      !DEMO_CARD_SLUGS.has(c.slug.toLowerCase().trim()) &&
      !deletedCardsIds.has(c.id) &&
      !deletedCardsSlugs.has(c.slug.toLowerCase().trim())
  );
}

function persistServerCards(cards: FullCard[]) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(cards, null, 2), 'utf-8');
  } catch (err) {
    // Vercel serverless filesystem is read-only at runtime; in-memory cache handles this
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug')?.toLowerCase().trim();

  // 1. Intentar consultar Supabase en tiempo real si está activo
  if (slug && isSupabaseEnabled && supabase) {
    try {
      const { data: sbCard, error } = await supabase
        .from('cards')
        .select('*, links:card_links(*)')
        .ilike('slug', slug)
        .maybeSingle();

      if (!error && sbCard) {
        return NextResponse.json({ success: true, card: sbCard });
      }

      // Fallback a RPC get_public_card con SECURITY DEFINER
      const { data: rpcCard } = await supabase.rpc('get_public_card', {
        p_slug: slug,
      });
      if (rpcCard) {
        return NextResponse.json({ success: true, card: rpcCard });
      }
    } catch (err) {
      console.warn('Error querying Supabase in /api/cards:', err);
    }
  }

  // 1.1 Si no se pide un slug específico y Supabase está habilitado, traer todas las tarjetas reales
  if (!slug && isSupabaseEnabled && supabase) {
    try {
      const { data: sbCards, error } = await supabase
        .from('cards')
        .select('*, links:card_links(*)')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(sbCards) && sbCards.length > 0) {
        return NextResponse.json({ success: true, cards: sbCards });
      }
    } catch (err) {
      console.warn('Error fetching all cards from Supabase:', err);
    }
  }

  const cards = loadServerCards();

  if (slug) {
    const card = cards.find((c) => c.slug.toLowerCase().trim() === slug);
    if (card) {
      return NextResponse.json({ success: true, card });
    }
    return NextResponse.json({ success: false, error: 'Tarjeta no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ success: true, cards });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawCard: FullCard = body.card || body;

    if (!rawCard || !rawCard.slug) {
      return NextResponse.json({ success: false, error: 'Datos de tarjeta inválidos' }, { status: 400 });
    }

    const card = normalizeCardForDatabase(rawCard, rawCard.user_id, (rawCard as any).user_email || (rawCard as any).email);

    const cards = loadServerCards();
    const slugNorm = card.slug.toLowerCase().trim();
    const idx = cards.findIndex((c) => c.slug.toLowerCase().trim() === slugNorm);

    if (idx >= 0) {
      cards[idx] = { ...cards[idx], ...card, updated_at: new Date().toISOString() };
    } else {
      cards.unshift({
        ...card,
        created_at: card.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    inMemoryCards = cards;
    persistServerCards(cards);

    // 1. Sincronizar en Supabase mediante RPC de alta seguridad (bypassa RLS) o cliente admin
    if (isSupabaseEnabled && supabase) {
      try {
        const { data: rpcCard, error: rpcErr } = await supabase.rpc('save_public_card', {
          p_card: card,
        });

        if (!rpcErr && rpcCard) {
          return NextResponse.json({ success: true, card: rpcCard });
        }

        // Fallback a upsert directo con datos normalizados
        await supabase.from('cards').upsert({
          id: card.id,
          user_id: card.user_id,
          organization_id: card.organization_id || null,
          slug: card.slug,
          full_name: card.full_name,
          job_title: card.job_title,
          company_name: card.company_name,
          bio: card.bio,
          profile_photo_url: card.profile_photo_url,
          cover_photo_url: card.cover_photo_url,
          logo_url: card.logo_url,
          layout_type: card.layout_type,
          avatar_position: card.avatar_position,
          button_style: card.button_style,
          border_radius: card.border_radius,
          primary_color: card.primary_color,
          secondary_color: card.secondary_color,
          accent_color: card.accent_color,
          background_color: card.background_color,
          font_family: card.font_family,
          font_weight: card.font_weight,
          include_photo: card.include_photo,
          custom_vcf_notes: card.custom_vcf_notes,
          is_active: card.is_active,
          updated_at: new Date().toISOString(),
        });

        if (Array.isArray(card.links) && card.links.length > 0) {
          await supabase.from('card_links').delete().eq('card_id', card.id);
          await supabase.from('card_links').insert(card.links);
        }
      } catch (sbErr) {
        console.warn('Error sincronizando con Supabase en POST /api/cards:', sbErr);
      }
    }

    return NextResponse.json({ success: true, card });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error al guardar tarjeta' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('id');
    const slug = searchParams.get('slug')?.toLowerCase().trim();

    if (!cardId && !slug) {
      return NextResponse.json({ success: false, error: 'Se requiere id o slug' }, { status: 400 });
    }

    if (cardId) deletedCardsIds.add(cardId);
    if (slug) deletedCardsSlugs.add(slug);

    let cards = loadServerCards();
    cards = cards.filter((c) => {
      if (cardId && c.id === cardId) return false;
      if (slug && c.slug?.toLowerCase().trim() === slug) return false;
      return true;
    });

    inMemoryCards = cards;
    persistServerCards(cards);

    // Eliminar también en Supabase
    if (isSupabaseEnabled && supabase) {
      try {
        if (cardId) {
          await supabase.from('card_links').delete().eq('card_id', cardId);
          await supabase.from('cards').delete().eq('id', cardId);
        }
        if (slug) {
          const { data: cData } = await supabase.from('cards').select('id').ilike('slug', slug).maybeSingle();
          if (cData?.id) {
            await supabase.from('card_links').delete().eq('card_id', cData.id);
            await supabase.from('cards').delete().eq('id', cData.id);
          }
        }
      } catch (sbErr) {
        console.warn('Error eliminando en Supabase en DELETE /api/cards:', sbErr);
      }
    }

    return NextResponse.json({ success: true, message: 'Tarjeta eliminada exitosamente' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error al eliminar tarjeta' }, { status: 500 });
  }
}
