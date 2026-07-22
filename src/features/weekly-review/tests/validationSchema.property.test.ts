import * as fc from 'fast-check';
import { reviewFormSchema, stripHtml } from '../types/review.types';

/**
 * Property 9: Validation Schema Correctness (Rich Text)
 *
 * For any set of five fields that are all empty or contain only whitespace/HTML tags,
 * the `reviewFormSchema` SHALL reject the form. For any set of five fields where at
 * least one contains non-whitespace text content (even wrapped in HTML), the schema
 * SHALL accept the form.
 *
 * Note: Max length (500 chars) is now enforced at the editor level, not the schema level.
 *
 * **Validates: Requirements 12.1, 12.2**
 */
describe('Feature: weekly-review, Property 9: Validation schema correctness', () => {
  it('stripHtml correctly strips HTML tags', () => {
    expect(stripHtml('<p>Hello</p>')).toBe('Hello');
    expect(stripHtml('<p><strong>Bold</strong> text</p>')).toBe('Bold text');
    expect(stripHtml('<p></p>')).toBe('');
    expect(stripHtml('')).toBe('');
  });

  it('reviewFormSchema rejects form data where all five fields are empty or whitespace-only', () => {
    const whitespaceArb = fc.oneof(
      fc.constant(''),
      fc.constant('<p></p>'),
      fc
        .array(fc.constantFrom(' ', '\t', '\n', '\r'), {
          minLength: 1,
          maxLength: 50,
        })
        .map((chars) => chars.join('')),
      fc
        .array(fc.constantFrom(' ', '\t', '\n', '\r'), {
          minLength: 1,
          maxLength: 50,
        })
        .map((chars) => `<p>${chars.join('')}</p>`)
    );

    fc.assert(
      fc.property(
        whitespaceArb,
        whitespaceArb,
        whitespaceArb,
        whitespaceArb,
        whitespaceArb,
        (learning, decisions, resolvedProblems, timeWaste, nextWeekFocus) => {
          const result = reviewFormSchema.safeParse({
            learning,
            decisions,
            resolvedProblems,
            timeWaste,
            nextWeekFocus,
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('reviewFormSchema accepts form data where at least one field has non-whitespace content', () => {
    // Generate a valid field: HTML with at least one non-whitespace char
    const validFieldArb = fc
      .string({ minLength: 1, maxLength: 500 })
      .filter((s) => s.trim().length > 0)
      .map((s) => `<p>${s}</p>`);

    // Generate an optional field: either empty or valid HTML content
    const optionalFieldArb = fc.oneof(
      fc.constant(''),
      fc.constant('<p></p>'),
      fc.string({ minLength: 1, maxLength: 200 }).map((s) => `<p>${s}</p>`)
    );

    // Pick one index to guarantee at least one non-whitespace field
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }),
        validFieldArb,
        optionalFieldArb,
        optionalFieldArb,
        optionalFieldArb,
        optionalFieldArb,
        (
          nonEmptyIndex,
          validValue,
          optional1,
          optional2,
          optional3,
          optional4
        ) => {
          const fields = [optional1, optional2, optional3, optional4];
          fields.splice(nonEmptyIndex, 0, validValue);

          const result = reviewFormSchema.safeParse({
            learning: fields[0],
            decisions: fields[1],
            resolvedProblems: fields[2],
            timeWaste: fields[3],
            nextWeekFocus: fields[4],
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
