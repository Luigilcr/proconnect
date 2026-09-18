/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

'use client';

import React, { useState } from 'react';
import { CatalogMultimedia, MediaType } from '@/lib/types';
import {
  Plus,
  Trash2,
  FileText,
  Play,
  Image as ImageIcon,
  ExternalLink,
  UploadCloud,
} from 'lucide-react';

interface MultimediaManagerProps {
  items: CatalogMultimedia[];
  cardId: string;
  onChange: (updatedItems: CatalogMultimedia[]) => void;
}

export const MultimediaManager: React.FC<MultimediaManagerProps> = ({
  items,
  cardId,
  onChange,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [fileType, setFileType] = useState<MediaType>('pdf');
  const [title, setTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  const handleDelete = (id: string) => {
    const filtered = items.filter((item) => item.id !== id);
    onChange(filtered);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim()) return;

    const newItem: CatalogMultimedia = {
      id: 'media_' + Date.now(),
      card_id: cardId,
      file_type: fileType,
      title: title.trim(),
      file_url: fileUrl.trim(),
      thumbnail_url: thumbnailUrl.trim() || null,
      position_order: items.length + 1,
      created_at: new Date().toISOString(),
    };

    onChange([...items, newItem]);
    setIsAdding(false);
    setTitle('');
    setFileUrl('');
    setThumbnailUrl('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Cargador y Gestor Multimedia
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Añade catálogos PDF, dossiers corporativos, videos de demostración y galerías de fotos.
          </p>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Archivo</span>
          </button>
        )}
      </div>

      {/* Formulario de Adición */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-3"
        >
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
              Nuevo Contenido Multimedia
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Archivo
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as MediaType)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="pdf">Documento / Catálogo PDF</option>
                <option value="video_embed">Video Embebido (YouTube, Vimeo, MP4)</option>
                <option value="image">Fotografía / Galería de Imagen</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Título del Archivo *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Catálogo de Productos y Precios 2026"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              URL del Archivo o Video *
            </label>
            <input
              type="url"
              required
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder={
                fileType === 'pdf'
                  ? 'https://ejemplo.com/catalogo.pdf'
                  : fileType === 'video_embed'
                  ? 'https://www.youtube.com/watch?v=...'
                  : 'https://images.unsplash.com/...'
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              URL de Miniatura de Portada (Opcional)
            </label>
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://ejemplo.com/portada-miniatura.jpg"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-sm flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Guardar Contenido
            </button>
          </div>
        </form>
      )}

      {/* Lista de Contenidos */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <UploadCloud className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              No hay catálogos o archivos multimedia registrados.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      {item.file_type === 'pdf' && (
                        <FileText className="w-5 h-5 text-red-500" />
                      )}
                      {item.file_type === 'video_embed' && (
                        <Play className="w-5 h-5 text-sky-500" />
                      )}
                      {item.file_type === 'image' && (
                        <ImageIcon className="w-5 h-5 text-emerald-500" />
                      )}
                    </>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h5>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {item.file_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {item.file_url}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title="Abrir enlace"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 transition-colors"
                  title="Eliminar elemento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
