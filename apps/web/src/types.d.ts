import type { ThemeName } from './theme';

export type AppState = {
  // ---- auth ----
  token: string | null;
  user: User | null;
  isAuthed: boolean;

  setAuth: (payload: { token: string; user?: User | null }) => void;
  logout: () => void;

  // ---- ui ----
  theme: ThemeName;
  sidebarOpen: boolean;

  setTheme: (theme: ThemeName) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  mode: () => 'light' | 'dark';
  screener: {
    peMax?: number;
    roeMin?: number;
    sort?: 'score_desc' | 'score_asc';
  };

  setScreener: (partial: Partial<AppState['screener']>) => void;
  resetScreener: () => void;
};

export type User = {
  id: string;
  email: string;
  name?: string;
};
