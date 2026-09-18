/**
 * © ProConnect. Todos los derechos reservados.
 * Queda prohibida la reproducción, copia o ingeniería inversa de este software.
 */

import React from 'react';
import {
  MessageCircle,
  Phone,
  Mail,
  Globe,
  Linkedin,
  Instagram,
  Video,
  Share2,
  ExternalLink,
  MapPin,
  Building,
  FileText,
  Briefcase,
  User,
  LucideProps,
} from 'lucide-react';
import { LinkType } from '@/lib/types';

interface IconRendererProps extends LucideProps {
  type?: LinkType;
  iconName?: string | null;
}

export const IconRenderer: React.FC<IconRendererProps> = ({
  type,
  iconName,
  className = 'w-5 h-5',
  ...props
}) => {
  // Coincidencias por nombre explícito de icono
  if (iconName) {
    const lower = iconName.toLowerCase();
    if (lower.includes('message') || lower.includes('whatsapp')) {
      return <MessageCircle className={className} {...props} />;
    }
    if (lower.includes('phone') || lower.includes('call')) {
      return <Phone className={className} {...props} />;
    }
    if (lower.includes('mail') || lower.includes('email')) {
      return <Mail className={className} {...props} />;
    }
    if (lower.includes('globe') || lower.includes('web')) {
      return <Globe className={className} {...props} />;
    }
    if (lower.includes('linkedin')) {
      return <Linkedin className={className} {...props} />;
    }
    if (lower.includes('instagram')) {
      return <Instagram className={className} {...props} />;
    }
    if (lower.includes('tiktok') || lower.includes('video')) {
      return <Video className={className} {...props} />;
    }
    if (lower.includes('file') || lower.includes('doc')) {
      return <FileText className={className} {...props} />;
    }
  }

  // Coincidencias por tipo de enlace
  switch (type) {
    case 'whatsapp':
      return <MessageCircle className={className} {...props} />;
    case 'phone':
      return <Phone className={className} {...props} />;
    case 'email':
      return <Mail className={className} {...props} />;
    case 'website':
      return <Globe className={className} {...props} />;
    case 'linkedin':
      return <Linkedin className={className} {...props} />;
    case 'instagram':
      return <Instagram className={className} {...props} />;
    case 'tiktok':
      return <Video className={className} {...props} />;
    default:
      return <ExternalLink className={className} {...props} />;
  }
};
