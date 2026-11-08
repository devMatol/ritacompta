/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0E0A0D',
        surface: '#17111A',
        'surface-subtle': 'rgba(255, 255, 255, 0.03)',
        'surface-elevated': 'rgba(255, 255, 255, 0.06)',
        primary: '#F6EEF2',
        secondary: '#B9A7B1',
        tertiary: '#9C8A95',
        border: 'rgba(255, 190, 220, 0.10)',
        'border-strong': 'rgba(255, 190, 220, 0.18)',
        accent: '#FF5FA2',
        'accent-light': '#FF8FC0',
        'accent-pale': '#FFD1E5',
        'accent-soft': 'rgba(255, 95, 162, 0.10)',
        menthe: '#7FE3B5',
        'menthe-soft': 'rgba(127, 227, 181, 0.12)',
        corail: '#FF8A80',
        'corail-soft': 'rgba(255, 138, 128, 0.12)',
        profit: '#7FE3B5',
        'profit-soft': 'rgba(127, 227, 181, 0.12)',
        danger: '#FF8A80',
        'danger-soft': 'rgba(255, 138, 128, 0.12)',
        warning: '#FF8A80',
        'warning-soft': 'rgba(255, 138, 128, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '14px',
        lg: '20px',
        card: '20px',
        pill: '999px',
      },
      boxShadow: {
        glossy: 'inset 0 1px 0 rgba(255, 255, 255, 0.07)',
        glow: '0 0 24px -4px rgba(255, 95, 162, 0.25)',
      }
    },
  },
  plugins: [],
}
