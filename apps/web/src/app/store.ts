import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState } from '../types.d.ts';

const initialScreener: AppState['screener'] = {
  peMax: undefined,
  roeMin: undefined,
  sort: 'score_desc',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ---- auth ----
      token: null,
      user: null,
      isAuthed: false,

      setAuth: ({ token, user }) =>
        set({
          token,
          user: user ?? null,
          isAuthed: Boolean(token),
        }),

      logout: () =>
        set({
          token: null,
          user: null,
          isAuthed: false,
        }),
      theme: 'midnight',
      sidebarOpen: false,

      setTheme: (theme) => set(() => ({ theme })),
      setSidebarOpen: (open) => set(() => ({ sidebarOpen: open })),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),

      mode: () => {
        const theme = get().theme;
        if (theme === 'light') return 'light';
        if (theme === 'dark') return 'dark';
        const hours = new Date().getHours();
        return hours >= 7 && hours < 19 ? 'light' : 'dark';
      },
      screener: initialScreener,
      setScreener: (partial) =>
        set({ screener: { ...get().screener, ...partial } }),
      resetScreener: () => set({ screener: initialScreener }),
    }),
    {
      name: 'morpho-web-app-state-v1',
      version: 1,
      partialize: (state) => ({
        // Persist token only; everything else is in-memory
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          set({ isAuthed: true });
        }
      },
    }
  )
);
