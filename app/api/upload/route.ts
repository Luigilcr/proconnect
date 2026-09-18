/**
 * © ProConnect. Todos los derechos reservados.
 * API Endpoint para subida física de imágenes al servidor local/cloud.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se subió ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'image/jpeg';
    const cleanOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `asset-${Date.now()}-${cleanOriginalName}`;

    // 1. Intentar subir a Supabase Storage (si está configurado)
    if (isSupabaseEnabled && supabase) {
      try {
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('card-assets')
          .upload(filename, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadErr && uploadData) {
          const { data: publicData } = supabase.storage
            .from('card-assets')
            .getPublicUrl(filename);

          if (publicData?.publicUrl) {
            return NextResponse.json({
              success: true,
              url: publicData.publicUrl,
              filename: filename,
            });
          }
        }
      } catch (sbErr) {
        console.warn('Supabase storage fallback:', sbErr);
      }
    }

    // 2. Fallback resiliente para Vercel Serverless (Data URL Base64)
    // Permite que la imagen sea 100% permanente, no dependa del disco y cargue en cualquier teléfono
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // 3. Opcional: escribir localmente si estamos en entorno Node de desarrollo
    try {
      if (process.env.NODE_ENV !== 'production') {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        fs.writeFileSync(path.join(uploadDir, filename), buffer);
      }
    } catch {}

    return NextResponse.json({
      success: true,
      url: dataUrl,
      filename: filename,
    });
  } catch (error: any) {
    console.error('Error al guardar archivo:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al guardar la imagen' },
      { status: 500 }
    );
  }
}
