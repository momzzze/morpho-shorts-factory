import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ThemeName, ThemeTokens, ThemeMode } from './types';

import { arcticPalette } from './palettes/arctic.palette';
import { desertPalette } from './palettes/desert.palette';
import { emeraldPalette } from './palettes/emerald.palette';
import { forestPalette } from './palettes/forest.palette';
import { lavenderPalette } from './palettes/lavender.palette';
import { midnightPalette } from './palettes/midnight.palette';
import { oceanPalette } from './palettes/ocean.palette';
import { rosePalette } from './palettes/rose.palette';
import { sunsetPalette } from './palettes/sunset.palette';
import { synthPalette } from './palettes/synth.palette';
import { volcanoPalette } from './palettes/volcano.palette';
import { mapPaletteToTokens } from './palettes/mapToTokens';

const palettes = {
  synth: synthPalette,
  emerald: emeraldPalette,
  sunset: sunsetPalette,
  ocean: oceanPalette,
  midnight: midnightPalette,
  rose: rosePalette,
  lavender: lavenderPalette,
  forest: forestPalette,
  desert: desertPalette,
  arctic: arcticPalette,
  volcano: volcanoPalette,
};

interface ThemeContextType {
  theme: ThemeName;
  mode: ThemeMode;
  tokens: ThemeTokens;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'morpho-theme';
const MODE_STORAGE_KEY = 'morpho-theme-mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as ThemeName) || 'synth';
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;

    // Auto-detect system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Compute tokens based on current theme and mode
  const tokens = mapPaletteToTokens(palettes[theme], mode);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
  };

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  // Apply CSS custom properties to :root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg', tokens.bg);
    root.style.setProperty('--fg', tokens.fg);
    root.style.setProperty('--surface', tokens.surface);
    root.style.setProperty('--border', tokens.border);
    root.style.setProperty('--primary', tokens.primary);
    root.style.setProperty('--secondary', tokens.secondary);
    root.style.setProperty('--danger', tokens.danger);
    root.style.setProperty('--warning', tokens.warning);
    root.style.setProperty('--success', tokens.success);

    // Add data attribute for mode-specific styling
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-mode', mode);
  }, [tokens, theme, mode]);

  return (
    <ThemeContext.Provider
      value={{ theme, mode, tokens, setTheme, setMode, toggleMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
