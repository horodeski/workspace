import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { WeeklyReviewEditPage } from '../pages/WeeklyReviewEditPage';
import { useReviewStore } from '../hooks/useReviewStore';
import type { Review } from '../types/review.types';

// Mock the api module so async store methods resolve with store state
jest.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {
    status: number;
    body?: unknown;
    constructor(status: number, message: string, body?: unknown) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.body = body;
    }
  },
  api: {
    get: jest.fn(async (url: string) => {
      // GET /reviews/:year/:weekNumber
      const match = url.match(/\/reviews\/(\d+)\/(\d+)/);
      if (match) {
        const year = parseInt(match[1]);
        const weekNumber = parseInt(match[2]);
        const review = useReviewStore.getState().reviews.find(
          (r) => r.year === year && r.weekNumber === weekNumber
        );
        if (!review) {
          const { ApiError: AE } = jest.requireMock('@/lib/api');
          throw new AE(404, 'Not found');
        }
        return review;
      }
      return null;
    }),
    post: jest.fn(async (url: string, body?: unknown) => {
      const data = body as Record<string, unknown> | undefined;
      const now = new Date().toISOString();
      if (url === '/reviews') {
        const newReview = {
          id: crypto.randomUUID(),
          weekNumber: data?.weekNumber,
          year: data?.year,
          startDate: data?.startDate,
          endDate: data?.endDate,
          learning: data?.learning,
          decisions: data?.decisions,
          resolvedProblems: data?.resolvedProblems,
          timeWaste: data?.timeWaste,
          nextWeekFocus: data?.nextWeekFocus,
          createdAt: now,
          updatedAt: now,
          isLocked: true,
        };
        return newReview;
      }
      // POST /reviews/:id/unlock
      if (url.match(/\/reviews\/[^/]+\/unlock/)) {
        const id = url.split('/')[2];
        const review = useReviewStore.getState().reviews.find((r) => r.id === id);
        return { ...review, isLocked: false, updatedAt: now };
      }
      return {};
    }),
    put: jest.fn(async (url: string, body?: unknown) => {
      const data = body as Record<string, unknown>;
      const id = url.split('/').pop()!;
      const review = useReviewStore.getState().reviews.find((r) => r.id === id);
      return { ...review, ...data, updatedAt: new Date().toISOString(), isLocked: true };
    }),
    patch: jest.fn(),
    del: jest.fn(),
  },
}));

// Mock useBlocker since it requires full data router context
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useBlocker: () => ({ state: 'idle', proceed: jest.fn(), reset: jest.fn() }),
  Navigate: (props: { to: string; replace?: boolean }) => {
    mockNavigate(props.to);
    return <div data-testid="navigate-redirect">{props.to}</div>;
  },
}));

// Clear persisted store data before module-level import rehydration causes issues
beforeAll(() => {
  localStorage.removeItem('weekly-review-storage');
  useReviewStore.setState({ reviews: [] });
});

function renderEditPage(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/weekly-review/:year/:week"
          element={<WeeklyReviewEditPage />}
        />
        <Route
          path="/weekly-review"
          element={<div data-testid="listing-page">Listing Page</div>}
        />
      </Routes>
    </MemoryRouter>
  );
}

function createLockedReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'test-review-id',
    weekNumber: 31,
    year: 2025,
    startDate: '2025-07-28T00:00:00.000Z',
    endDate: '2025-08-03T00:00:00.000Z',
    learning: '<p>Aprendi sobre testes</p>',
    decisions: '<p>Decidi melhorar cobertura</p>',
    resolvedProblems: '<p>Resolvi bug no form</p>',
    timeWaste: '<p>Reuniões longas</p>',
    nextWeekFocus: '<p>Focar em entregas</p>',
    createdAt: '2025-07-28T10:00:00.000Z',
    updatedAt: '2025-07-28T10:00:00.000Z',
    isLocked: true,
    ...overrides,
  };
}

