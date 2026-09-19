import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { getCardBySlug } from '@/lib/data/card-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug')?.toLowerCase().trim();

  if (!slug) {
    return NextResponse.redirect(
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800'
    );
  }

  let card: any = null;

  // 1. Consultar vía RPC o select directo (bypass de RLS para lectura pública de imagen)
  if (isSupabaseEnabled && supabase) {
    try {
      const { data } = await supabase.rpc('get_public_card', { p_slug: slug });
      if (data) card = data;

      if (!card) {
        const { data: directCard } = await supabase
          .from('cards')
          .select('profile_photo_url, cover_photo_url')
          .ilike('slug', slug)
          .maybeSingle();
        if (directCard) card = directCard;
      }
    } catch (e) {
      console.warn('Error fetching card in /api/cards/image:', e);
    }
  }

  // 2. Fallback a tienda local / demo data
  if (!card) {
    card = getCardBySlug(slug);
  }

  const rawImg = card?.profile_photo_url || card?.cover_photo_url;

  if (!rawImg) {
    return NextResponse.redirect(
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800'
    );
  }

  // Si es Base64 (procesar con sharp para dejarla en ~28KB garantizado para WhatsApp)
  if (rawImg.startsWith('data:')) {
    const commaIndex = rawImg.indexOf(',');
    if (commaIndex > -1) {
      try {
        const base64Data = rawImg.substring(commaIndex + 1);
        const rawBuffer = Buffer.from(base64Data, 'base64');
        const compressed = await sharp(rawBuffer)
          .resize(600, 600, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();

        return new NextResponse(compressed, {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Length': String(compressed.length),
            'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200',
          },
        });
      } catch (sharpErr) {
        console.warn('Error compressing with sharp:', sharpErr);
      }
    }
  }

  // Si es URL externa o relativa ya servida por CDN
  if (rawImg.startsWith('http://') || rawImg.startsWith('https://')) {
    return NextResponse.redirect(rawImg);
  }

  if (rawImg.startsWith('/')) {
    return NextResponse.redirect(`https://proconnect-pearl.vercel.app${rawImg}`);
  }

  return NextResponse.redirect(
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800'
  );
}
