import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useTheme } from '../theme';
import { useAppStore } from '@/app/store';

// Auth layout for /auth/*
export const Route = createFileRoute('/auth')({
  beforeLoad: () => {
    const { token } = useAppStore.getState();
    if (token) {
      throw redirect({ to: '/' });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { tokens } = useTheme();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: tokens.bg, color: tokens.fg }}
    >
      <Outlet />
    </div>
  );
}
