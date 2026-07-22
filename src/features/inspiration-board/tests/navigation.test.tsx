import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { InspirationBoardPage } from '../pages/InspirationBoardPage';

describe('Navigation Integration', () => {
  describe('Sidebar contains "Inspiração" link', () => {
    it('renders a link with text "Inspiração" and href "/inspiration"', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppSidebar />
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name: /Inspiração/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/inspiration');
    });
  });

  describe('/inspiration route renders InspirationBoardPage', () => {
    it('renders the "Quadro de Inspiração" heading when navigating to /inspiration', () => {
      render(
        <MemoryRouter initialEntries={['/inspiration']}>
          <Routes>
            <Route path="/inspiration" element={<InspirationBoardPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(
        screen.getByRole('heading', { name: /Quadro de Inspiração/i })
      ).toBeInTheDocument();
    });
  });

  describe('Active styling applies at /inspiration', () => {
    it('applies active state to "Inspiração" NavLink when at /inspiration', () => {
      render(
        <MemoryRouter initialEntries={['/inspiration']}>
          <AppSidebar />
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name: /Inspiração/i });
      expect(link).toHaveAttribute('aria-current', 'page');
      expect(link).toHaveClass('active');
    });

    it('does not apply active state to "Inspiração" NavLink when at a different route', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppSidebar />
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name: /Inspiração/i });
      expect(link).not.toHaveAttribute('aria-current', 'page');
      expect(link).not.toHaveClass('active');
    });
  });
});
