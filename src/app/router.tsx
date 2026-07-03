import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { RoutinePage } from '../features/routine/pages/RoutinePage';
import { InboxPage } from '../features/inbox/pages/InboxPage';
import { JournalPage } from '../features/journal/pages/JournalPage';
import { ReportsPage } from '../features/reports/pages/ReportsPage';
import { NotFoundPage } from './NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/routine', element: <RoutinePage /> },
      { path: '/inbox', element: <InboxPage /> },
      { path: '/journal', element: <JournalPage /> },
      { path: '/reports', element: <ReportsPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
