/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

'use client';

import React, { useState } from 'react';
import { CardLink, LinkType } from '@/lib/types';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Link as LinkIcon,
  Check,
  AlertCircle,
} from 'lucide-react';
import { IconRenderer } from '../card/IconRenderer';

interface LinksEditorProps {
  links: CardLink[];
  cardId: string;
  onChange: (updatedLinks: CardLink[]) => void;
}

export const LinksEditor: React.FC<LinksEditorProps> = ({
  links,
  cardId,
  onChange,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<LinkType>('website');
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');

  // Sugerir etiqueta por defecto al cambiar el tipo
  const handleTypeChange = (type: LinkType) => {
    setNewType(type);
    switch (type) {
      case 'whatsapp':
        setNewLabel('WhatsApp');
        break;
      case 'phone':
        setNewLabel('Teléfono');
        break;
      case 'email':
        setNewLabel('Correo');
        break;
      case 'website':
        setNewLabel('Sitio Web');
        break;
      case 'linkedin':
        setNewLabel('LinkedIn');
        break;
      case 'instagram':
        setNewLabel('Instagram');
        break;
      case 'tiktok':
        setNewLabel('TikTok');
        break;
      default:
        setNewLabel('Enlace Personalizado');
        break;
    }
  };

  // Alternar switch activo/inactivo
  const toggleActive = (id: string) => {
    const updated = links.map((l) =>
      l.id === id ? { ...l, is_active: !l.is_active } : l
    );
    onChange(updated);
  };

  // Mover arriba
  const moveUp = (index: number) => {
    if (index === 0) return;
    const items = [...links];
    const temp = items[index - 1];
    items[index - 1] = items[index];
    items[index] = temp;
    // actualizar orden
    items.forEach((item, idx) => {
      item.position_order = idx + 1;
    });
    onChange(items);
  };

  // Mover abajo
  const moveDown = (index: number) => {
    if (index === links.length - 1) return;
    const items = [...links];
    const temp = items[index + 1];
    items[index + 1] = items[index];
    items[index] = temp;
    // actualizar orden
    items.forEach((item, idx) => {
      item.position_order = idx + 1;
    });
    onChange(items);
  };

  // Eliminar
  const deleteLink = (id: string) => {
    const filtered = links.filter((l) => l.id !== id);
    filtered.forEach((item, idx) => {
      item.position_order = idx + 1;
    });
    onChange(filtered);
  };

  // Agregar nuevo enlace
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newUrl.trim()) return;

    const newLinkItem: CardLink = {
      id: 'link_' + Date.now(),
      card_id: cardId,
      type: newType,
      label: newLabel.trim(),
      url: newUrl.trim(),
      icon_name: newType,
      is_active: true,
      position_order: links.length + 1,
      created_at: new Date().toISOString(),
    };

    onChange([...links, newLinkItem]);
    setIsAdding(false);
    setNewLabel('');
    setNewUrl('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Administrador de Enlaces y Redes
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Controla qué canales de contacto mostrar, activa/desactiva switches y reordena los botones.
          </p>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => {
              setIsAdding(true);
              handleTypeChange('website');
            }}
            className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Enlace</span>
          </button>
        )}
      </div>

      {/* Formulario para agregar */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-3"
        >
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
              Nuevo Enlace o Red Social
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo
              </label>
              <select
                value={newType}
                onChange={(e) => handleTypeChange(e.target.value as LinkType)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="phone">Teléfono / Llamada</option>
                <option value="email">Correo Electrónico</option>
                <option value="website">Sitio Web</option>
                <option value="linkedin">LinkedIn</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Etiqueta Visible
              </label>
              <input
                type="text"
                required
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ej. WhatsApp Ventas"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destino (URL, Teléfono o Email)
              </label>
              <input
                type="text"
                required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder={
                  newType === 'whatsapp' || newType === 'phone'
                    ? '+34600112233'
                    : newType === 'email'
                    ? 'correo@empresa.com'
                    : 'https://...'
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Cerrar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-sm flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Guardar Enlace
            </button>
          </div>
        </form>
      )}

      {/* Lista de Enlaces Existentes */}
      <div className="space-y-2">
        {links.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <LinkIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No hay enlaces configurados todavía.</p>
          </div>
        ) : (
          links.map((link, index) => (
            <div
              key={link.id}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                link.is_active
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800 opacity-60'
              }`}
            >
              {/* Icon & Details */}
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
                  <IconRenderer type={link.type} iconName={link.icon_name} className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {link.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 uppercase font-mono">
                      {link.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {link.url}
                  </p>
                </div>
              </div>

              {/* Controls: Reorder, Active Switch, Delete */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveUp(index)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover arriba"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={index === links.length - 1}
                    onClick={() => moveDown(index)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover abajo"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Switch ON/OFF */}
                <button
                  type="button"
                  onClick={() => toggleActive(link.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    link.is_active ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label={link.is_active ? 'Desactivar enlace' : 'Activar enlace'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      link.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => deleteLink(link.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 transition-colors"
                  title="Eliminar enlace"
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
