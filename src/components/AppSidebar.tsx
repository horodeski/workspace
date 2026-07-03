import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  Inbox,
  BookOpen,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Minha Rotina', path: '/routine', icon: ListChecks },
  { label: 'Inbox', path: '/inbox', icon: Inbox },
  { label: 'Journal', path: '/journal', icon: BookOpen },
  { label: 'Relatórios', path: '/reports', icon: BarChart3 },
  { label: 'Configurações', path: '/settings', icon: Settings },
];

export function AppSidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card px-3 py-6">
      <div className="mb-8 px-3">
        <h1 className="text-lg font-semibold text-foreground">Work Journal</h1>
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
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
