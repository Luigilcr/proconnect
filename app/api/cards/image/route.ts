import { NextRequest, NextResponse } from 'next/server';
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

  // 1. Consultar vía RPC (bypass seguro de RLS para lectura pública)
  if (isSupabaseEnabled && supabase) {
    try {
      const { data } = await supabase.rpc('get_public_card', { p_slug: slug });
      if (data) card = data;
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

  // Si es URL externa o relativa ya servida por CDN
  if (rawImg.startsWith('http://') || rawImg.startsWith('https://')) {
    return NextResponse.redirect(rawImg);
  }

  if (rawImg.startsWith('/')) {
    return NextResponse.redirect(`https://proconnect-pearl.vercel.app${rawImg}`);
  }

  // Si es Base64 (ej: fotos previas a la compresión en canvas)
  if (rawImg.startsWith('data:')) {
    const commaIndex = rawImg.indexOf(',');
    if (commaIndex > -1) {
      const mimeMatch = rawImg.substring(0, commaIndex).match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const base64Data = rawImg.substring(commaIndex + 1);
      const buffer = Buffer.from(base64Data, 'base64');
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200',
        },
      });
    }
  }

  return NextResponse.redirect(
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800'
  );
}
