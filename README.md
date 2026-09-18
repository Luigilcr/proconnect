# ProConnect - Plataforma SaaS de Tarjetas de Presentación Digitales NFC & QR

> © ProConnect. Todos los derechos reservados. Queda prohibida la reproducción, copia o ingeniería inversa de este software.

**ProConnect** es una plataforma SaaS multi-inquilino (multi-tenant) completa y lista para producción diseñada para la creación, personalización y gestión dinámica de Tarjetas de Presentación Digitales asociadas a chips físicos NFC y códigos QR vectoriales.

---

## 🚀 Características Principales

1. **Perfil Digital de Tarjeta Mobile-First (`/c/[slug]`):**
   - 3 temas de diseño: **Modern** (degradados y glassmorphism), **Executive** (formal corporativo con serif) y **Minimal** (esencial y limpio).
   - Paletas dinámicas de colores (`primary_color`, `secondary_color`, `background_color`) y tipografías.
   - **Guardado Automático de Contacto VCF (vCard 3.0):** Generado con tipo MIME explícito `text/vcard; charset=utf-8` y atributo `download` para compatibilidad nativa en iOS (Safari/Contactos) y Android (Chrome/Contactos) incluyendo fotografía del usuario.
   - **WhatsApp Inteligente:** Modal conversacional que captura el nombre y asunto del visitante antes de redirigir al chat con mensaje preformateado.
   - **Módulo Multimedia & Catálogos:** Visor de PDFs con miniatura, visor de imágenes lightbox y reproductor de video responsive (YouTube, Vimeo, MP4).
   - **QR & Asistente NFC:** Generador de código QR SVG descargable y asistente Web NFC para vincular chips físicos (NTAG213, NTAG215, NTAG216).

2. **Panel de Administración & Editor (`/dashboard`):**
   - **Live Preview en Pantalla Dividida (Split-Screen):** Simulador de smartphone en tiempo real que refleja instantáneamente cualquier cambio de datos, colores, fuentes o enlaces.
   - **Gestor de Identidad:** Nombre, cargo, empresa, biografía, foto de perfil, foto de portada y logo corporativo.
   - **Customizer Visual:** Selectores de color HEX, paletas prediseñadas y selector de layout.
   - **Administrador de Enlaces:** Switches ON/OFF interactivos para activar/desactivar y reordenamiento dinámico (subir/bajar).
   - **Cargador Multimedia:** Gestión de PDFs, imágenes y videos embebidos.
   - **Configuración vCard:** Toggle de foto de perfil y notas de contacto personalizadas.

3. **Panel de Superadministrador (`/admin`):**
   - Métricas globales del sistema (usuarios totales, tarjetas creadas, tarjetas activas, enlaces vinculados).
   - Tabla de tarjetas con switch instantáneo para activar/desactivar perfiles en la red.
   - Tabla de usuarios con modificación de roles (`client` / `admin`).

4. **Marco Legal & Propiedad Intelectual:**
   - Archivo `LICENSE` con licencia propietaria y cláusula de no ingeniería inversa.
   - Licencia en comentarios de encabezado de todo el código fuente.
   - Vistas legales completas: Términos y Condiciones (`/terminos`) y Política de Privacidad (`/privacidad`) con garantía estricta de no venta de datos a terceros.

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 14 (App Router) con TypeScript.
- **Estilos:** Tailwind CSS con temas personalizados.
- **Iconos:** Lucide Icons.
- **Códigos QR:** `qrcode.react` (SVG vectorial en alta definición).
- **Efectos:** `canvas-confetti`.
- **Base de Datos & Auth:** Supabase (PostgreSQL, Row Level Security, Storage Buckets).

---

## 📦 Puesta en Marcha

### 1. Instalación de Dependencias

```bash
npm install
```

### 2. Ejecutar Servidor de Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 3. Configuración de Supabase (Opcional para Desarrollo)

El proyecto incluye un script SQL completo en `supabase/schema.sql`.

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Dirígete a **SQL Editor** en el panel de Supabase y pega el contenido de `supabase/schema.sql`.
3. Ejecuta el script para crear las tablas (`users`, `cards`, `card_links`, `catalogs_multimedia`), los triggers de sincronización de autenticación, las políticas RLS y los buckets de Storage (`cards_media`, `catalogs`).
4. Copia las credenciales a tu archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Nota:** La aplicación incluye un almacén local inteligente con datos demo de alta calidad (`lib/data/card-store.ts`), lo que te permite probar el 100% de las funcionalidades del Dashboard, Superadmin y Perfiles Públicos de forma inmediata sin necesidad de configurar Supabase al inicio.

---

## 👥 Perfiles Demo Preconfigurados

- **Elena Rodríguez (Tema Modern):** [http://localhost:3000/c/elena-rodriguez](http://localhost:3000/c/elena-rodriguez)
- **Carlos Mendoza (Tema Executive):** [http://localhost:3000/c/carlos-mendoza](http://localhost:3000/c/carlos-mendoza)
- **Sofía Valenzuela (Tema Minimal):** [http://localhost:3000/c/sofia-valenzuela](http://localhost:3000/c/sofia-valenzuela)
