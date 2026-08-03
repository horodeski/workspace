import * as fc from 'fast-check';
import { useReviewStore } from '../hooks/useReviewStore';

// Mock the api module so async store methods resolve immediately
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
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    del: jest.fn(),
  },
}));

// Import the mocked api so we can control return values
import { api } from '@/lib/api';
const mockedApi = api as jest.Mocked<typeof api>;

/**
 * Helper: configure mocks so that saveReview (post/put) and unlockReview (post)
 * return properly shaped Review objects, simulating the backend.
 */
function setupApiMocks() {
  // POST /reviews — create a new review
  mockedApi.post.mockImplementation(async (url: string, body?: unknown) => {
    const data = body as Record<string, unknown>;
    const now = new Date().toISOString();
    if (url === '/reviews') {
      return {
        id: crypto.randomUUID(),
        weekNumber: data.weekNumber,
        year: data.year,
        startDate: data.startDate,
        endDate: data.endDate,
        learning: data.learning,
        decisions: data.decisions,
        resolvedProblems: data.resolvedProblems,
        timeWaste: data.timeWaste,
        nextWeekFocus: data.nextWeekFocus,
        createdAt: now,
        updatedAt: now,
        isLocked: true,
      };
    }
    // POST /reviews/:id/unlock
    if (url.match(/\/reviews\/[^/]+\/unlock/)) {
      const id = url.split('/')[2];
      const review = useReviewStore.getState().reviews.find((r) => r.id === id);
      return {
        ...review,
        isLocked: false,
        updatedAt: now,
      };
    }
    return {};
  });

  // PUT /reviews/:id — update existing review
  mockedApi.put.mockImplementation(async (url: string, body?: unknown) => {
    const data = body as Record<string, unknown>;
    const id = url.split('/').pop()!;
    const review = useReviewStore.getState().reviews.find((r) => r.id === id);
    const now = new Date().toISOString();
    return {
      ...review,
      ...data,
      updatedAt: now,
      isLocked: true,
    };
  });

  // GET /reviews/:year/:weekNumber
  mockedApi.get.mockImplementation(async (url: string) => {
    const parts = url.split('/');
    const year = parseInt(parts[2]);
    const weekNumber = parseInt(parts[3]);
    const review = useReviewStore.getState().reviews.find(
      (r) => r.year === year && r.weekNumber === weekNumber
    );
    if (!review) {
      const { ApiError } = jest.requireMock('@/lib/api');
      throw new ApiError(404, 'Not found');
    }
    return review;
  });
}

/**
 * Property 6: Lock/Unlock State Transitions
 *
 * For any review, calling `saveReview` SHALL always result in `isLocked === true`.
 * For any locked review, calling `unlockReview` SHALL always result in `isLocked === false`.
 * These transitions are deterministic regardless of prior state.
 *
 * **Validates: Requirements 6.5, 7.4, 7.5**
 */
