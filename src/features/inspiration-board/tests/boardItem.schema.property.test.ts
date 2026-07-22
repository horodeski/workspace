import * as fc from 'fast-check';
import { boardItemSchema } from '../types/board.types';

/**
 * Property 2: Invalid content is rejected by validation
 *
 * For any string that is empty, composed entirely of whitespace, or exceeds
 * 500 characters, the validation schema SHALL reject it and produce the
 * appropriate error message.
 *
 * **Validates: Requirements 1.2, 1.3**
 */
describe('Feature: inspiration-board, Property 2: Invalid content is rejected by validation', () => {
  const validType = 'quote' as const;

  it('rejects empty strings with "O conteúdo é obrigatório"', () => {
    fc.assert(
      fc.property(fc.constant(''), (content) => {
        const result = boardItemSchema.safeParse({ content, type: validType });
        expect(result.success).toBe(false);
        if (!result.success) {
          const messages = result.error.issues.map((i) => i.message);
          expect(messages).toContain('O conteúdo é obrigatório');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('rejects whitespace-only strings with "O conteúdo não pode conter apenas espaços"', () => {
    const whitespaceArb = fc
      .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 500 })
      .map((chars) => chars.join(''));

    fc.assert(
      fc.property(whitespaceArb, (content) => {
        const result = boardItemSchema.safeParse({ content, type: validType });
        expect(result.success).toBe(false);
        if (!result.success) {
          const messages = result.error.issues.map((i) => i.message);
          expect(messages).toContain(
            'O conteúdo não pode conter apenas espaços'
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it('rejects strings exceeding 500 characters with "O conteúdo deve ter no máximo 500 caracteres"', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 501, maxLength: 1000 }),
        (content) => {
          const result = boardItemSchema.safeParse({ content, type: validType });
          expect(result.success).toBe(false);
          if (!result.success) {
            const messages = result.error.issues.map((i) => i.message);
            expect(messages).toContain(
              'O conteúdo deve ter no máximo 500 caracteres'
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
