/** @type {import('tailwindcss').Config} */
const PJ = ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'];
const fs = (size, lh, w, ls) => [size, { lineHeight: lh, fontWeight: w, ...(ls ? { letterSpacing: ls } : {}) }];
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palet lama dipetakan ke biru template, jadi halaman yang belum didesain ulang ikut berganti warna.
        brand: { DEFAULT: '#5B74D6', dark: '#26398a', deeper: '#1B2150', light: '#E8EDFC', mint: '#DDE4FA' },
        accent: { DEFAULT: '#F59E0B', light: '#FEF3DC' },
        // Token template
        surface: { DEFAULT: '#FFFFFF', soft: '#F8F9FC', alt: '#F1F3F9', variant: '#e0e2e9' },
        'inverse-on-surface': '#eef0f7',
        'border-subtle': '#E1E5F2', 'border-hover': '#C9D1EB',
        'primary-soft': '#E8EDFC', 'pill-active-bg': '#DDE4FA', 'track-chart': '#E3E8F7',
        primary: '#26398a', 'primary-container': '#3f51a3',
        secondary: '#3558bb', 'secondary-container': '#7796fd',
        'logo-block': '#4A5DB5', 'rail-blue': '#5B74D6',
        'text-primary': '#1B2150', 'text-secondary': '#6B7194', 'text-disabled': '#A9AEC8',
        success: '#22A06B', 'success-soft': '#E3F6EC', 'success-accessible': '#12744C',
        danger: '#E5484D', 'danger-soft': '#FDE8E8', warning: '#F59E0B', 'warning-soft': '#FEF3DC',
        'on-surface': '#181c21',
      },
      borderRadius: { lg: '0.5rem', xl: '0.75rem' },
      fontFamily: { sans: PJ, 'body-default': PJ, caption: PJ, h1: PJ, h4: PJ, 'label-prominent': PJ, micro: PJ, 'menu-item': PJ, 'metric-donut': PJ },
      fontSize: {
        'body-default': fs('14px', '22px', '400'),
        caption: fs('12px', '16px', '500'),
        h1: fs('28px', '36px', '700', '-0.015em'),
        h4: fs('16px', '24px', '700'),
        'label-prominent': fs('14px', '20px', '600'),
        micro: fs('11px', '14px', '600', '0.02em'),
        'menu-item': fs('15px', '20px', '600'),
        'metric-donut': fs('18px', '22px', '700'),
      },
    },
  },
  plugins: [],
};
