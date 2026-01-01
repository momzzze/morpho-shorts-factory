export type ThemeName =
  | 'synth'
  | 'emerald'
  | 'sunset'
  | 'ocean'
  | 'midnight'
  | 'rose'
  | 'lavender'
  | 'forest'
  | 'desert'
  | 'arctic'
  | 'volcano';

export type ThemeMode = 'light' | 'dark';

export type ThemeTokens = {
  bg: string;
  fg: string;
  surface: string;
  border: string;

  primary: string;
  secondary: string;
  danger: string;
  warning: string;
  success: string;
};

export type ColorScale =
  | '50'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';

export type Scale = Record<ColorScale, string>;

export type ThemePalette = {
  neutral: Scale;

  primary: Scale;
  secondary: Scale;

  danger: Scale;
  warning: Scale;
  success: Scale;

  accent?: Scale;
};
