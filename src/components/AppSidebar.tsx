import { NavLink } from 'react-router-dom';
import {
  Calendar,
  ListChecks,
  Inbox,
  BookOpen,
  BarChart3,
  Settings,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SidebarItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

const sidebarItems: SidebarItem[] = [
  { label: 'Lembretes', path: '/', icon: Calendar },
  { label: 'Card de apoio', path: '/routine', icon: ListChecks },
  { label: 'Ideias', path: '/inbox', icon: Inbox },
  { label: 'Inspiração', path: '/inspiration', icon: Lightbulb },
  // { label: 'Journal', path: '/journal', icon: BookOpen },
  { label: 'Weekly Review', path: '/weekly-review', icon: BookOpen },
  { label: 'Relatórios', path: '/reports', icon: BarChart3 },
  // { label: 'Configurações', path: '/settings', icon: Settings },
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
            <Button
              key={item.path}
              variant="ghost"
              asChild
              className={cn(
                'w-full justify-start gap-3',
                // NavLink will apply active styles via its className prop
              )}
            >
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            </Button>
          ))}
        </nav>
      </aside>
      <Separator orientation="vertical" />
    </div>
  );
}
