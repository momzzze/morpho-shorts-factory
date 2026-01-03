import { useEffect, useRef, useState } from 'react';
import {
  Moon,
  Sun,
  Palette,
  Check,
  LogIn,
  UserPlus,
  LogOut,
  User,
} from 'lucide-react';
import { useTheme, type ThemeName } from '../theme';
import { RadioIndicator } from './RadioIndicator';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useAppStore } from '@/app/store';

const allThemes: ThemeName[] = [
  'synth',
  'emerald',
  'sunset',
  'ocean',
  'midnight',
  'rose',
  'lavender',
  'forest',
  'desert',
  'arctic',
  'volcano',
];

// Example nav items (replace with your routes)
const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/convert', label: 'Convert' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' },
];

function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;

    function onDown(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [ref, onClose, enabled]);
}

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { tokens, mode, toggleMode, theme, setTheme } = useTheme();
  const { token, user, logout } = useAppStore();
  const navigate = useNavigate();
  // theme dropdown state
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);
  useOutsideClick(themeRef, () => setThemeOpen(false), themeOpen);

  // active route (optional)
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  return (
    <>
      {/* Overlay - only on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        style={{
          backgroundColor: tokens.surface,
          borderRight: `1px solid ${tokens.border}`,
          color: tokens.fg,
        }}
        className={[
          // Mobile: off-canvas, full height
          'fixed left-0 top-0 z-40 w-72 overflow-hidden h-screen',
          'transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full',

          // Desktop: respect isOpen state too
          'lg:static lg:h-full',
          'lg:border-r',
        ].join(' ')}
      >
        <div className="h-full flex flex-col">
          {/* Top: Brand */}
          <div
            className="h-12 shrink-0 px-4 flex items-center border-b"
            style={{ borderColor: tokens.border }}
          >
            <div
              className="text-base font-semibold"
              style={{ color: tokens.primary }}
            >
              Morpho
            </div>
          </div>

          {/* Middle: ONLY this scrolls */}
          <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-1.5">
            {navItems.map((item) => {
              const active =
                pathname === item.to || pathname.startsWith(item.to + '/');
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    // close on mobile after navigation
                    onClose();
                  }}
                  className={[
                    'block rounded-lg px-3 py-2 text-sm font-medium transition',
                    'hover:opacity-90',
                  ].join(' ')}
                  style={{
                    backgroundColor: active ? tokens.bg : 'transparent',
                    border: active
                      ? `1px solid ${tokens.border}`
                      : '1px solid transparent',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom: User / Auth + Appearance */}
          <div
            className="p-3 border-t space-y-2 sticky bottom-0"
            style={{
              borderColor: tokens.border,
              backgroundColor: tokens.surface,
            }}
          >
            <div className="text-[11px] font-semibold uppercase opacity-60">
              Account
            </div>

            {/* Auth buttons when logged out */}
            {!token && (
              <div className="flex gap-2">
                <Link
                  to="/auth/login"
                  onClick={onClose}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-semibold"
                  style={{
                    borderColor: tokens.border,
                    color: tokens.fg,
                    backgroundColor: tokens.surface,
                  }}
                >
                  <LogIn className="h-4 w-4" /> Login
                </Link>
                <Link
                  to="/auth/register"
                  onClick={onClose}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold"
                  style={{ backgroundColor: tokens.primary, color: tokens.bg }}
                >
                  <UserPlus className="h-4 w-4" /> Register
                </Link>
              </div>
            )}

            {/* User info + logout when authed */}
            {token && (
              <div
                className="flex items-center gap-3 rounded-lg border px-3 py-2"
                style={{
                  borderColor: tokens.border,
                  backgroundColor: tokens.surface,
                }}
              >
                <div
                  className="h-9 w-9 rounded-full bg-black/10 flex items-center justify-center"
                  style={{ color: tokens.primary }}
                >
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {user?.name || user?.email || 'User'}
                  </div>
                  <div className="text-xs opacity-70 truncate">
                    {user?.email || 'Logged in'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    onClose();
                    navigate({ to: '/home', replace: true });
                  }}
                  className="inline-flex items-center gap-1 text-[13px] font-semibold"
                  style={{ color: tokens.primary }}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}

            <div className="text-[11px] font-semibold uppercase opacity-60 mb-2">
              Appearance
            </div>

            <div className="flex items-center gap-2">
              {/* Theme button + dropdown */}
              <div className="relative flex-1" ref={themeRef}>
                <button
                  onClick={() => setThemeOpen((v) => !v)}
                  style={{
                    backgroundColor: tokens.surface,
                    borderColor: tokens.border,
                    color: tokens.fg,
                  }}
                  className="
                    w-full inline-flex items-center justify-between
                    h-9 rounded-lg border px-3
                    text-[13px] font-medium shadow-sm transition
                    hover:opacity-90 active:scale-[0.99]
                    focus:outline-none
                  "
                  aria-label="Select theme"
                  aria-expanded={themeOpen}
                >
                  <span className="inline-flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <span className="capitalize">{theme}</span>
                  </span>

                  {/* small color dot */}
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: tokens.primary }}
                  />
                </button>

                {themeOpen && (
                  <div
                    style={{
                      backgroundColor: tokens.surface,
                      borderColor: tokens.border,
                    }}
                    className="absolute left-0 bottom-[calc(100%+0.5rem)] w-full z-50
                               rounded-xl border shadow-lg overflow-hidden"
                  >
                    <div className="max-h-64 overflow-y-auto py-1">
                      {allThemes.map((t) => {
                        const active = t === theme;
                        return (
                          <button
                            key={t}
                            onClick={() => {
                              setTheme(t);
                              setThemeOpen(false);
                            }}
                            style={{
                              backgroundColor: active
                                ? tokens.bg
                                : 'transparent',
                            }}
                            className="
                              w-full flex items-center justify-between
                              px-3 py-2 text-[13px] capitalize
                              hover:opacity-80 transition
                            "
                          >
                            <span className="flex items-center gap-3">
                              <RadioIndicator
                                checked={active}
                                primary={tokens.primary}
                                border={tokens.border}
                                foreground={tokens.bg}
                              />
                              {t}
                            </span>

                            {active && <Check className="h-4 w-4 opacity-70" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Mode toggle (compact) */}
              <button
                onClick={toggleMode}
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.border,
                  color: tokens.fg,
                }}
                className="
                  inline-flex h-9 w-9 items-center justify-center
                  rounded-lg border shadow-sm transition
                  hover:opacity-90 active:scale-[0.98]
                  focus:outline-none
                "
                aria-label={`Switch to ${
                  mode === 'light' ? 'dark' : 'light'
                } mode`}
                title={mode === 'light' ? 'Dark mode' : 'Light mode'}
              >
                {mode === 'dark' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Later: User / Logout block goes here */}
            {/* <div className="mt-4">...</div> */}
          </div>
        </div>
      </aside>
      {/* Overlay - visible when sidebar is open */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={onClose} />
      )}
    </>
  );
}
