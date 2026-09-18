/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * COMPRESOR DE IMÁGENES CLIENT-SIDE ULTRARRÁPIDO
 * Reduce fotos de smartphones de 8-15 MB a ~80-160 KB en milisegundos mediante Canvas nativo
 * sin dependencias externas pesadas, preservando la máxima nitidez visual.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // Si no es imagen o estamos en entorno SSR / Node, retornar el archivo original
  if (typeof window === 'undefined' || !file || !file.type.startsWith('image/')) {
    return file;
  }

  // Si es un SVG, no se debe comprimir con canvas
  if (file.type.includes('svg')) {
    return file;
  }

  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise<File>((resolve) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular escalado proporcional
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Crear canvas offscreen
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Rellenar fondo blanco por si la imagen tiene transparencia y se exporta a JPEG
        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        // Suavizado bicúbico de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Si el blob resultante es más pesado que el original, mantener el original
            if (blob.size > file.size) {
              resolve(file);
              return;
            }

            const cleanBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const extension = mimeType === 'image/webp' ? '.webp' : '.jpg';
            const optimizedFile = new File([blob], `${cleanBaseName}${extension}`, {
              type: mimeType,
              lastModified: Date.now(),
            });

            resolve(optimizedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        resolve(file);
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}
