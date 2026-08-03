import { validateBoardName, validateItemContent } from '../hooks/validation';

describe('validateBoardName', () => {
  it('accepts a valid name', () => {
    const result = validateBoardName('Meu Quadro');
    expect(result).toEqual({ success: true });
  });

  it('trims whitespace before validating', () => {
    const result = validateBoardName('  Nome com espaços  ');
    expect(result).toEqual({ success: true });
  });

  it('rejects an empty string', () => {
    const result = validateBoardName('');
    expect(result.success).toBe(false);
    expect(result.error).toBe('O nome é obrigatório');
  });

  it('rejects a string with only spaces', () => {
    const result = validateBoardName('     ');
    expect(result.success).toBe(false);
    expect(result.error).toBe('O nome é obrigatório');
  });

  it('rejects a name exceeding 50 characters after trim', () => {
    const longName = 'a'.repeat(51);
    const result = validateBoardName(longName);
    expect(result.success).toBe(false);
    expect(result.error).toBe('O nome deve ter no máximo 50 caracteres');
  });

  it('accepts a name with exactly 50 characters', () => {
    const name = 'a'.repeat(50);
    const result = validateBoardName(name);
    expect(result).toEqual({ success: true });
  });

  it('accepts a single character name', () => {
    const result = validateBoardName('A');
    expect(result).toEqual({ success: true });
  });
});

describe('validateItemContent', () => {
  it('accepts valid content', () => {
    const result = validateItemContent('Some content');
    expect(result).toEqual({ success: true });
  });

  it('rejects empty content', () => {
    const result = validateItemContent('');
    expect(result.success).toBe(false);
    expect(result.error).toBe('O conteúdo é obrigatório');
  });

  it('rejects content exceeding 500 characters', () => {
    const longContent = 'a'.repeat(501);
    const result = validateItemContent(longContent);
    expect(result.success).toBe(false);
    expect(result.error).toBe('O conteúdo deve ter no máximo 500 caracteres');
  });

  it('accepts content with exactly 500 characters', () => {
    const content = 'a'.repeat(500);
    const result = validateItemContent(content);
    expect(result).toEqual({ success: true });
  });

  it('accepts a single character content', () => {
    const result = validateItemContent('X');
    expect(result).toEqual({ success: true });
  });
});
