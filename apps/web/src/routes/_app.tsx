import { useState } from 'react';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { useTheme } from '../theme';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';

export const Route = createFileRoute('/_app')({
  component: AppLayout,
});

function AppLayout() {
  const { tokens } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: tokens.bg, color: tokens.fg }}
    >
      {/* Header - full width */}
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Scrollable main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
