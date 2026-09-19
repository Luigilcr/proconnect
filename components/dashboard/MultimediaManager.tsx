/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * GESTOR Y CARGADOR MULTIMEDIA DIRECTO
 * Permite subir archivos físicos (videos MP4 de 10-30s, catálogos PDF, fotos)
 * o vincular enlaces externos (YouTube, Vimeo).
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
  Loader2,
  Video,
  CheckCircle2,
  X,
  FileUp,
  Film,
} from 'lucide-react';

interface MultimediaManagerProps {
  items: CatalogMultimedia[];
  cardId?: string;
  onChange: (updatedItems: CatalogMultimedia[]) => void;
}

export const MultimediaManager: React.FC<MultimediaManagerProps> = ({
  items = [],
  cardId = 'new_card',
  onChange,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [sourceMode, setSourceMode] = useState<'upload' | 'url'>('upload');
  const [fileType, setFileType] = useState<MediaType>('video_embed');
  const [title, setTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    const filtered = items.filter((item) => item.id !== id);
    onChange(filtered);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsUploading(true);
    setUploadProgress(`Procesando ${file.name}...`);

    // Auto-detectar tipo según el mime
    if (file.type.startsWith('video/')) {
      setFileType('video_embed');
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    } else if (file.type === 'application/pdf') {
      setFileType('pdf');
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    } else if (file.type.startsWith('image/')) {
      setFileType('image');
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress('Subiendo archivo al servidor seguro...');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setFileUrl(data.url);
        setUploadProgress('¡Archivo cargado con éxito!');
      } else {
        throw new Error(data.error || 'Error al subir archivo');
      }
    } catch (err: any) {
      console.warn('Fallback a carga local:', err);
      // Fallback a FileReader si el archivo es ligero (< 4MB)
      if (file.size < 4.5 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            setFileUrl(ev.target.result as string);
            setUploadProgress('¡Archivo listo!');
          }
        };
        reader.readAsDataURL(file);
      } else {
        alert(
          'El archivo es mayor a 4MB y el servidor no pudo almacenarlo. Te recomendamos comprimirlo o usar un video más corto (10-15s).'
        );
        setUploadProgress(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim()) return;

    const newItem: CatalogMultimedia = {
      id: 'media_' + Date.now() + '_' + Math.random().toString(36).substring(7),
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
    setSelectedFileName(null);
    setUploadProgress(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Film className="w-4 h-4 text-sky-500" />
            <span>Archivos & Multimedia (Videos MP4, Catálogos PDF, Fotos)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Muestra un video corto de presentación (ej. 10s MP4), dossier corporativo PDF o galería de fotos en tu tarjeta.
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={() => {
              setIsAdding(true);
              setSourceMode('upload');
            }}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cargar Archivo</span>
          </button>
        )}
      </div>

      {/* Formulario de Carga Directa */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="p-5 rounded-3xl bg-sky-50/60 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 space-y-4 shadow-sm animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
              <FileUp className="w-4 h-4" />
              <span>Añadir Nuevo Archivo a la Tarjeta</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setSelectedFileName(null);
                setFileUrl('');
                setTitle('');
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Selector de Modo: Subir Archivo vs Enlace Externo */}
          <div className="flex p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSourceMode('upload')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                sourceMode === 'upload'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Subir Archivo desde mi Dispositivo (MP4, PDF, Foto)</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('url')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                sourceMode === 'url'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Enlace Web / YouTube / Vimeo</span>
            </button>
          </div>

          {sourceMode === 'upload' ? (
            /* Subida de archivo físico */
            <div className="space-y-3">
              <label
                htmlFor="multimedia-file-picker"
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                  fileUrl
                    ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-sky-300 dark:border-sky-700 bg-white/70 dark:bg-slate-900/50 hover:bg-sky-50 dark:hover:bg-sky-950/50'
                }`}
              >
                <input
                  id="multimedia-file-picker"
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,application/pdf,image/*"
                  className="sr-only"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                    <span className="text-xs font-bold text-sky-700 dark:text-sky-300">
                      {uploadProgress || 'Subiendo archivo...'}
                    </span>
                  </div>
                ) : fileUrl ? (
                  <div className="flex flex-col items-center gap-2 py-1 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      {selectedFileName || '¡Archivo listo para mostrar!'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Toca para cambiar de archivo si lo deseas.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center py-2">
                    <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Toca aquí para seleccionar tu video MP4, PDF o imagen
                    </span>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      Admite MP4 (clips cortos de 10-30 seg), catálogos PDF de productos y fotos en alta resolución.
                    </p>
                  </div>
                )}
              </label>

              {/* Indicador de Tipo */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500">Tipo detectado:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 text-[10px] font-bold uppercase">
                  {fileType === 'video_embed'
                    ? '🎬 Video (MP4)'
                    : fileType === 'pdf'
                    ? '📄 Documento PDF'
                    : '🖼️ Fotografía'}
                </span>
              </div>
            </div>
          ) : (
            /* Enlace Externo */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Contenido
                </label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as MediaType)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="video_embed">Video (YouTube, Vimeo, MP4)</option>
                  <option value="pdf">Catálogo o Folleto PDF</option>
                  <option value="image">Fotografía / Galería</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL del Archivo o Video *
                </label>
                <input
                  type="url"
                  required={sourceMode === 'url'}
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder={
                    fileType === 'video_embed'
                      ? 'https://www.youtube.com/watch?v=...'
                      : fileType === 'pdf'
                      ? 'https://miempresa.com/catalogo.pdf'
                      : 'https://images.unsplash.com/...'
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Título del Archivo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Título para mostrar en tu tarjeta *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Video de Presentación • Catálogo de Precios 2026"
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-sky-200/60 dark:border-sky-800/60">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setSelectedFileName(null);
                setFileUrl('');
                setTitle('');
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!fileUrl || !title.trim() || isUploading}
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar en Tarjeta</span>
            </button>
          </div>
        </form>
      )}

      {/* Lista de Archivos Subidos */}
      <div className="space-y-2.5">
        {items.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/30">
            <Film className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Aún no has agregado videos ni catálogos a esta tarjeta.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Presiona <strong>+ Cargar Archivo</strong> para agregar un video de 10s, dossier PDF o fotos.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  {item.file_type === 'video_embed' && (
                    <Video className="w-5 h-5 text-sky-500" />
                  )}
                  {item.file_type === 'pdf' && (
                    <FileText className="w-5 h-5 text-red-500" />
                  )}
                  {item.file_type === 'image' && (
                    <ImageIcon className="w-5 h-5 text-emerald-500" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h5>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {item.file_type === 'video_embed' ? 'VIDEO' : item.file_type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-sm">
                    {item.file_url}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title="Abrir / Ver archivo"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 transition-colors"
                  title="Eliminar archivo"
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
