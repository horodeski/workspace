import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
