import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DEMO_CARDS } from '@/lib/data/demo-data';
import { FullCard } from '@/lib/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'cards.json');

// In-memory fallback
let inMemoryCards: FullCard[] = [...DEMO_CARDS];

function loadServerCards(): FullCard[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8').replace(/^\uFEFF/, '').trim();
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const map = new Map<string, FullCard>();
        DEMO_CARDS.forEach((c) => map.set(c.slug.toLowerCase().trim(), c));
        parsed.forEach((c: FullCard) => {
          if (c && c.slug) map.set(c.slug.toLowerCase().trim(), c);
        });
        inMemoryCards = Array.from(map.values());
        return inMemoryCards;
      }
    }
  } catch (err) {
    console.error('Error reading cards file:', err);
  }
  return inMemoryCards;
}

function persistServerCards(cards: FullCard[]) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(cards, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing cards file:', err);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug')?.toLowerCase().trim();

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
    const card: FullCard = body.card || body;

    if (!card || !card.slug) {
      return NextResponse.json({ success: false, error: 'Datos de tarjeta inválidos' }, { status: 400 });
    }

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

    return NextResponse.json({ success: true, card });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error al guardar tarjeta' }, { status: 500 });
  }
}
