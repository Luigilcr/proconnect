/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 *
 * MOTOR VISUAL CUSTOMIZER: 6 LAYOUTS, 8 PLANTILLAS 1-CLIC, BOTONES Y BRAND LOCK
 */

'use client';

import React from 'react';
import {
  FullCard,
  LayoutType,
  AvatarPosition,
  ButtonStyle,
  BorderRadius,
  FontWeight,
  PresetTemplate,
} from '@/lib/types';
import { PRESET_TEMPLATES } from '@/lib/data/demo-data';
import { isBrandLockedForCard } from '@/lib/data/card-store';
import {
  Palette,
  Type,
  Layout,
  Sparkles,
  Check,
  Shield,
  Lock,
  Square,
  Circle,
  Eye,
  User,
} from 'lucide-react';

interface DesignCustomizerProps {
  card: FullCard;
  onChange: (updated: Partial<FullCard>) => void;
}

export const DesignCustomizer: React.FC<DesignCustomizerProps> = ({
  card,
  onChange,
}) => {
  const brandLock = isBrandLockedForCard(card);

  const layouts: { id: LayoutType; name: string; desc: string }[] = [
    {
      id: 'modern',
      name: 'Modern (Flotante)',
      desc: 'Portada con degradado, tarjeta superpuesta y glassmorphism.',
    },
    {
      id: 'banner_header',
      name: 'Banner Header',
      desc: 'Cabecera panorámica con logo institucional y avatar alineado.',
    },
    {
      id: 'card_id_badge',
      name: 'Card ID Badge',
      desc: 'Credencial corporativa con chip holográfico y código ID.',
    },
    {
      id: 'creative_grid',
      name: 'Creative Grid',
      desc: 'Disposición Bento Grid moderna y modular de alto impacto.',
    },
    {
      id: 'executive',
      name: 'Executive (Corporativo)',
      desc: 'Retrato centralizado formal con acentos sobrios y serif.',
    },
    {
      id: 'minimal',
      name: 'Minimal (Esencial)',
      desc: 'Líneas limpias, fondo pulcro y lectura inmediata.',
    },
    {
      id: 'crimson_quote',
      name: 'Bio Accent & Quote (Estilo Pro)',
      desc: 'Fondo carbón, avatar circular con halo carmesí, cuadro de cita con borde rojo y botones de alto impacto.',
    },
  ];

  const buttonStyles: { id: ButtonStyle; label: string }[] = [
    { id: 'solid', label: 'Sólido' },
    { id: 'gradient', label: 'Degradado' },
    { id: 'outline', label: 'Contorno (Outline)' },
    { id: 'glassmorphism', label: 'Glassmorphism' },
    { id: 'soft_shadow', label: 'Sombra Suave' },
  ];

  const avatarPositions: { id: AvatarPosition; label: string }[] = [
    { id: 'header_floating', label: 'Flotante en Portada' },
    { id: 'top_center', label: 'Arriba Centrado' },
    { id: 'left_aligned', label: 'Alineado Izquierda' },
    { id: 'hidden', label: 'Ocultar Avatar' },
  ];

  const borderRadii: { id: BorderRadius; label: string }[] = [
    { id: 'none', label: 'Cuadrado (0px)' },
    { id: 'sm', label: 'Ligero (6px)' },
    { id: 'md', label: 'Medio (12px)' },
    { id: 'lg', label: 'Grande (20px)' },
    { id: 'full', label: 'Píldora (Full)' },
  ];

  const textures: { id: any; label: string }[] = [
    { id: 'none', label: 'Sin textura' },
    { id: 'dots', label: 'Puntos (Dots)' },
    { id: 'grid', label: 'Cuadrícula (Grid)' },
    { id: 'carbon', label: 'Fibra de Carbono' },
    { id: 'subtle_noise', label: 'Ruido Sutil' },
    { id: 'mesh_gradient', label: 'Mesh Neón Glow' },
  ];

  const avatarEffects: { id: any; label: string }[] = [
    { id: 'none', label: 'Borde Sencillo' },
    { id: 'glow_primary', label: 'Halo Primario (Glow)' },
    { id: 'glow_accent', label: 'Halo Neón Eléctrico' },
    { id: 'metallic_ring', label: 'Anillo Metálico Dorado' },
    { id: 'glass_border', label: 'Borde Cristal (Glass)' },
  ];

  const cardBadges: { id: any; label: string }[] = [
    { id: 'none', label: 'Sin Insignia' },
    { id: 'verified_pro', label: 'PRO Verificado' },
    { id: 'vip_executive', label: 'VIP Executive' },
    { id: 'top_speaker', label: 'Top Speaker' },
    { id: 'official_partner', label: 'Partner Oficial' },
  ];

  const fonts = [
    { id: 'Inter', name: 'Inter (Sans-Serif Moderna)' },
    { id: 'Poppins', name: 'Poppins (Geométrica & Amigable)' },
    { id: 'Roboto', name: 'Roboto (Técnico & Neutro)' },
    { id: 'Playfair Display', name: 'Playfair Display (Serif Elegante)' },
    { id: 'Montserrat', name: 'Montserrat (Impacto Visual)' },
    { id: 'Cinzel', name: 'Cinzel (Serif Imperial Clásica)' },
    { id: 'Syne', name: 'Syne (Moderna & Vanguardista)' },
  ];

  const fontWeights: { id: FontWeight; label: string }[] = [
    { id: 'normal', label: 'Normal' },
    { id: 'medium', label: 'Medio' },
    { id: 'semibold', label: 'Seminegrita' },
    { id: 'bold', label: 'Negrita' },
  ];

  // Aplicar plantilla prediseñada en 1-clic
  const applyPresetTemplate = (preset: PresetTemplate) => {
    if (brandLock.isLocked) {
      onChange({
        layout_type: preset.layout_type,
        avatar_position: preset.avatar_position,
        button_style: preset.button_style,
        border_radius: preset.border_radius,
        font_family: preset.font_family,
        font_weight: preset.font_weight,
        background_texture: preset.background_texture || 'none',
        avatar_effect: preset.avatar_effect || 'none',
        card_badge: preset.card_badge || 'none',
      });
    } else {
      onChange({
        layout_type: preset.layout_type,
        avatar_position: preset.avatar_position,
        button_style: preset.button_style,
        border_radius: preset.border_radius,
        primary_color: preset.colors.primary,
        secondary_color: preset.colors.secondary,
        accent_color: preset.colors.accent,
        background_color: preset.colors.background,
        font_family: preset.font_family,
        font_weight: preset.font_weight,
        background_texture: preset.background_texture || 'none',
        avatar_effect: preset.avatar_effect || 'none',
        card_badge: preset.card_badge || 'none',
      });
    }
  };

  return (
    <div className="space-y-7">
      {/* Aviso de Restricción de Marca (Brand Lock) */}
      {brandLock.isLocked && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3 text-xs">
          <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-200">
              Restricción de Marca Corporativa Activa ({brandLock.organizationName})
            </h4>
            <p className="mt-0.5 text-amber-300/90 leading-relaxed">
              La identidad cromática y los logotipos institucionales están congelados por el administrador de tu empresa para preservar la coherencia de marca. Puedes personalizar la disposición de contenidos y el orden de tus enlaces.
            </p>
          </div>
        </div>
      )}

      {/* 1. Galería de Plantillas Prediseñadas en 1-Clic */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Galería de Plantillas Prémium ({PRESET_TEMPLATES.length} Estilos)
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {PRESET_TEMPLATES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPresetTemplate(preset)}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-500/60 dark:hover:border-sky-500/60 bg-slate-50 dark:bg-slate-800/60 text-left transition-all hover:scale-[1.02] group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                  {preset.name}
                </span>
                <div
                  style={{ backgroundColor: preset.colors.primary }}
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                />
              </div>

              <div className="flex gap-1 mb-2">
                <span
                  style={{ backgroundColor: preset.colors.primary }}
                  className="w-3.5 h-2 rounded-sm"
                />
                <span
                  style={{ backgroundColor: preset.colors.secondary }}
                  className="w-3.5 h-2 rounded-sm"
                />
                <span
                  style={{ backgroundColor: preset.colors.accent }}
                  className="w-3.5 h-2 rounded-sm"
                />
                <span
                  style={{ backgroundColor: preset.colors.background }}
                  className="w-3.5 h-2 rounded-sm border border-slate-600"
                />
              </div>

              <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate font-semibold">
                {preset.industry}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Selector de Layout (6 Layouts) */}
      <div>
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
          <Layout className="w-4 h-4 text-sky-500" />
          Plantilla Estructural (Layout)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {layouts.map((l) => {
            const isSelected = card.layout_type === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onChange({ layout_type: l.id })}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {l.name}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-sky-500 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {l.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Posición del Avatar & Estilo de Botón */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Posición del Avatar */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
            <User className="w-3.5 h-3.5 text-sky-500" />
            Posición del Avatar
          </label>
          <select
            value={card.avatar_position || 'header_floating'}
            onChange={(e) =>
              onChange({ avatar_position: e.target.value as AvatarPosition })
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
          >
            {avatarPositions.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.label}
              </option>
            ))}
          </select>
        </div>

        {/* Estilo de Botón */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            Estilo de Botones
          </label>
          <select
            value={card.button_style || 'solid'}
            onChange={(e) =>
              onChange({ button_style: e.target.value as ButtonStyle })
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
          >
            {buttonStyles.map((style) => (
              <option key={style.id} value={style.id}>
                {style.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Radio de Bordes */}
      <div>
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
          <Square className="w-3.5 h-3.5 text-sky-500" />
          Radio de Bordes (Border Radius)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {borderRadii.map((radius) => {
            const isSelected = card.border_radius === radius.id;
            return (
              <button
                key={radius.id}
                type="button"
                onClick={() => onChange({ border_radius: radius.id })}
                className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-colors ${
                  isSelected
                    ? 'border-sky-500 bg-sky-500/10 text-sky-500 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {radius.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Textura de Fondo Avanzada */}
      <div>
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          Textura de Fondo (Background Texture)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {textures.map((tex) => {
            const isSelected = (card.background_texture || 'none') === tex.id;
            return (
              <button
                key={tex.id}
                type="button"
                onClick={() => onChange({ background_texture: tex.id })}
                className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-colors ${
                  isSelected
                    ? 'border-sky-500 bg-sky-500/10 text-sky-500 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tex.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Efecto de Halo / Borde del Avatar */}
      <div>
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
          <Circle className="w-3.5 h-3.5 text-sky-500" />
          Efecto de Halo del Avatar (Glow / Ring)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {avatarEffects.map((effect) => {
            const isSelected = (card.avatar_effect || 'none') === effect.id;
            return (
              <button
                key={effect.id}
                type="button"
                onClick={() => onChange({ avatar_effect: effect.id })}
                className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-colors ${
                  isSelected
                    ? 'border-sky-500 bg-sky-500/10 text-sky-500 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {effect.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Insignia de Verificación de Perfil */}
      <div>
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5 text-sky-500" />
          Insignia de Reconocimiento (Badge)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {cardBadges.map((badge) => {
            const isSelected = (card.card_badge || 'none') === badge.id;
            return (
              <button
                key={badge.id}
                type="button"
                onClick={() => onChange({ card_badge: badge.id })}
                className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-colors ${
                  isSelected
                    ? 'border-sky-500 bg-sky-500/10 text-sky-500 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {badge.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Paleta de 4 Tonos (Con soporte de Bloqueo Corporativo) */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
            <Palette className="w-4 h-4 text-sky-500" />
            Paleta Armónica de 4 Tonos
          </span>
          {brandLock.isLocked && (
            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1 uppercase">
              <Lock className="w-3 h-3" />
              Bloqueado por Empresa
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Color Primario */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Primario
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                disabled={brandLock.isLocked}
                value={card.primary_color || '#0ea5e9'}
                onChange={(e) => onChange({ primary_color: e.target.value })}
                className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent disabled:opacity-50"
              />
              <input
                type="text"
                disabled={brandLock.isLocked}
                value={card.primary_color || '#0ea5e9'}
                onChange={(e) => onChange({ primary_color: e.target.value })}
                className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Color Secundario */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Secundario
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                disabled={brandLock.isLocked}
                value={card.secondary_color || '#0369a1'}
                onChange={(e) => onChange({ secondary_color: e.target.value })}
                className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent disabled:opacity-50"
              />
              <input
                type="text"
                disabled={brandLock.isLocked}
                value={card.secondary_color || '#0369a1'}
                onChange={(e) => onChange({ secondary_color: e.target.value })}
                className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Color Acento */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Acento
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                disabled={brandLock.isLocked}
                value={card.accent_color || '#38bdf8'}
                onChange={(e) => onChange({ accent_color: e.target.value })}
                className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent disabled:opacity-50"
              />
              <input
                type="text"
                disabled={brandLock.isLocked}
                value={card.accent_color || '#38bdf8'}
                onChange={(e) => onChange({ accent_color: e.target.value })}
                className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Color Fondo */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Fondo
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                disabled={brandLock.isLocked}
                value={card.background_color || '#0f172a'}
                onChange={(e) => onChange({ background_color: e.target.value })}
                className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent disabled:opacity-50"
              />
              <input
                type="text"
                disabled={brandLock.isLocked}
                value={card.background_color || '#0f172a'}
                onChange={(e) => onChange({ background_color: e.target.value })}
                className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. Tipografía y Peso de Fuente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
            <Type className="w-3.5 h-3.5 text-sky-500" />
            Familia Tipográfica
          </label>
          <select
            value={card.font_family || 'Inter'}
            onChange={(e) => onChange({ font_family: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
          >
            {fonts.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
            <Type className="w-3.5 h-3.5 text-sky-500" />
            Peso Tipográfico del Nombre
          </label>
          <select
            value={card.font_weight || 'semibold'}
            onChange={(e) =>
              onChange({ font_weight: e.target.value as FontWeight })
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
          >
            {fontWeights.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