describe('WeeklyReviewEditPage', () => {
  beforeEach(() => {
    localStorage.removeItem('weekly-review-storage');
    useReviewStore.setState({ reviews: [] });
    mockNavigate.mockClear();
  });

  afterEach(() => {
    localStorage.removeItem('weekly-review-storage');
  });

  describe('Invalid URL params redirect', () => {
    it('redirects to /weekly-review when year is non-numeric', () => {
      renderEditPage('/weekly-review/abc/31');
      expect(screen.getByTestId('navigate-redirect')).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/weekly-review');
    });

    it('redirects to /weekly-review when week is out of range (99)', () => {
      renderEditPage('/weekly-review/2025/99');
      expect(screen.getByTestId('navigate-redirect')).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/weekly-review');
    });

    it('redirects to /weekly-review when week is 0', () => {
      renderEditPage('/weekly-review/2025/0');
      expect(screen.getByTestId('navigate-redirect')).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/weekly-review');
    });

    it('redirects to /weekly-review when week is negative', () => {
      renderEditPage('/weekly-review/2025/-1');
      expect(screen.getByTestId('navigate-redirect')).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/weekly-review');
    });
  });

  describe('Locked state rendering', () => {
    beforeEach(() => {
      useReviewStore.setState({ reviews: [createLockedReview()] });
    });

    it('does not render toolbar when locked', async () => {
      renderEditPage('/weekly-review/2025/31');
      await waitFor(() => {
        expect(screen.getByText('Concluída.')).toBeInTheDocument();
      });
      expect(screen.queryByLabelText('Negrito')).not.toBeInTheDocument();
    });

    it('renders "Concluída." text in the locked banner', async () => {
      renderEditPage('/weekly-review/2025/31');
      await waitFor(() => {
        expect(screen.getByText('Concluída.')).toBeInTheDocument();
      });
    });

    it('renders the locked banner explanatory message', async () => {
      renderEditPage('/weekly-review/2025/31');
      await waitFor(() => {
        expect(
          screen.getByText('Esta revisão representa sua percepção naquele momento.')
        ).toBeInTheDocument();
      });
    });

    it('renders "Desbloquear edição" button', async () => {
      renderEditPage('/weekly-review/2025/31');
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Desbloquear edição' })
        ).toBeInTheDocument();
      });
    });

    it('does NOT render "Salvar revisão" button when locked', async () => {
      renderEditPage('/weekly-review/2025/31');
      await waitFor(() => {
        expect(screen.getByText('Concluída.')).toBeInTheDocument();
      });
      expect(
        screen.queryByRole('button', { name: 'Salvar revisão' })
      ).not.toBeInTheDocument();
    });
  });

  describe('Unlock flow', () => {
    beforeEach(() => {
      useReviewStore.setState({ reviews: [createLockedReview()] });
    });

    it('shows toolbar after clicking "Desbloquear edição"', async () => {
      renderEditPage('/weekly-review/2025/31');

      // Wait for locked state to render
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Desbloquear edição' })).toBeInTheDocument();
      });

      // Verify no toolbar when locked
      expect(screen.queryByLabelText('Negrito')).not.toBeInTheDocument();

      // Click unlock
      fireEvent.click(
        screen.getByRole('button', { name: 'Desbloquear edição' })
      );

      // Verify toolbar appears (editor is now editable)
      await waitFor(() => {
        expect(screen.getAllByLabelText('Negrito').length).toBeGreaterThan(0);
      });
    });

    it('shows "Salvar revisão" button after unlocking', async () => {
      renderEditPage('/weekly-review/2025/31');

      // Wait for locked state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Desbloquear edição' })).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', { name: 'Desbloquear edição' })
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Salvar revisão' })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Page structure', () => {
    it('renders the header with week number', async () => {
      renderEditPage('/weekly-review/2025/31');
      await waitFor(() => {
        expect(screen.getByText('Semana 31')).toBeInTheDocument();
      });
    });

    it('renders the subtitle text', async () => {
      renderEditPage('/weekly-review/2025/31');
      await waitFor(() => {
        expect(
          screen.getByText('Reserve 5 minutos para refletir sobre sua semana.')
        ).toBeInTheDocument();
      });
    });

    it('renders all 5 field labels', async () => {
      renderEditPage('/weekly-review/2025/31');
      await waitFor(() => {
        expect(screen.getByText('💡 Aprendizados')).toBeInTheDocument();
        expect(screen.getByText('⚖️ Decisões')).toBeInTheDocument();
        expect(screen.getByText('🧹 Problemas resolvidos')).toBeInTheDocument();
        expect(screen.getByText('⏳ Tempo')).toBeInTheDocument();
        expect(screen.getByText('🎯 Próxima semana')).toBeInTheDocument();
      });
    });

    it('renders "Salvar revisão" button for new reviews', async () => {
      renderEditPage('/weekly-review/2025/31');
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Salvar revisão' })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Validation error', () => {
    it('prevents save when all fields are empty', async () => {
      renderEditPage('/weekly-review/2025/31');

      // Verify page is in editable state
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Salvar revisão' })
        ).toBeInTheDocument();
      });

      // Submit without filling anything
      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'Salvar revisão' })
        );
      });

      // The review should NOT be saved to the store
      let savedReview: unknown;
      await act(async () => {
        savedReview = await useReviewStore.getState().getReviewByWeek(2025, 31);
      });
      expect(savedReview).toBeNull();

      // The page should remain in editable state (not transition to locked)
      expect(
        screen.getByRole('button', { name: 'Salvar revisão' })
      ).toBeInTheDocument();
      expect(screen.queryByText('Concluída.')).not.toBeInTheDocument();
    });
  });
});
