import type { ThemePalette } from '../types';
import { dangerScale, warningScale, successScale } from './shared.semantic';

export const lavenderPalette: ThemePalette = {
  danger: dangerScale,
  warning: warningScale,
  success: successScale,
  neutral: {
    '50': '#F5F3FF',
    '100': '#EDE9FE',
    '200': '#DDD6FE',
    '300': '#C4B5FD',
    '400': '#A78BFA',
    '500': '#8B5CF6',
    '600': '#7C3AED',
    '700': '#6D28D9',
    '800': '#5B21B6',
    '900': '#4C1D95',
  },
  primary: {
    '50': '#F5F3FF',
    '100': '#EDE9FE',
    '200': '#DDD6FE',
    '300': '#C4B5FD',
    '400': '#A78BFA',
    '500': '#8B5CF6',
    '600': '#7C3AED',
    '700': '#6D28D9',
    '800': '#5B21B6',
    '900': '#4C1D95',
  },
  secondary: {
    '50': '#EDE9FE',
    '100': '#DDD6FE',
    '200': '#C4B5FD',
    '300': '#A78BFA',
    '400': '#8B5CF6',
    '500': '#7C3AED',
    '600': '#6D28D9',
    '700': '#5B21B6',
    '800': '#4C1D95',
    '900': '#3C096C',
  },
};
