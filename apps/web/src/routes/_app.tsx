import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { useTheme } from '../theme';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useAppStore } from '@/app/store';

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    const token = useAppStore.getState().token;
    if (!token) {
      throw redirect({ to: '/home' });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { tokens } = useTheme();
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: tokens.bg, color: tokens.fg }}
    >
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* KEY CHANGE: put Sidebar + Main into the same flex row */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto no-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
