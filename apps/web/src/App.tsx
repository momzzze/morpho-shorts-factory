import './App.css';
import { useEffect } from 'react';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { useAppStore } from '@/app/store';
import { api } from '@/app/apiClient';

// Create the router instance
const router = createRouter({ routeTree });

// Register the router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);
  const setAuth = useAppStore((s) => s.setAuth);

  // On reload: if we have a token but no user, hydrate from /auth/me
  useEffect(() => {
    let cancelled = false;
    if (!token || user) return;

    (async () => {
      try {
        const me = await api<{ user: any }>('/auth/me');
        const nextUser = (me as any)?.user ?? me;
        if (!cancelled) setAuth({ token, user: nextUser });
      } catch (error) {
        // api() will logout on 401; just log other errors
        console.error('Failed to hydrate user from /auth/me', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, user, setAuth]);

  return <RouterProvider router={router} />;
}

export default App;
