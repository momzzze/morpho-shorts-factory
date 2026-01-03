import { useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAppStore } from '@/app/store';

export const Route = createFileRoute('/')({
  component: RootRedirect,
});

function RootRedirect() {
  const { token } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate({ to: '/dashboard', replace: true });
    } else {
      navigate({ to: '/home', replace: true });
    }
  }, [token, navigate]);

  return null;
}
