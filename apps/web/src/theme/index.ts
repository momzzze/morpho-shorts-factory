import type { ThemeName, ThemeTokens, ThemeMode } from './types';

import { rose } from './themes/rose';
import { synth } from './themes/synth';
import { volcano } from './themes/volcano';
import { emerald } from './themes/emerald';
import { sunset } from './themes/sunset';
import { ocean } from './themes/ocean';
import { midnight } from './themes/midnight';
import { lavender } from './themes/lavender';
import { forest } from './themes/forest';
import { desert } from './themes/desert';
import { arctic } from './themes/arctic';

export type { ThemeName, ThemeTokens, ThemeMode };

export const themes: Record<ThemeName, ThemeTokens> = {
  synth,
  emerald,
  sunset,
  ocean,
  midnight,
  rose,
  lavender,
  forest,
  desert,
  arctic,
  volcano,
};

export { ThemeProvider, useTheme } from './ThemeContext';
export * from './palettes/arctic.palette';
export * from './palettes/desert.palette';
export * from './palettes/emerald.palette';
export * from './palettes/forest.palette';
export * from './palettes/lavender.palette';
export * from './palettes/midnight.palette';
export * from './palettes/ocean.palette';
export * from './palettes/rose.palette';
export * from './palettes/sunset.palette';
export * from './palettes/synth.palette';
export * from './palettes/volcano.palette';
