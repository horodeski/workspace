import { NavLink } from 'react-router-dom';
import {
  Calendar,
  ListChecks,
  BookOpen,
  Lightbulb,
  LogOut,
  User,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/app/AuthProvider';

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
  const { logout, user } = useAuth();

  const apiBase = import.meta.env.VITE_API_URL || '';

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

        <div className="px-3 pt-4 space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2">
              {user.avatarUrl ? (
                <img
                  src={`${apiBase}${user.avatarUrl}`}
                  alt={user.name}
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
            </div>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
      <Separator orientation="vertical" />
    </div>
  );
}