describe('Feature: weekly-review, Property 6: Lock/unlock state transitions', () => {
  beforeEach(() => {
    useReviewStore.setState({ reviews: [] });
    jest.clearAllMocks();
    setupApiMocks();
  });

  // Arbitrary for valid review form data (at least one non-whitespace field, all ≤ 500 chars)
  const reviewFormDataArb = fc.record({
    learning: fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
    decisions: fc.string({ minLength: 0, maxLength: 500 }),
    resolvedProblems: fc.string({ minLength: 0, maxLength: 500 }),
    timeWaste: fc.string({ minLength: 0, maxLength: 500 }),
    nextWeekFocus: fc.string({ minLength: 0, maxLength: 500 }),
  });

  const weekNumberArb = fc.integer({ min: 1, max: 53 });
  const yearArb = fc.integer({ min: 2020, max: 2030 });
  const dateStringArb = fc.constant('2025-01-06');

  it('saveReview always results in isLocked === true', async () => {
    await fc.assert(
      fc.asyncProperty(
        reviewFormDataArb,
        weekNumberArb,
        yearArb,
        dateStringArb,
        dateStringArb,
        async (formData, weekNumber, year, startDate, endDate) => {
          useReviewStore.setState({ reviews: [] });

          await useReviewStore.getState().saveReview({
            ...formData,
            weekNumber,
            year,
            startDate,
            endDate,
          });

          const reviews = useReviewStore.getState().reviews;
          const review = reviews.find(
            (r) => r.weekNumber === weekNumber && r.year === year
          );
          expect(review).toBeDefined();
          expect(review!.isLocked).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('unlockReview always results in isLocked === false', async () => {
    await fc.assert(
      fc.asyncProperty(
        reviewFormDataArb,
        weekNumberArb,
        yearArb,
        dateStringArb,
        dateStringArb,
        async (formData, weekNumber, year, startDate, endDate) => {
          useReviewStore.setState({ reviews: [] });

          // Save to create a locked review
          await useReviewStore.getState().saveReview({
            ...formData,
            weekNumber,
            year,
            startDate,
            endDate,
          });

          const reviews = useReviewStore.getState().reviews;
          const review = reviews.find(
            (r) => r.weekNumber === weekNumber && r.year === year
          );
          expect(review).toBeDefined();
          expect(review!.isLocked).toBe(true);

          // Unlock the review
          await useReviewStore.getState().unlockReview(review!.id);

          const updated = useReviewStore.getState().reviews.find(
            (r) => r.weekNumber === weekNumber && r.year === year
          );
          expect(updated).toBeDefined();
          expect(updated!.isLocked).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('re-saving after unlock results in isLocked === true again', async () => {
    await fc.assert(
      fc.asyncProperty(
        reviewFormDataArb,
        weekNumberArb,
        yearArb,
        dateStringArb,
        dateStringArb,
        async (formData, weekNumber, year, startDate, endDate) => {
          useReviewStore.setState({ reviews: [] });

          // Step 1: Save → locked
          await useReviewStore.getState().saveReview({
            ...formData,
            weekNumber,
            year,
            startDate,
            endDate,
          });

          const saved = useReviewStore.getState().reviews.find(
            (r) => r.weekNumber === weekNumber && r.year === year
          );
          expect(saved).toBeDefined();
          expect(saved!.isLocked).toBe(true);

          // Step 2: Unlock → unlocked
          await useReviewStore.getState().unlockReview(saved!.id);

          const unlocked = useReviewStore.getState().reviews.find(
            (r) => r.weekNumber === weekNumber && r.year === year
          );
          expect(unlocked).toBeDefined();
          expect(unlocked!.isLocked).toBe(false);

          // Step 3: Re-save → locked again
          await useReviewStore.getState().saveReview({
            ...formData,
            weekNumber,
            year,
            startDate,
            endDate,
          });

          const reSaved = useReviewStore.getState().reviews.find(
            (r) => r.weekNumber === weekNumber && r.year === year
          );
          expect(reSaved).toBeDefined();
          expect(reSaved!.isLocked).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 2: History Ordering and Capping
 *
 * For any collection of reviews spanning arbitrary weeks and years,
 * `getRecentWeeks` SHALL return items in strictly reverse chronological order
 * (year descending, then weekNumber descending within the same year) and the
 * result SHALL contain at most 12 items.
 *
 * **Validates: Requirements 3.1, 3.4**
 */
describe('Feature: weekly-review, Property 2: History ordering and capping', () => {
  beforeEach(() => {
    useReviewStore.setState({ reviews: [], recentWeeks: [] });
    jest.clearAllMocks();
    setupApiMocks();
  });

  it('getRecentWeeks() returns at most 12 items', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            weekNumber: fc.integer({ min: 1, max: 53 }),
            year: fc.integer({ min: 2020, max: 2030 }),
          }),
          { minLength: 0, maxLength: 30 }
        ),
        async (reviewSpecs) => {
          useReviewStore.setState({ reviews: [], recentWeeks: [] });

          // Save reviews to build state
          for (const spec of reviewSpecs) {
            await useReviewStore.getState().saveReview({
              weekNumber: spec.weekNumber,
              year: spec.year,
              startDate: '2025-01-01',
              endDate: '2025-01-07',
              learning: 'test',
              decisions: '',
              resolvedProblems: '',
              timeWaste: '',
              nextWeekFocus: '',
            });
          }

          // Build history items from saved reviews (deduplicated)
          const reviews = useReviewStore.getState().reviews;
          const historyItems: Array<{ weekNumber: number; year: number; hasReview: boolean; isLocked: boolean }> = reviews
            .map((r) => ({
              weekNumber: r.weekNumber,
              year: r.year,
              hasReview: true,
              isLocked: r.isLocked,
            }))
            .sort((a, b) => b.year - a.year || b.weekNumber - a.weekNumber)
            .slice(0, 12);

          // Mock fetchRecentWeeks to set the recentWeeks from reviews
          mockedApi.get.mockImplementationOnce(async () => historyItems);
          await useReviewStore.getState().fetchRecentWeeks();

          const result = useReviewStore.getState().getRecentWeeks();
          expect(result.length).toBeLessThanOrEqual(12);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getRecentWeeks(count) returns at most count items for random count 1–20', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 20 }),
        fc.array(
          fc.record({
            weekNumber: fc.integer({ min: 1, max: 53 }),
            year: fc.integer({ min: 2020, max: 2030 }),
          }),
          { minLength: 0, maxLength: 30 }
        ),
        async (count, reviewSpecs) => {
          useReviewStore.setState({ reviews: [], recentWeeks: [] });

          for (const spec of reviewSpecs) {
            await useReviewStore.getState().saveReview({
              weekNumber: spec.weekNumber,
              year: spec.year,
              startDate: '2025-01-01',
              endDate: '2025-01-07',
              learning: 'test',
              decisions: '',
              resolvedProblems: '',
              timeWaste: '',
              nextWeekFocus: '',
            });
          }

          const reviews = useReviewStore.getState().reviews;
          const historyItems = reviews
            .map((r) => ({
              weekNumber: r.weekNumber,
              year: r.year,
              hasReview: true,
              isLocked: r.isLocked,
            }))
            .sort((a, b) => b.year - a.year || b.weekNumber - a.weekNumber)
            .slice(0, count);

          mockedApi.get.mockImplementationOnce(async () => historyItems);
          await useReviewStore.getState().fetchRecentWeeks(count);

          const result = useReviewStore.getState().getRecentWeeks();
          expect(result.length).toBeLessThanOrEqual(count);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('items are in strict reverse chronological order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 20 }),
        fc.array(
          fc.record({
            weekNumber: fc.integer({ min: 1, max: 53 }),
            year: fc.integer({ min: 2020, max: 2030 }),
          }),
          { minLength: 2, maxLength: 30 }
        ),
        async (count, reviewSpecs) => {
          useReviewStore.setState({ reviews: [], recentWeeks: [] });

          for (const spec of reviewSpecs) {
            await useReviewStore.getState().saveReview({
              weekNumber: spec.weekNumber,
              year: spec.year,
              startDate: '2025-01-01',
              endDate: '2025-01-07',
              learning: 'test',
              decisions: '',
              resolvedProblems: '',
              timeWaste: '',
              nextWeekFocus: '',
            });
          }

          const reviews = useReviewStore.getState().reviews;
          const historyItems = reviews
            .map((r) => ({
              weekNumber: r.weekNumber,
              year: r.year,
              hasReview: true,
              isLocked: r.isLocked,
            }))
            .sort((a, b) => b.year - a.year || b.weekNumber - a.weekNumber)
            .slice(0, count);

          mockedApi.get.mockImplementationOnce(async () => historyItems);
          await useReviewStore.getState().fetchRecentWeeks(count);

          const result = useReviewStore.getState().getRecentWeeks();

          // Verify strict reverse chronological order
          for (let i = 0; i < result.length - 1; i++) {
            const current = result[i];
            const next = result[i + 1];
            const isStrictlyBefore =
              current.year > next.year ||
              (current.year === next.year && current.weekNumber > next.weekNumber);
            expect(isStrictlyBefore).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('hasReview and isLocked correctly reflect saved reviews', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            weekNumber: fc.integer({ min: 1, max: 53 }),
            year: fc.integer({ min: 2020, max: 2030 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (reviewSpecs) => {
          useReviewStore.setState({ reviews: [], recentWeeks: [] });

          for (const spec of reviewSpecs) {
            await useReviewStore.getState().saveReview({
              weekNumber: spec.weekNumber,
              year: spec.year,
              startDate: '2025-01-01',
              endDate: '2025-01-07',
              learning: 'test',
              decisions: '',
              resolvedProblems: '',
              timeWaste: '',
              nextWeekFocus: '',
            });
          }

          const reviews = useReviewStore.getState().reviews;
          const historyItems = reviews
            .map((r) => ({
              weekNumber: r.weekNumber,
              year: r.year,
              hasReview: true,
              isLocked: r.isLocked,
            }))
            .sort((a, b) => b.year - a.year || b.weekNumber - a.weekNumber)
            .slice(0, 12);

          mockedApi.get.mockImplementationOnce(async () => historyItems);
          await useReviewStore.getState().fetchRecentWeeks();

          const result = useReviewStore.getState().getRecentWeeks();

          // Verify hasReview and isLocked reflect actual store data
          for (const item of result) {
            const matchingReview = reviews.find(
              (r) => r.year === item.year && r.weekNumber === item.weekNumber
            );
            if (matchingReview) {
              expect(item.hasReview).toBe(true);
              expect(item.isLocked).toBe(matchingReview.isLocked);
            } else {
              expect(item.hasReview).toBe(false);
              expect(item.isLocked).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 5: Upsert Idempotence
 *
 * For any weekNumber/year combination, saving a review N times (N ≥ 1) SHALL result
 * in exactly one review existing for that weekNumber/year combination in the store,
 * and the `createdAt` field SHALL remain unchanged from the first save while
 * `updatedAt` SHALL reflect the most recent save.
 *
 * **Validates: Requirements 8.4**
 */
describe('Feature: weekly-review, Property 5: Upsert idempotence', () => {
  beforeEach(() => {
    useReviewStore.setState({ reviews: [] });
    jest.clearAllMocks();
    setupApiMocks();
  });

  it('saving same weekNumber/year N times results in exactly one review with original createdAt and updated updatedAt', async () => {
    const validFieldArb = fc
      .string({ minLength: 1, maxLength: 500 })
      .filter((s) => s.trim().length > 0);

    const formDataArb = fc.record({
      learning: validFieldArb,
      decisions: validFieldArb,
      resolvedProblems: validFieldArb,
      timeWaste: validFieldArb,
      nextWeekFocus: validFieldArb,
    });

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 53 }), // weekNumber
        fc.integer({ min: 2000, max: 2099 }), // year
        fc.array(formDataArb, { minLength: 2, maxLength: 10 }), // N saves
        async (weekNumber, year, formDataList) => {
          // Reset store before each property run
          useReviewStore.setState({ reviews: [] });

          const startDate = `${year}-01-01`;
          const endDate = `${year}-01-07`;

          // Perform first save
          await useReviewStore.getState().saveReview({
            ...formDataList[0],
            weekNumber,
            year,
            startDate,
            endDate,
          });

          // Capture createdAt after first save
          const firstReview = useReviewStore
            .getState()
            .reviews.find(
              (r) => r.weekNumber === weekNumber && r.year === year
            );
          expect(firstReview).toBeDefined();
          const originalCreatedAt = firstReview!.createdAt;

          // Perform remaining saves
          for (let i = 1; i < formDataList.length; i++) {
            await useReviewStore.getState().saveReview({
              ...formDataList[i],
              weekNumber,
              year,
              startDate,
              endDate,
            });
          }

          // Verify: exactly one review for this weekNumber/year
          const matchingReviews = useReviewStore
            .getState()
            .reviews.filter(
              (r) => r.weekNumber === weekNumber && r.year === year
            );
          expect(matchingReviews).toHaveLength(1);

          const finalReview = matchingReviews[0];

          // Verify: createdAt unchanged from first save
          expect(finalReview.createdAt).toBe(originalCreatedAt);

          // Verify: updatedAt >= createdAt
          expect(
            new Date(finalReview.updatedAt).getTime()
          ).toBeGreaterThanOrEqual(new Date(finalReview.createdAt).getTime());
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 4: Save Metadata Correctness
 *
 * For any newly created review, the resulting `id` SHALL be a valid UUID v4 string,
 * `createdAt` SHALL be a valid ISO 8601 datetime, and `updatedAt` SHALL be a valid
 * ISO 8601 datetime that is greater than or equal to `createdAt`.
 *
 * **Validates: Requirements 8.2, 8.3**
 */
describe('Feature: weekly-review, Property 4: Save metadata correctness', () => {
  const UUID_V4_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  // Generator for valid form data (at least one non-whitespace field, all ≤ 500 chars)
  const validFieldArb = fc
    .string({ minLength: 1, maxLength: 500 })
    .filter((s) => s.trim().length > 0);

  const optionalFieldArb = fc.oneof(
    fc.constant(''),
    fc.string({ minLength: 0, maxLength: 200 })
  );

  const validFormDataArb = fc.record({
    learning: validFieldArb,
    decisions: optionalFieldArb,
    resolvedProblems: optionalFieldArb,
    timeWaste: optionalFieldArb,
    nextWeekFocus: optionalFieldArb,
    weekNumber: fc.integer({ min: 1, max: 53 }),
    year: fc.integer({ min: 2000, max: 2099 }),
    startDate: fc.constant('2025-01-06'),
    endDate: fc.constant('2025-01-12'),
  });

  beforeEach(() => {
    useReviewStore.setState({ reviews: [] });
    jest.clearAllMocks();
    setupApiMocks();
  });

  it('id is a valid UUID v4', async () => {
    await fc.assert(
      fc.asyncProperty(validFormDataArb, async (formData) => {
        useReviewStore.setState({ reviews: [] });

        await useReviewStore.getState().saveReview(formData);

        const reviews = useReviewStore.getState().reviews;
        expect(reviews).toHaveLength(1);
        expect(reviews[0].id).toMatch(UUID_V4_REGEX);
      }),
      { numRuns: 100 }
    );
  });

  it('createdAt is a valid ISO 8601 datetime', async () => {
    await fc.assert(
      fc.asyncProperty(validFormDataArb, async (formData) => {
        useReviewStore.setState({ reviews: [] });

        await useReviewStore.getState().saveReview(formData);

        const reviews = useReviewStore.getState().reviews;
        expect(reviews).toHaveLength(1);

        const createdAt = reviews[0].createdAt;
        const parsed = new Date(createdAt);
        expect(parsed.getTime()).not.toBeNaN();
      }),
      { numRuns: 100 }
    );
  });

  it('updatedAt is a valid ISO 8601 datetime', async () => {
    await fc.assert(
      fc.asyncProperty(validFormDataArb, async (formData) => {
        useReviewStore.setState({ reviews: [] });

        await useReviewStore.getState().saveReview(formData);

        const reviews = useReviewStore.getState().reviews;
        expect(reviews).toHaveLength(1);

        const updatedAt = reviews[0].updatedAt;
        const parsed = new Date(updatedAt);
        expect(parsed.getTime()).not.toBeNaN();
      }),
      { numRuns: 100 }
    );
  });

  it('updatedAt >= createdAt', async () => {
    await fc.assert(
      fc.asyncProperty(validFormDataArb, async (formData) => {
        useReviewStore.setState({ reviews: [] });

        await useReviewStore.getState().saveReview(formData);

        const reviews = useReviewStore.getState().reviews;
        expect(reviews).toHaveLength(1);

        const createdAtTime = new Date(reviews[0].createdAt).getTime();
        const updatedAtTime = new Date(reviews[0].updatedAt).getTime();
        expect(updatedAtTime).toBeGreaterThanOrEqual(createdAtTime);
      }),
      { numRuns: 100 }
    );
  });
});
