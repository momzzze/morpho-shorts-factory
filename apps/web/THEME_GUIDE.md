# 🎨 Morpho Theme System - Complete Guide

## Overview

The Morpho theme system provides **11 beautiful color themes** with **automatic dark/light mode support**. Each theme has carefully crafted color palettes with 10 shades (50-900) for neutral, primary, secondary, and semantic colors (danger, warning, success).

## Architecture

```
src/theme/
├── index.ts                  # Main export file
├── types.ts                  # TypeScript types
├── ThemeContext.tsx          # React Context + Provider
├── palettes/
│   ├── mapToTokens.ts       # Maps palette scales to tokens (dark/light)
│   ├── shared.semantic.ts   # Shared danger/warning/success scales
│   ├── arctic.palette.ts    # ❄️ Arctic theme palette
│   ├── desert.palette.ts    # 🏜️ Desert theme palette
│   ├── emerald.palette.ts   # 💚 Emerald theme palette
│   ├── forest.palette.ts    # 🌲 Forest theme palette
│   ├── lavender.palette.ts  # 💜 Lavender theme palette
│   ├── midnight.palette.ts  # 🌙 Midnight theme palette
│   ├── ocean.palette.ts     # 🌊 Ocean theme palette
│   ├── rose.palette.ts      # 🌹 Rose theme palette
│   ├── sunset.palette.ts    # 🌅 Sunset theme palette
│   ├── synth.palette.ts     # ⚡ Synth theme palette
│   └── volcano.palette.ts   # 🌋 Volcano theme palette
└── themes/
    ├── arctic.ts            # Arctic theme tokens (legacy)
    ├── desert.ts            # Desert theme tokens (legacy)
    └── ... (other themes)
```

## Quick Start

### 1. Wrap Your App with ThemeProvider

```tsx
// main.tsx
import { ThemeProvider } from './theme';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
```

### 2. Use the Theme Hook

```tsx
import { useTheme } from './theme';

function MyComponent() {
  const { theme, mode, tokens, setTheme, setMode, toggleMode } = useTheme();

  return (
    <div style={{ backgroundColor: tokens.bg, color: tokens.fg }}>
      <h1 style={{ color: tokens.primary }}>Hello {theme}!</h1>
      <button onClick={toggleMode}>
        Toggle {mode === 'light' ? 'Dark' : 'Light'} Mode
      </button>
    </div>
  );
}
```

## Available Themes

| Theme      | Description              | Best For                |
| ---------- | ------------------------ | ----------------------- |
| `synth`    | Vibrant neon purple/pink | Creative, modern apps   |
| `emerald`  | Fresh green tones        | Health, nature apps     |
| `sunset`   | Warm orange/red hues     | Social, energetic apps  |
| `ocean`    | Cool cyan/teal colors    | Productivity, calm apps |
| `midnight` | Dark monochrome          | Professional, minimal   |
| `rose`     | Soft pink tones          | Elegant, feminine       |
| `lavender` | Purple/violet shades     | Creative, artistic      |
| `forest`   | Deep green tones         | Environmental, outdoor  |
| `desert`   | Warm sand/orange         | Travel, adventure       |
| `arctic`   | Light blue/gray          | Clean, professional     |
| `volcano`  | Fiery red/orange         | Bold, dynamic           |

## Theme Tokens

Every theme provides these color tokens:

```typescript
type ThemeTokens = {
  bg: string; // Background color
  fg: string; // Foreground (text) color
  surface: string; // Card/surface background
  border: string; // Border color
  primary: string; // Primary accent color
  secondary: string; // Secondary accent color
  danger: string; // Error/danger color
  warning: string; // Warning color
  success: string; // Success color
};
```

### Dark Mode Mapping

```typescript
bg: neutral[900]; // Darkest
fg: neutral[50]; // Lightest
surface: neutral[800];
border: neutral[700];
primary: primary[400]; // Brighter for contrast
secondary: secondary[400];
danger: danger[500];
warning: warning[500];
success: success[500];
```

### Light Mode Mapping

```typescript
bg: neutral[50]; // Lightest
fg: neutral[900]; // Darkest
surface: neutral[100];
border: neutral[300];
primary: primary[600]; // Darker for contrast
secondary: secondary[600];
danger: danger[600];
warning: warning[600];
success: success[600];
```

## Using the Theme Hook

```tsx
import { useTheme } from './theme';

function ThemeSwitcher() {
  const {
    theme, // Current theme name: 'synth' | 'emerald' | ...
    mode, // Current mode: 'light' | 'dark'
    tokens, // Current color tokens
    setTheme, // (theme: ThemeName) => void
    setMode, // (mode: ThemeMode) => void
    toggleMode, // () => void - Switch between light/dark
  } = useTheme();

  return (
    <div>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeName)}
      >
        <option value="synth">Synth</option>
        <option value="emerald">Emerald</option>
        {/* ... other themes */}
      </select>

      <button onClick={toggleMode}>
        {mode === 'light' ? '🌙 Dark' : '☀️ Light'}
      </button>
    </div>
  );
}
```

