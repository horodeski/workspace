import * as fc from 'fast-check';
import {
  validateImageFile,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
} from '../services/imageValidation';

/**
 * Property 13: Image file validation
 *
 * For any file with a given MIME type and size: the validation function SHALL
 * accept the file if and only if its MIME type is one of `image/png`,
 * `image/jpeg`, `image/gif`, `image/webp` AND its size is ≤ 5,242,880 bytes (5MB).
 * All other files SHALL be rejected.
 *
 * **Validates: Requirements 8.7, 8.8**
 */
describe('Feature: freeform-inspiration-canvas, Property 13: Image file validation', () => {
  const acceptedMimeArb = fc.constantFrom(...ACCEPTED_IMAGE_TYPES);
  const validSizeArb = fc.integer({ min: 0, max: MAX_IMAGE_SIZE });
  const oversizeArb = fc.integer({ min: MAX_IMAGE_SIZE + 1, max: MAX_IMAGE_SIZE * 3 });
  const invalidMimeArb = fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => !ACCEPTED_IMAGE_TYPES.includes(s));

  it('accepts file iff MIME is accepted AND size <= 5MB', () => {
    fc.assert(
      fc.property(
        fc.string(), // random MIME type
        fc.nat({ max: MAX_IMAGE_SIZE * 3 }), // random file size
        (mimeType, fileSize) => {
          const result = validateImageFile(mimeType, fileSize);
          const shouldBeValid =
            ACCEPTED_IMAGE_TYPES.includes(mimeType) && fileSize <= MAX_IMAGE_SIZE;
          expect(result.valid).toBe(shouldBeValid);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('always accepts valid MIME types with size within limit', () => {
    fc.assert(
      fc.property(acceptedMimeArb, validSizeArb, (mimeType, fileSize) => {
        const result = validateImageFile(mimeType, fileSize);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('always rejects invalid MIME types regardless of size', () => {
    fc.assert(
      fc.property(
        invalidMimeArb,
        fc.nat({ max: MAX_IMAGE_SIZE * 3 }),
        (mimeType, fileSize) => {
          const result = validateImageFile(mimeType, fileSize);
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Accepted formats: PNG, JPEG, GIF, WebP');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('always rejects files exceeding 5MB even with valid MIME type', () => {
    fc.assert(
      fc.property(acceptedMimeArb, oversizeArb, (mimeType, fileSize) => {
        const result = validateImageFile(mimeType, fileSize);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Image must be under 5MB');
      }),
      { numRuns: 100 }
    );
  });

  it('validates boundary: exactly 5MB is accepted', () => {
    fc.assert(
      fc.property(acceptedMimeArb, (mimeType) => {
        const result = validateImageFile(mimeType, MAX_IMAGE_SIZE);
        expect(result.valid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('validates boundary: 5MB + 1 byte is rejected', () => {
    fc.assert(
      fc.property(acceptedMimeArb, (mimeType) => {
        const result = validateImageFile(mimeType, MAX_IMAGE_SIZE + 1);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Image must be under 5MB');
      }),
      { numRuns: 100 }
    );
  });
});
