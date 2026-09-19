/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

'use client';

import React, { useState } from 'react';
import { CatalogMultimedia } from '@/lib/types';
import {
  FileText,
  Play,
  Image as ImageIcon,
  ExternalLink,
  Download,
  Eye,
  X,
} from 'lucide-react';

interface MultimediaViewerProps {
  items: CatalogMultimedia[];
  primaryColor?: string;
}

export const MultimediaViewer: React.FC<MultimediaViewerProps> = ({
  items,
  primaryColor = '#0ea5e9',
}) => {
  const [activeModalItem, setActiveModalItem] = useState<CatalogMultimedia | null>(null);

  if (!items || items.length === 0) return null;

  // Convertir URL de YouTube a Embed URL
  const getEmbedVideoUrl = (url: string) => {
    try {
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        const videoId = urlObj.searchParams.get('v');
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
      if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
      if (url.includes('vimeo.com/')) {
        const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
        return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
      }
      return url;
    } catch {
      return url;
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Catálogos & Multimedia
        </h3>
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          {items.length} {items.length === 1 ? 'elemento' : 'elementos'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {items.map((item) => {
          const isPdf = item.file_type === 'pdf';
          const isVideo = item.file_type === 'video_embed';
          const isImage = item.file_type === 'image';

          return (
            <div
              key={item.id}
              onClick={() => setActiveModalItem(item)}
              className="group relative flex items-center gap-3 p-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-slate-300 dark:hover:border-slate-600"
            >
              {/* Thumbnail / Icon Badge */}
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 flex items-center justify-center">
                {item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div
                    style={{ color: primaryColor }}
                    className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800"
                  >
                    {isPdf && <FileText className="w-7 h-7" />}
                    {isVideo && <Play className="w-7 h-7" />}
                    {isImage && <ImageIcon className="w-7 h-7" />}
                  </div>
                )}

                {/* Badge Overlay */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg">
                    {isVideo ? (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Type Indicator Tag */}
                <span className="absolute bottom-1 right-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                  {isPdf ? 'PDF' : isVideo ? 'VIDEO' : 'IMG'}
                </span>
              </div>

              {/* Title & Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-sky-500 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {isPdf
                    ? 'Catálogo / Documento PDF'
                    : isVideo
                    ? 'Video de demostración'
                    : 'Fotografía en alta resolución'}
                </p>
              </div>

              {/* Action Button */}
              <div className="shrink-0">
                <button
                  type="button"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Abrir archivo"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal / Lightbox */}
      {activeModalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveModalItem(null)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate pr-4">
                <span
                  style={{ backgroundColor: primaryColor }}
                  className="w-2.5 h-2.5 rounded-full"
                />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {activeModalItem.title}
                </h4>
              </div>
              <button
                onClick={() => setActiveModalItem(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 bg-slate-950 flex items-center justify-center min-h-[320px]">
              {activeModalItem.file_type === 'video_embed' ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden flex items-center justify-center bg-black">
                  {activeModalItem.file_url.toLowerCase().includes('.mp4') ||
                  activeModalItem.file_url.toLowerCase().includes('.mov') ||
                  activeModalItem.file_url.startsWith('data:video') ? (
                    <video
                      src={activeModalItem.file_url}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <iframe
                      src={getEmbedVideoUrl(activeModalItem.file_url)}
                      title={activeModalItem.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  )}
                </div>
              ) : activeModalItem.file_type === 'image' ? (
                <img
                  src={activeModalItem.file_url}
                  alt={activeModalItem.title}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-md"
                />
              ) : (
                <div className="text-center p-8 bg-slate-900 rounded-2xl border border-slate-800 text-white max-w-md w-full">
                  <FileText className="w-16 h-16 text-sky-400 mx-auto mb-4" />
                  <h5 className="font-bold text-base mb-2">
                    {activeModalItem.title}
                  </h5>
                  <p className="text-xs text-slate-400 mb-6">
                    Documento en formato PDF listo para visualización o descarga directa.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <a
                      href={activeModalItem.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold flex items-center gap-2 shadow-md transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Visualizar Online
                    </a>
                    <a
                      href={activeModalItem.file_url}
                      download
                      className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
