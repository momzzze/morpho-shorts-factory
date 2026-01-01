import { createFileRoute } from '@tanstack/react-router';
import { useTheme } from '../theme';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { tokens, theme, mode } = useTheme();

  return (
    <div className="container mx-auto p-8 lg:p-12">
      <section className="mb-12">
        <h1
          className="text-4xl font-bold mb-4"
          style={{ color: tokens.primary }}
        >
          🎬 Morpho Shorts Factory
        </h1>
        <p className="text-lg opacity-80">
          Current: <span className="font-semibold capitalize">{theme}</span> |{" "}
          <span className="font-semibold capitalize">{mode} mode</span>
        </p>
      </section>

      <section className="mb-12">
        <div
          className="p-6 rounded-lg"
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.border,
            borderWidth: '1px',
          }}
        >
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ color: tokens.primary }}
          >
            Welcome to Morpho
          </h2>
          <p className="opacity-80 mb-4">
            Use the theme button (🎨) to switch between themes, and the mode
            button (🌙/☀️) to toggle dark/light mode.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="p-6 rounded-lg"
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              borderWidth: '1px',
            }}
          >
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: tokens.primary }}
            >
              11 Themes
            </h3>
            <p className="opacity-70">Beautiful color palettes</p>
          </div>

          <div
            className="p-6 rounded-lg"
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              borderWidth: '1px',
            }}
          >
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: tokens.secondary }}
            >
              Dark/Light Mode
            </h3>
            <p className="opacity-70">Automatic theme adaptation</p>
          </div>

          <div
            className="p-6 rounded-lg"
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              borderWidth: '1px',
            }}
          >
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: tokens.success }}
            >
              Fully Responsive
            </h3>
            <p className="opacity-70">Works on all devices</p>
          </div>
        </div>
      </section>
    </div>
  );
}
