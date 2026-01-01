import { Menu } from 'lucide-react';
import { useTheme } from '../theme';
import { Button } from '@/components/ui/button';

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { tokens } = useTheme();

  return (
    <header
      style={{
        backgroundColor: tokens.surface,
        borderBottom: `1px solid ${tokens.border}`,
        color: tokens.fg,
      }}
      className="w-full sticky top-0 z-40 h-16 flex items-center justify-between px-6"
    >
      <div className="flex items-center gap-3">
        {/* Sidebar toggle button - always visible */}
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <h1
          className="text-lg font-semibold tracking-tight"
          style={{ color: tokens.primary }}
        >
          Morpho
        </h1>
      </div>

      {/* Empty right side */}
      <div />
    </header>
  );
}
