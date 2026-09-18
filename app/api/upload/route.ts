/**
 * © ProConnect. Todos los derechos reservados.
 * API Endpoint para subida física de imágenes al servidor local/cloud.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se subió ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Carpeta física en disco dentro del proyecto
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Nombre limpio y único con marca de tiempo
    const cleanOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `avatar-${Date.now()}-${cleanOriginalName}`;
    const filePath = path.join(uploadDir, filename);

    // Escribir archivo físicamente en disco
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
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
