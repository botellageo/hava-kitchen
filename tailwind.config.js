/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        // Palette aligned with maquette HTML (PMS_04_demo_app.html)
        brand: {
          DEFAULT: '#10b981', // emerald-500
          dark: '#059669', // emerald-600
          darker: '#064e3b', // emerald-900 — titres, brand text
          soft: '#ecfdf5', // emerald-50 — surfaces accent
          softer: '#f0fdf4', // emerald-50 lighter — confirmations
        },
        surface: {
          DEFAULT: '#ffffff',
          soft: '#f9fafb',
          softer: '#f3f4f6', // fond app
        },
        alert: {
          DEFAULT: '#f59e0b', // amber-500
          soft: '#fef3c7', // amber-100
          darker: '#92400e', // amber-800
          warn: '#fbbf24', // amber-400 — bordure card alerte
          warnBg: '#fffbeb', // amber-50 — fond card alerte
          bad: '#ef4444', // red-500 — clear PIN
        },
        info: {
          DEFAULT: '#2563eb', // blue-600
          soft: '#eff6ff', // blue-50
          darker: '#1e40af', // blue-800
        },
      },
      borderRadius: {
        card: '16px',
        tile: '14px',
        chip: '99px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.06)',
        tilehover: '0 8px 20px rgba(0,0,0,0.06)',
        modal: '0 10px 40px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
};
