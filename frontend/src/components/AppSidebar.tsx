import { NavLink } from 'react-router-dom';
import {
  Calendar,
  ListChecks,
  BookOpen,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Separator } from '@/components/ui/separator';

interface SidebarItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

const sidebarItems: SidebarItem[] = [
  { label: 'Lembretes', path: '/', icon: Calendar },
  { label: 'Card de apoio', path: '/routine', icon: ListChecks },
  { label: 'Quadros', path: '/boards', icon: Lightbulb },
  { label: 'Weekly Review', path: '/weekly-review', icon: BookOpen },
];

export function AppSidebar() {
  return (
    <div className="flex h-screen">
      <aside className="flex w-60 flex-col bg-card px-3 py-6">
        <div className="mb-8 px-3">
          <h1 className="text-lg font-semibold text-foreground">Workspace</h1>
        </div>

        <nav className="flex flex-1 flex-col gap-1" aria-label="Navegação principal">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pt-4">
          <p className="text-xs text-muted-foreground">
            Desenvolvido por Geovana Horodeski
          </p>
        </div>
      </aside>
      <Separator orientation="vertical" />
    </div>
  );
}
