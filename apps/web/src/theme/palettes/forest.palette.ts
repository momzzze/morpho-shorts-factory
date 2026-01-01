import type { ThemePalette } from '../types';
import { dangerScale, warningScale, successScale } from './shared.semantic';

export const forestPalette: ThemePalette = {
  danger: dangerScale,
  warning: warningScale,
  success: successScale,
  neutral: {
    '50': '#E6F4EA',
    '100': '#C1E3C8',
    '200': '#9AD1A3',
    '300': '#70B77E',
    '400': '#4A9E5E',
    '500': '#2E8643',
    '600': '#1F6B34',
    '700': '#145225',
    '800': '#0A3A19',
    '900': '#05210F',
  },
  primary: {
    '50': '#E6F4EA',
    '100': '#C1E3C8',
    '200': '#9AD1A3',
    '300': '#70B77E',
    '400': '#4A9E5E',
    '500': '#2E8643',
    '600': '#1F6B34',
    '700': '#145225',
    '800': '#0A3A19',
    '900': '#05210F',
  },
  secondary: {
    '50': '#C8E6C9',
    '100': '#A5D6A7',
    '200': '#81C784',
    '300': '#66BB6A',
    '400': '#4CAF50',
    '500': '#43A047',
    '600': '#388E3C',
    '700': '#2E7D32',
    '800': '#1B5E20',
    '900': '#10491A',
  },
};
