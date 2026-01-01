import type { ThemePalette } from '../types';
import { dangerScale, warningScale, successScale } from './shared.semantic';

export const sunsetPalette: ThemePalette = {
  danger: dangerScale,
  warning: warningScale,
  success: successScale,
  neutral: {
    '50': '#FFF1F2',
    '100': '#FFE4E6',
    '200': '#FECDD3',
    '300': '#FDA4AF',
    '400': '#FB7185',
    '500': '#F43F5E',
    '600': '#E11D48',
    '700': '#BE123C',
    '800': '#9F1239',
    '900': '#881337',
  },
  primary: {
    '50': '#FFF1F2',
    '100': '#FFE4E6',
    '200': '#FECDD3',
    '300': '#FDA4AF',
    '400': '#FB7185',
    '500': '#F43F5E',
    '600': '#E11D48',
    '700': '#BE123C',
    '800': '#9F1239',
    '900': '#881337',
  },
  secondary: {
    '50': '#FFE4E6',
    '100': '#FECDD3',
    '200': '#FDA4AF',
    '300': '#FB7185',
    '400': '#F43F5E',
    '500': '#E11D48',
    '600': '#BE123C',
    '700': '#9F1239',
    '800': '#881337',
    '900': '#701A2F',
  },
};
