/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--fa-font-family)', 'sans-serif'],
      },
      colors: {
        fa: {
          primary: 'var(--fa-color-primary)',
          'primary-hover': 'var(--fa-color-primary-hover)',
          'primary-dark': 'var(--fa-color-primary-dark)',
          accent: 'var(--fa-color-accent)',
          'accent-light': 'var(--fa-color-accent-light)',
          'bg-base': 'var(--fa-bg-base)',
          'bg-surface': 'var(--fa-bg-surface)',
          'bg-surface-light': 'var(--fa-bg-surface-light)',
          'bg-card': 'var(--fa-bg-card)',
          'bg-card-hover': 'var(--fa-bg-card-hover)',
          'border-subtle': 'var(--fa-border-subtle)',
          'border-default': 'var(--fa-border-default)',
          'border-emphasis': 'var(--fa-border-emphasis)',
          'text-primary': 'var(--fa-text-primary)',
          'text-secondary': 'var(--fa-text-secondary)',
          'text-muted': 'var(--fa-text-muted)',
          'text-dimmed': 'var(--fa-text-dimmed)',
          'status-available': 'var(--fa-status-available)',
          'status-taken': 'var(--fa-status-taken)',
          'status-grace': 'var(--fa-status-grace)',
          'tier-ultra-platinum': 'var(--fa-tier-ultra-platinum)',
          'tier-platinum': 'var(--fa-tier-platinum)',
          'tier-gold': 'var(--fa-tier-gold)',
          'tier-default': 'var(--fa-tier-default)',
        },
      },
      borderRadius: {
        fa: 'var(--fa-radius-lg)',
        'fa-sm': 'var(--fa-radius-sm)',
        'fa-md': 'var(--fa-radius-md)',
        'fa-xl': 'var(--fa-radius-xl)',
      },
    },
  },
  plugins: [],
};
