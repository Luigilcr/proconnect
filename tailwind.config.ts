import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── ProConnect Brand Palette (extraída del logo oficial) ──
        brand: {
          navy:    '#0A2540',   // Azul marino profundo — fondos oscuros, títulos
          blue:    '#1E3A8A',   // Azul corporativo — botones primarios
          mid:     '#2563EB',   // Azul medio — hover, bordes activos
          cyan:    '#00B4D8',   // Cian eléctrico — acentos, ondas NFC, badges
          aqua:    '#38BDF8',   // Aqua claro — acentos claros
          light:   '#E0F7FA',   // Cian muy claro — backgrounds suaves
          bg:      '#F8FAFC',   // Fondo modo claro (gris perla)
          dark:    '#081220',   // Fondo modo oscuro profundo
        },
        // Alias backward-compat (componentes existentes usan 'pro-*')
        pro: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
      fontFamily: {
        sans:       ['var(--font-inter)', 'Inter', 'sans-serif'],
        inter:      ['Inter', 'sans-serif'],
        poppins:    ['Poppins', 'sans-serif'],
        roboto:     ['Roboto', 'sans-serif'],
        playfair:   ['Playfair Display', 'serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      keyframes: {
        'nfc-ring': {
          '0%':   { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'logo-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
      },
      animation: {
        'nfc-ring':   'nfc-ring 1.4s ease-out infinite',
        'logo-pulse': 'logo-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
