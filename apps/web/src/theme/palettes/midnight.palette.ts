import type { ThemePalette } from '../types';
import { dangerScale, warningScale, successScale } from './shared.semantic';

export const midnightPalette: ThemePalette = {
  danger: dangerScale,
  warning: warningScale,
  success: successScale,
  neutral: {
    '50': '#0B0C10',
    '100': '#1C1D21',
    '200': '#2E2F33',
    '300': '#414247',
    '400': '#55565A',
    '500': '#6A6B6F',
    '600': '#7F8084',
    '700': '#959699',
    '800': '#ABACAF',
    '900': '#C2C3C5',
  },
  primary: {
    '50': '#0B0C10',
    '100': '#1C1D21',
    '200': '#2E2F33',
    '300': '#414247',
    '400': '#55565A',
    '500': '#6A6B6F',
    '600': '#7F8084',
    '700': '#959699',
    '800': '#ABACAF',
    '900': '#C2C3C5',
  },
  secondary: {
    '50': '#1C1D21',
    '100': '#2E2F33',
    '200': '#414247',
    '300': '#55565A',
    '400': '#6A6B6F',
    '500': '#7F8084',
    '600': '#959699',
    '700': '#ABACAF',
    '800': '#C2C3C5',
    '900': '#D8D9DB',
  },
};
