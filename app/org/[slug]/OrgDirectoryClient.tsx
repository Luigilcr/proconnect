'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Organization, FullCard } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Building2,
  Search,
  CheckCircle2,
  Share2,
  ExternalLink,
  Phone,
  Mail,
  MessageCircle,
  Users,
  ShieldCheck,
  Globe,
  Copy,
  Check,
} from 'lucide-react';

interface OrgDirectoryClientProps {
  initialOrg: Organization;
  initialCards: FullCard[];
}

export function OrgDirectoryClient({ initialOrg, initialCards }: OrgDirectoryClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [copied, setCopied] = useState(false);

  // Extraer departamentos únicos de las tarjetas
  const departments = useMemo(() => {
    const depts = new Set<string>();
    initialCards.forEach((c) => {
      if (c.department?.trim()) {
        depts.add(c.department.trim());
      }
    });
    return Array.from(depts);
  }, [initialCards]);

  // Filtrado reactivo en tiempo real
  const filteredCards = useMemo(() => {
    return initialCards.filter((c) => {
      const matchesSearch =
        searchTerm === '' ||
        c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.bio?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept =
        selectedDept === 'all' ||
        (c.department && c.department.trim().toLowerCase() === selectedDept.toLowerCase());

      return matchesSearch && matchesDept;
    });
  }, [initialCards, searchTerm, selectedDept]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Directorio Oficial | ${initialOrg.name}`,
          text: `Conoce al equipo profesional de ${initialOrg.name} en ProConnect.`,
          url,
        });
      } catch {
        // Ignorar cancelaciones de usuario
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const primaryColor = initialOrg.brand_colors?.primary || '#7C3AED';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Cabecera Institucional */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {/* Acento de color corporativo superior */}
          <div
            className="absolute top-0 left-0 right-0 h-2"
            style={{ backgroundColor: primaryColor }}
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              {initialOrg.logo_url ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center shrink-0">
                  <img
                    src={initialOrg.logo_url}
                    alt={initialOrg.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl text-white shadow-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Building2 className="w-10 h-10" />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {initialOrg.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Empresa Verificada
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                  {initialOrg.description ||
                    `Directorio corporativo oficial de ${initialOrg.name}. Conéctate con nuestros colaboradores acreditados y accede a sus credenciales digitales.`}
                </p>

                <div className="flex items-center gap-4 pt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-semibold">
                    <Users className="w-3.5 h-3.5 text-purple-500" />
                    {initialCards.length} {initialCards.length === 1 ? 'colaborador' : 'colaboradores'} activos
                  </span>
                </div>
              </div>
            </div>

            {/* Botón de Compartir Directorio */}
            <div className="flex items-center gap-3 self-start md:self-auto">
              <button
                type="button"
                onClick={handleShare}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>¡Enlace Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Compartir Directorio</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Enlaces Oficiales Corporativos */}
          {initialOrg.mandatory_links && initialOrg.mandatory_links.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                Enlaces Oficiales:
              </span>
              {initialOrg.mandatory_links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>{link.label}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Barra de Búsqueda y Filtros por Departamento */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, cargo, departamento o especialidad..."
                className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Contador de resultados */}
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold shrink-0">
              Mostrando {filteredCards.length} de {initialCards.length}
            </div>
          </div>

          {/* Filtros por Departamento (si existen) */}
          {departments.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedDept('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedDept === 'all'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                }`}
              >
                Todos ({initialCards.length})
              </button>
              {departments.map((dept) => {
                const count = initialCards.filter(
                  (c) => c.department?.trim().toLowerCase() === dept.toLowerCase()
                ).length;
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDept(dept)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedDept === dept
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {dept} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Cuadrícula de Colaboradores */}
        {filteredCards.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <Users className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No se encontraron colaboradores
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No hay miembros del equipo que coincidan con &ldquo;{searchTerm}&rdquo;. Prueba con otro término o limpia la búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCards.map((card) => {
              const emailLink = card.links?.find((l) => l.type === 'email');
              const phoneLink = card.links?.find((l) => l.type === 'phone');
              const whatsappLink = card.links?.find((l) => l.type === 'whatsapp');

              return (
                <div
                  key={card.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Foto y Avatar */}
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        {card.profile_photo_url ? (
                          <img
                            src={card.profile_photo_url}
                            alt={card.full_name}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-800 shadow-sm group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-black text-xl border-2 border-slate-100 dark:border-slate-800">
                            {card.full_name?.charAt(0) || 'P'}
                          </div>
                        )}
                        <span
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white"
                          title="Tarjeta Activa Verificada"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h2 className="text-base font-black text-slate-900 dark:text-white truncate">
                          {card.full_name}
                        </h2>
                        <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 truncate">
                          {card.job_title || 'Colaborador'}
                        </p>
                        {card.department && (
                          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {card.department}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bio breve si tiene */}
                    {card.bio && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {card.bio}
                      </p>
                    )}

                    {/* Canales de Contacto Directo */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {phoneLink && (
                        <a
                          href={phoneLink.url}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 text-slate-600 hover:text-emerald-600 dark:text-slate-300 transition-colors"
                          title="Llamar directamente"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      {whatsappLink && (
                        <a
                          href={whatsappLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 text-slate-600 hover:text-emerald-600 dark:text-slate-300 transition-colors"
                          title="Escribir por WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                      {emailLink && (
                        <a
                          href={emailLink.url}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-sky-50 dark:bg-slate-800 text-slate-600 hover:text-sky-600 dark:text-slate-300 transition-colors"
                          title="Enviar correo electrónico"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Botón de Ver Tarjeta Digital */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      href={`/c/${card.slug}`}
                      className="w-full py-2.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm shadow-purple-600/20 flex items-center justify-center gap-1.5 transition-all group-hover:scale-[1.02]"
                    >
                      <span>Ver Tarjeta Inteligente</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Descargo de Responsabilidad Legal si está configurado */}
        {initialOrg.legal_disclaimer && (
          <div className="p-5 rounded-2xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-center text-[11px] text-slate-400 dark:text-slate-500 max-w-2xl mx-auto leading-relaxed">
            {initialOrg.legal_disclaimer}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
