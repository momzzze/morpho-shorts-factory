import type { ThemePalette } from '../types';
import { dangerScale, warningScale, successScale } from './shared.semantic';

export const oceanPalette: ThemePalette = {
  danger: dangerScale,
  warning: warningScale,
  success: successScale,
  neutral: {
    '50': '#E0F7FA',
    '100': '#B2EBF2',
    '200': '#80DEEA',
    '300': '#4DD0E1',
    '400': '#26C6DA',
    '500': '#00BCD4',
    '600': '#00ACC1',
    '700': '#0097A7',
    '800': '#00838F',
    '900': '#006064',
  },
  primary: {
    '50': '#E0F7FA',
    '100': '#B2EBF2',
    '200': '#80DEEA',
    '300': '#4DD0E1',
    '400': '#26C6DA',
    '500': '#00BCD4',
    '600': '#00ACC1',
    '700': '#0097A7',
    '800': '#00838F',
    '900': '#006064',
  },
  secondary: {
    '50': '#B2EBF2',
    '100': '#80DEEA',
    '200': '#4DD0E1',
    '300': '#26C6DA',
    '400': '#00BCD4',
    '500': '#00ACC1',
    '600': '#0097A7',
    '700': '#00838F',
    '800': '#006064',
    '900': '#004D40',
  },
};
