import * as fc from 'fast-check';
import { useReviewStore } from '../hooks/useReviewStore';

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
  const dateStringArb = fc.constant('2025-01-06'); // valid ISO date string

  it('saveReview always results in isLocked === true', () => {
    fc.assert(
      fc.property(
        reviewFormDataArb,
        weekNumberArb,
        yearArb,
        dateStringArb,
        dateStringArb,
        (formData, weekNumber, year, startDate, endDate) => {
          useReviewStore.setState({ reviews: [] });

          useReviewStore.getState().saveReview({
            ...formData,
            weekNumber,
            year,
            startDate,
            endDate,
          });

          const review = useReviewStore.getState().getReviewByWeek(year, weekNumber);
          expect(review).toBeDefined();
          expect(review!.isLocked).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('unlockReview always results in isLocked === false', () => {
    fc.assert(
      fc.property(
        reviewFormDataArb,
        weekNumberArb,
        yearArb,
        dateStringArb,
        dateStringArb,
        (formData, weekNumber, year, startDate, endDate) => {
          useReviewStore.setState({ reviews: [] });

          // Save to create a locked review
          useReviewStore.getState().saveReview({
            ...formData,
            weekNumber,
            year,
            startDate,
            endDate,
          });

          const review = useReviewStore.getState().getReviewByWeek(year, weekNumber);
          expect(review).toBeDefined();
          expect(review!.isLocked).toBe(true);

          // Unlock the review
          useReviewStore.getState().unlockReview(review!.id);

          const unlocked = useReviewStore.getState().getReviewByWeek(year, weekNumber);
          expect(unlocked).toBeDefined();
          expect(unlocked!.isLocked).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('re-saving after unlock results in isLocked === true again', () => {
    fc.assert(
      fc.property(
        reviewFormDataArb,
        weekNumberArb,
        yearArb,
        dateStringArb,
        dateStringArb,
        (formData, weekNumber, year, startDate, endDate) => {
          useReviewStore.setState({ reviews: [] });

          // Step 1: Save → locked
          useReviewStore.getState().saveReview({
            ...formData,
            weekNumber,
            year,
            startDate,
            endDate,
          });

          const saved = useReviewStore.getState().getReviewByWeek(year, weekNumber);
          expect(saved).toBeDefined();
          expect(saved!.isLocked).toBe(true);

          // Step 2: Unlock → unlocked
          useReviewStore.getState().unlockReview(saved!.id);

          const unlocked = useReviewStore.getState().getReviewByWeek(year, weekNumber);
          expect(unlocked).toBeDefined();
          expect(unlocked!.isLocked).toBe(false);

          // Step 3: Re-save → locked again
          useReviewStore.getState().saveReview({
            ...formData,
            weekNumber,
            year,
            startDate,
            endDate,
          });

          const reSaved = useReviewStore.getState().getReviewByWeek(year, weekNumber);
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
    useReviewStore.setState({ reviews: [] });
  });

  it('getRecentWeeks() with default count returns at most 12 items', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            weekNumber: fc.integer({ min: 1, max: 53 }),
            year: fc.integer({ min: 2020, max: 2030 }),
          }),
          { minLength: 0, maxLength: 30 }
        ),
        (reviewSpecs) => {
          // Seed the store with reviews for various weeks
          useReviewStore.setState({ reviews: [] });
          const { saveReview } = useReviewStore.getState();
          for (const spec of reviewSpecs) {
            saveReview({
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

          const result = useReviewStore.getState().getRecentWeeks();
          expect(result.length).toBeLessThanOrEqual(12);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getRecentWeeks(count) returns at most count items for random count 1–20', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.array(
          fc.record({
            weekNumber: fc.integer({ min: 1, max: 53 }),
            year: fc.integer({ min: 2020, max: 2030 }),
          }),
          { minLength: 0, maxLength: 30 }
        ),
        (count, reviewSpecs) => {
          useReviewStore.setState({ reviews: [] });
          const { saveReview } = useReviewStore.getState();
          for (const spec of reviewSpecs) {
            saveReview({
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

          const result = useReviewStore.getState().getRecentWeeks(count);
          expect(result.length).toBeLessThanOrEqual(count);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('items are in strict reverse chronological order', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.array(
          fc.record({
            weekNumber: fc.integer({ min: 1, max: 53 }),
            year: fc.integer({ min: 2020, max: 2030 }),
          }),
          { minLength: 0, maxLength: 30 }
        ),
        (count, reviewSpecs) => {
          useReviewStore.setState({ reviews: [] });
          const { saveReview } = useReviewStore.getState();
          for (const spec of reviewSpecs) {
            saveReview({
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

          const result = useReviewStore.getState().getRecentWeeks(count);

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

  it('hasReview and isLocked correctly reflect saved reviews', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            weekNumber: fc.integer({ min: 1, max: 53 }),
            year: fc.integer({ min: 2020, max: 2030 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (reviewSpecs) => {
          useReviewStore.setState({ reviews: [] });
          const { saveReview } = useReviewStore.getState();

          // Save reviews (these become locked after save)
          for (const spec of reviewSpecs) {
            saveReview({
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

          const result = useReviewStore.getState().getRecentWeeks();
          const reviews = useReviewStore.getState().reviews;

          // Verify ordering still holds
          for (let i = 0; i < result.length - 1; i++) {
            const current = result[i];
            const next = result[i + 1];
            const isStrictlyBefore =
              current.year > next.year ||
              (current.year === next.year && current.weekNumber > next.weekNumber);
            expect(isStrictlyBefore).toBe(true);
          }

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
  });

  it('saving same weekNumber/year N times results in exactly one review with original createdAt and updated updatedAt', () => {
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

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 53 }), // weekNumber
        fc.integer({ min: 2000, max: 2099 }), // year
        fc.array(formDataArb, { minLength: 2, maxLength: 10 }), // N saves
        (weekNumber, year, formDataList) => {
          // Reset store before each property run
          useReviewStore.setState({ reviews: [] });

          const startDate = `${year}-01-01`;
          const endDate = `${year}-01-07`;

          // Perform first save
          useReviewStore.getState().saveReview({
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
            useReviewStore.getState().saveReview({
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
  });

  it('id is a valid UUID v4', () => {
    fc.assert(
      fc.property(validFormDataArb, (formData) => {
        useReviewStore.setState({ reviews: [] });

        useReviewStore.getState().saveReview(formData);

        const reviews = useReviewStore.getState().reviews;
        expect(reviews).toHaveLength(1);
        expect(reviews[0].id).toMatch(UUID_V4_REGEX);
      }),
      { numRuns: 100 }
    );
  });

  it('createdAt is a valid ISO 8601 datetime', () => {
    fc.assert(
      fc.property(validFormDataArb, (formData) => {
        useReviewStore.setState({ reviews: [] });

        useReviewStore.getState().saveReview(formData);

        const reviews = useReviewStore.getState().reviews;
        expect(reviews).toHaveLength(1);

        const createdAt = reviews[0].createdAt;
        const parsed = new Date(createdAt);
        expect(parsed.getTime()).not.toBeNaN();
      }),
      { numRuns: 100 }
    );
  });

  it('updatedAt is a valid ISO 8601 datetime', () => {
    fc.assert(
      fc.property(validFormDataArb, (formData) => {
        useReviewStore.setState({ reviews: [] });

        useReviewStore.getState().saveReview(formData);

        const reviews = useReviewStore.getState().reviews;
        expect(reviews).toHaveLength(1);

        const updatedAt = reviews[0].updatedAt;
        const parsed = new Date(updatedAt);
        expect(parsed.getTime()).not.toBeNaN();
      }),
      { numRuns: 100 }
    );
  });

  it('updatedAt >= createdAt', () => {
    fc.assert(
      fc.property(validFormDataArb, (formData) => {
        useReviewStore.setState({ reviews: [] });

        useReviewStore.getState().saveReview(formData);

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
