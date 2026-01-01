import type { ThemeTokens, ThemePalette, ThemeMode } from '../types';

export function mapPaletteToTokens(
  p: ThemePalette,
  mode: ThemeMode = 'dark'
): ThemeTokens {
  if (mode === 'light') {
    return {
      bg: p.neutral['50'],
      fg: p.neutral['900'],
      surface: p.neutral['100'],
      border: p.neutral['300'],
      primary: p.primary['600'],
      secondary: p.secondary['600'],
      danger: p.danger['600'],
      warning: p.warning['600'],
      success: p.success['600'],
    };
  }

  // Dark mode (default)
  return {
    bg: p.neutral['900'],
    fg: p.neutral['50'],
    surface: p.neutral['800'],
    border: p.neutral['700'],
    primary: p.primary['400'],
    secondary: p.secondary['400'],
    danger: p.danger['500'],
    warning: p.warning['500'],
    success: p.success['500'],
  };
}
