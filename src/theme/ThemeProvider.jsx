import { useEffect } from 'react';
import theme from '../config/theme.json';

function flattenToCssVars(obj, prefix = '--fa') {
  const vars = {};
  for (const [key, value] of Object.entries(obj)) {
    const cssKey = `${prefix}-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(vars, flattenToCssVars(value, cssKey));
    } else {
      vars[cssKey] = value;
    }
  }
  return vars;
}

export default function ThemeProvider({ children }) {
  useEffect(() => {
    const root = document.documentElement;

    // Colors
    const colorVars = flattenToCssVars(theme.colors, '--fa-color');
    // Flatten nested: bg -> --fa-bg-*, border -> --fa-border-*, text -> --fa-text-*, status -> --fa-status-*, tiers -> --fa-tier-*
    const bgVars = flattenToCssVars(theme.colors.bg, '--fa-bg');
    const borderVars = flattenToCssVars(theme.colors.border, '--fa-border');
    const textVars = flattenToCssVars(theme.colors.text, '--fa-text');
    const statusVars = flattenToCssVars(theme.colors.status, '--fa-status');
    const tierVars = flattenToCssVars(theme.colors.tiers, '--fa-tier');

    // Gradients
    const gradientVars = flattenToCssVars(theme.gradients, '--fa-gradient');

    // Fonts
    const fontVars = {
      '--fa-font-family': theme.fonts.family,
      '--fa-font-import-url': theme.fonts.importUrl,
    };

    // Border radius
    const radiusVars = flattenToCssVars(theme.borderRadius, '--fa-radius');

    // Top-level color shortcuts
    const topColorVars = {
      '--fa-color-primary': theme.colors.primary,
      '--fa-color-primary-hover': theme.colors.primaryHover,
      '--fa-color-primary-dark': theme.colors.primaryDark,
      '--fa-color-accent': theme.colors.accent,
      '--fa-color-accent-light': theme.colors.accentLight,
    };

    const allVars = {
      ...topColorVars,
      ...bgVars,
      ...borderVars,
      ...textVars,
      ...statusVars,
      ...tierVars,
      ...gradientVars,
      ...fontVars,
      ...radiusVars,
    };

    for (const [prop, value] of Object.entries(allVars)) {
      root.style.setProperty(prop, value);
    }

    // Load font
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = theme.fonts.importUrl;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return children;
}

export { theme };
