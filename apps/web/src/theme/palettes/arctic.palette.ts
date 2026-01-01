import type { ThemePalette } from '../types';
import { dangerScale, warningScale, successScale } from './shared.semantic';

export const arcticPalette: ThemePalette = {
  danger: dangerScale,
  warning: warningScale,
  success: successScale,
  neutral: {
    '50': '#F8FAFC',
    '100': '#F0F4F8',
    '200': '#D9E2EC',
    '300': '#BCCCDC',
    '400': '#9FB3C8',
    '500': '#829AB1',
    '600': '#627D98',
    '700': '#486581',
    '800': '#334E68',
    '900': '#243B53',
  },
  primary: {
    '50': '#EFF6FF',
    '100': '#DBEAFE',
    '200': '#BFDBFE',
    '300': '#93C5FD',
    '400': '#60A5FA',
    '500': '#3B82F6',
    '600': '#2563EB',
    '700': '#1D4ED8',
    '800': '#1E40AF',
    '900': '#1E3A8A',
  },
  secondary: {
    '50': '#EFF6FF',
    '100': '#DBEAFE',
    '200': '#BFDBFE',
    '300': '#93C5FD',
    '400': '#60A5FA',
    '500': '#3B82F6',
    '600': '#2563EB',
    '700': '#1D4ED8',
    '800': '#1E40AF',
    '900': '#1E3A8A',
  },
};
