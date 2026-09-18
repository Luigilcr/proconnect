/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

'use client';

import React from 'react';
import { FullCard } from '@/lib/types';
import { isBrandLockedForCard } from '@/lib/data/card-store';
import { User, Camera, Briefcase, Building2, AlignLeft, Image as ImageIcon, Link2, Lock, Shield } from 'lucide-react';

interface IdentityEditorProps {
  card: FullCard;
  onChange: (updated: Partial<FullCard>) => void;
}

export const IdentityEditor: React.FC<IdentityEditorProps> = ({ card, onChange }) => {
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      try {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 500;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round((height * MAX_SIZE) / width);
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round((width * MAX_SIZE) / height);
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              onChange({ profile_photo_url: canvas.toDataURL('image/jpeg', 0.85) });
              return;
            }
          } catch (err) {
            console.error(err);
          }
          onChange({ profile_photo_url: dataUrl });
        };
        img.onerror = () => {
          onChange({ profile_photo_url: dataUrl });
        };
        img.src = dataUrl;
      } catch {
        onChange({ profile_photo_url: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const brandLock = isBrandLockedForCard(card);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Identidad Personal y Corporativa
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configura tus datos básicos, biografía y fotografías visibles en tu perfil digital.
          </p>
        </div>

        {brandLock.isLocked && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <span>{brandLock.organizationName}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre Completo */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-sky-500" />
            Nombre Completo *
          </label>
          <input
            type="text"
            required
            value={card.full_name}
            onChange={(e) => onChange({ full_name: e.target.value })}
            placeholder="Ej. Elena Rodríguez Morales"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Cargo / Puesto */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-sky-500" />
            Cargo Profesional
          </label>
          <input
            type="text"
            value={card.job_title || ''}
            onChange={(e) => onChange({ job_title: e.target.value })}
            placeholder="Ej. Chief Innovation Officer"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Empresa */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-sky-500" />
            Empresa u Organización
          </label>
          <input
            type="text"
            value={card.company_name || ''}
            onChange={(e) => onChange({ company_name: e.target.value })}
            placeholder="Ej. NexaCorp Technologies"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Slug Personalizado */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-sky-500" />
            Enlace / Slug Público (/c/[slug])
          </label>
          <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden text-xs">
            <span className="px-3 text-slate-400 font-mono">/c/</span>
            <input
              type="text"
              value={card.slug}
              onChange={(e) =>
                onChange({
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-_]/g, '-'),
                })
              }
              placeholder="elena-rodriguez"
              className="flex-1 py-2.5 pr-3 bg-transparent text-slate-900 dark:text-white outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Biografía */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
          <AlignLeft className="w-3.5 h-3.5 text-sky-500" />
          Biografía y Presentación Profesional
        </label>
        <textarea
          rows={3}
          value={card.bio || ''}
          onChange={(e) => onChange({ bio: e.target.value })}
          placeholder="Describe brevemente tu trayectoria, especialidades y propuesta de valor..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* Fotos y Logotipos */}
      <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Imágenes y Logotipos
        </h4>

        {/* Foto de Perfil con Subida Directa */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Foto de Perfil
          </label>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <label
              htmlFor="dashboard-avatar-upload"
              className="relative group cursor-pointer w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 block"
              title="Toca para subir foto"
            >
              {card.profile_photo_url ? (
                <img
                  src={card.profile_photo_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </label>

            <div className="flex-1 space-y-1.5 w-full">
              <input
                id="dashboard-avatar-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePhotoUpload}
              />
              <div className="flex gap-2">
                <label
                  htmlFor="dashboard-avatar-upload"
                  className="cursor-pointer px-3.5 py-2 bg-brand-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Subir Foto</span>
                </label>
                <input
                  type="url"
                  value={card.profile_photo_url || ''}
                  onChange={(e) => onChange({ profile_photo_url: e.target.value })}
                  placeholder="O pega una URL: https://..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Sube tu foto desde tu dispositivo o pega un enlace directo.
              </p>
            </div>
          </div>
        </div>

        {/* Foto de Portada */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            URL de Portada de Fondo (Layout Modern & Banner)
          </label>
          <div className="flex gap-3 items-center">
            <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
              {card.cover_photo_url ? (
                <img
                  src={card.cover_photo_url}
                  alt="Portada"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
              )}
            </div>
            <input
              type="url"
              value={card.cover_photo_url || ''}
              onChange={(e) => onChange({ cover_photo_url: e.target.value })}
              placeholder="https://ejemplo.com/portada.jpg"
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Logotipo Corporativo */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              URL de Logo Corporativo
            </label>
            {brandLock.isLocked && (
              <span className="text-[10px] text-amber-400 flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3" />
                Gestionado Centralmente
              </span>
            )}
          </div>
          <div className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center p-1">
              {card.logo_url ? (
                <img
                  src={card.logo_url}
                  alt="Logo"
                  className="max-h-full object-contain"
                />
              ) : (
                <Building2 className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <input
              type="url"
              disabled={brandLock.isLocked}
              value={card.logo_url || ''}
              onChange={(e) => onChange({ logo_url: e.target.value })}
              placeholder="https://ejemplo.com/logo.png"
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
