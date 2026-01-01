import type { ThemePalette } from '../types';
import { dangerScale, warningScale, successScale } from './shared.semantic';

export const emeraldPalette: ThemePalette = {
  danger: dangerScale,
  warning: warningScale,
  success: successScale,
  neutral: {
    '50': '#ECFDF5',
    '100': '#D1FAE5',
    '200': '#A7F3D0',
    '300': '#6EE7B7',
    '400': '#34D399',
    '500': '#10B981',
    '600': '#059669',
    '700': '#047857',
    '800': '#065F46',
    '900': '#064E3B',
  },
  primary: {
    '50': '#ECFDF5',
    '100': '#D1FAE5',
    '200': '#A7F3D0',
    '300': '#6EE7B7',
    '400': '#34D399',
    '500': '#10B981',
    '600': '#059669',
    '700': '#047857',
    '800': '#065F46',
    '900': '#064E3B',
  },
  secondary: {
    '50': '#D1FAE5',
    '100': '#A7F3D0',
    '200': '#6EE7B7',
    '300': '#34D399',
    '400': '#10B981',
    '500': '#059669',
    '600': '#047857',
    '700': '#065F46',
    '800': '#064E3B',
    '900': '#064E3B',
  },
};
