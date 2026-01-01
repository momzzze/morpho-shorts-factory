import type { ThemePalette } from '../types';
import { dangerScale, warningScale, successScale } from './shared.semantic';

export const volcanoPalette: ThemePalette = {
  danger: dangerScale,
  warning: warningScale,
  success: successScale,
  neutral: {
    '50': '#FEF2F2',
    '100': '#FEE2E2',
    '200': '#FECACA',
    '300': '#FCA5A5',
    '400': '#F87171',
    '500': '#EF4444',
    '600': '#DC2626',
    '700': '#B91C1C',
    '800': '#7F1D1D',
    '900': '#450A0A',
  },
  primary: {
    '50': '#FFF7ED',
    '100': '#FFEDD5',
    '200': '#FED7AA',
    '300': '#FDBA74',
    '400': '#FB923C',
    '500': '#F97316',
    '600': '#EA580C',
    '700': '#C2410C',
    '800': '#92400E',
    '900': '#78350F',
  },
  secondary: {
    '50': '#FEF3C7',
    '100': '#FDE68A',
    '200': '#FCD34D',
    '300': '#FBD34D',
    '400': '#FBBF24',
    '500': '#F59E0B',
    '600': '#D97706',
    '700': '#B45309',
    '800': '#92400E',
    '900': '#78350F',
  },
};
