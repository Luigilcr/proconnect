/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * MODAL DE RECORTE Y ENFOQUE DE FOTOGRAFÍA (ANTI-CORTE DE ROSTRO)
 * Permite centrar, mover (pan) y hacer zoom a la foto de perfil o avatar
 * para asegurar que el rostro quede perfectamente encuadrado.
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Move, User } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  title?: string;
  shape?: 'circle' | 'rounded';
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  title = 'Ajustar y Centrar Foto de Perfil',
  shape = 'rounded',
}) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Resetear estados al abrir con una nueva imagen
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }, [isOpen, imageSrc]);

  // Manejo de eventos de ratón para Arrastre (Pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Manejo de eventos táctiles para smartphones
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      setOffset({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Generar la imagen recortada en Canvas nativo de alta resolución
  const handleConfirmCrop = () => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const outputSize = 600; // 600x600px óptimo para tarjetas digitales
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensiones del viewport de recorte visual (280x280px en pantalla)
    const cropBoxSize = 280;

    // Calcular factor de escala entre la imagen mostrada y la original
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    // Tamaño de la imagen escalada en el viewport
    const displayAspect = img.width / img.height;
    let baseDisplayW = cropBoxSize;
    let baseDisplayH = cropBoxSize;

    if (img.naturalWidth > img.naturalHeight) {
      baseDisplayH = cropBoxSize;
      baseDisplayW = cropBoxSize * (img.naturalWidth / img.naturalHeight);
    } else {
      baseDisplayW = cropBoxSize;
      baseDisplayH = cropBoxSize * (img.naturalHeight / img.naturalWidth);
    }

    const currentDisplayW = baseDisplayW * scale;
    const currentDisplayH = baseDisplayH * scale;

    // Centro del área de recorte en coordenadas de pantalla relativas a la imagen
    const imgCenterX = currentDisplayW / 2 + offset.x;
    const imgCenterY = currentDisplayH / 2 + offset.y;

    const cropCenterX = cropBoxSize / 2;
    const cropCenterY = cropBoxSize / 2;

    const deltaX = cropCenterX - imgCenterX;
    const deltaY = cropCenterY - imgCenterY;

    // Escala del canvas final respecto al viewport en pantalla
    const canvasRatio = outputSize / cropBoxSize;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputSize, outputSize);

    // Dibujar en canvas con transformación
    ctx.save();
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.scale(canvasRatio * scale, canvasRatio * scale);
    ctx.translate(offset.x / scale, offset.y / scale);

    // Dibujar la imagen centrada
    ctx.drawImage(
      img,
      -baseDisplayW / 2,
      -baseDisplayH / 2,
      baseDisplayW,
      baseDisplayH
    );
    ctx.restore();

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    onCropComplete(croppedDataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 flex items-center justify-center border border-sky-200 dark:border-sky-800">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Arrastra para centrar tu rostro y ajusta el zoom
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Área de Visualización y Recorte Interactivo */}
        <div className="p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Instrucción flotante */}
          <div className="mb-3 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] font-semibold text-slate-300 flex items-center gap-1.5 shadow-md">
            <Move className="w-3 h-3 text-sky-400" />
            <span>Mueve la foto con tu dedo o mouse para encuadrar</span>
          </div>

          {/* Marco de recorte (280x280px) */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`relative w-[280px] h-[280px] overflow-hidden cursor-grab active:cursor-grabbing border-2 border-sky-500 shadow-2xl ${
              shape === 'circle' ? 'rounded-full ring-4 ring-black/60' : 'rounded-3xl ring-4 ring-black/60'
            }`}
            style={{
              touchAction: 'none',
            }}
          >
            {/* Imagen interactiva */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Para recortar"
              onLoad={() => setImageLoaded(true)}
              draggable={false}
              className="absolute pointer-events-none max-w-none transition-transform duration-75"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                minWidth: '280px',
                minHeight: '280px',
                objectFit: 'contain',
              }}
            />

            {/* Guía en cruz sutil para alinear ojos y rostro */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>
          </div>
        </div>

        {/* Barra de Controles: Zoom y Reset */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.8, s - 0.15))}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="0.8"
                max="3"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 w-10 text-right">
                {Math.round(scale * 100)}%
              </span>
            </div>

            <button
              type="button"
              onClick={() => setScale((s) => Math.min(3, s + 0.15))}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setScale(1);
                setOffset({ x: 0, y: 0 });
              }}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              title="Restablecer posición"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmCrop}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>✓ Aplicar Foto Centrada</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
