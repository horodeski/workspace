import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { CalendarPage } from '../features/calendar/pages/CalendarPage';
import { RoutinePage } from '../features/routine/pages/RoutinePage';
import { BoardModulePage } from '../features/board-module/pages/BoardModulePage';
import { WeeklyReviewPage } from '../features/weekly-review/pages/WeeklyReviewPage';
import { WeeklyReviewEditPage } from '../features/weekly-review/pages/WeeklyReviewEditPage';
import { NotFoundPage } from './NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <CalendarPage /> },
      { path: '/routine', element: <RoutinePage /> },
      { path: '/boards', element: <BoardModulePage /> },
      { path: '/weekly-review', element: <WeeklyReviewPage /> },
      { path: '/weekly-review/:year/:week', element: <WeeklyReviewEditPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