## CSS Custom Properties

The theme system automatically injects CSS custom properties on the `:root` element:

```css
:root {
  --bg: #1e1b2a;
  --fg: #e0d7f3;
  --surface: #2a2438;
  --border: #3e3354;
  --primary: #ff6ac1;
  --secondary: #9d7fea;
  --danger: #ff4c61;
  --warning: #ffb86c;
  --success: #50fa7b;
}

:root[data-theme='synth'][data-mode='dark'] {
  /* Automatically updated */
}
```

You can use them in CSS:

```css
.button {
  background-color: var(--primary);
  color: var(--bg);
  border: 1px solid var(--border);
}

.card {
  background-color: var(--surface);
  color: var(--fg);
}
```

Or with Tailwind v4:

```tsx
<button className="bg-[var(--primary)] text-[var(--bg)] px-4 py-2 rounded">
  Themed Button
</button>
```

## Persistence

Theme preferences are automatically saved to `localStorage`:

- **Theme**: `morpho-theme` (e.g., "synth")
- **Mode**: `morpho-theme-mode` (e.g., "dark")

The system also respects the user's system preference on first load via `prefers-color-scheme`.

## Component Examples

### Button with Theme

```tsx
function ThemedButton({ children, onClick }: ButtonProps) {
  const { tokens, mode } = useTheme();

  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: tokens.primary,
        color: mode === 'dark' ? tokens.bg : '#fff',
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
```

### Card with Theme

```tsx
function ThemedCard({ title, children }: CardProps) {
  const { tokens } = useTheme();

  return (
    <div
      style={{
        backgroundColor: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: '0.75rem',
        padding: '1.5rem',
      }}
    >
      <h3 style={{ color: tokens.primary, marginBottom: '1rem' }}>{title}</h3>
      <p style={{ color: tokens.fg, opacity: 0.8 }}>{children}</p>
    </div>
  );
}
```

### Alert Component

```tsx
type AlertType = 'success' | 'warning' | 'danger';

function Alert({ type, message }: { type: AlertType; message: string }) {
  const { tokens } = useTheme();

  const color =
    type === 'success'
      ? tokens.success
      : type === 'warning'
      ? tokens.warning
      : tokens.danger;

  return (
    <div
      style={{
        backgroundColor: `${color}20`, // 20% opacity
        border: `1px solid ${color}`,
        borderRadius: '0.5rem',
        padding: '1rem',
        color: color,
      }}
    >
      {message}
    </div>
  );
}
```

## Advanced: Creating Custom Themes

### 1. Create a Palette File

```typescript
// palettes/custom.palette.ts
import type { ThemePalette } from '../types';
import { dangerScale, warningScale, successScale } from './shared.semantic';

export const customPalette: ThemePalette = {
  danger: dangerScale,
  warning: warningScale,
  success: successScale,
  neutral: {
    '50': '#F5F5F5',
    '100': '#E5E5E5',
    '200': '#D4D4D4',
    '300': '#A3A3A3',
    '400': '#737373',
    '500': '#525252',
    '600': '#404040',
    '700': '#262626',
    '800': '#171717',
    '900': '#0A0A0A',
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
    // ... similar structure
  },
};
```

### 2. Add to Types

```typescript
// types.ts
export type ThemeName =
  | 'synth'
  | 'emerald'
  // ... existing themes
  | 'custom'; // Add your theme
```

### 3. Register in ThemeContext

```typescript
// ThemeContext.tsx
import { customPalette } from './palettes/custom.palette';

const palettes = {
  // ... existing palettes
  custom: customPalette,
};
```

## Best Practices

1. **Use tokens, not hardcoded colors**: Always use `tokens.primary` instead of `#FF6AC1`
2. **Test both modes**: Make sure your UI works in light and dark mode
3. **Respect user preference**: The system auto-detects system preference
4. **Consistent spacing**: Tokens handle colors, use Tailwind/CSS for spacing
5. **Accessibility**: Ensure sufficient contrast (especially in custom themes)

## Tips

- Use `opacity` for subtle variations: `style={{ color: tokens.fg, opacity: 0.6 }}`
- For hover states, use CSS filters: `filter: brightness(1.1)`
- Theme names are lowercase strings: `'synth'`, not `'Synth'`
- Mode switching is instant with CSS custom properties
- Check `tokens` object in DevTools to see current colors

## Demo

Run the development server to see the full theme demo:

```bash
cd apps/web
pnpm dev
```

The demo showcases:

- All 11 themes with visual picker
- Light/dark mode toggle
- Color token showcase
- Component examples (buttons, cards, alerts)
- Real-time theme switching

---

**Happy theming! 🎨**
