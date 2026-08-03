import { describe, it, expect } from 'vitest';
import { sanitizeHtml, hasNonEmptyContent } from './sanitization.js';

describe('sanitizeHtml', () => {
  it('removes script tags', () => {
    const result = sanitizeHtml('<script>alert("xss")</script>');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert');
  });

  it('removes event handler attributes', () => {
    const result = sanitizeHtml('<p onclick="alert(1)">text</p>');
    expect(result).not.toContain('onclick');
    expect(result).toContain('<p>text</p>');
  });

  it('preserves allowed formatting tags', () => {
    const input = '<p><strong>bold</strong> and <em>italic</em></p>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('preserves list tags', () => {
    const input = '<ul><li>item 1</li><li>item 2</li></ul>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('preserves heading tags', () => {
    const input = '<h1>Title</h1><h2>Sub</h2><h3>SubSub</h3>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('preserves blockquote and code', () => {
    const input = '<blockquote>quote</blockquote><code>code</code>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('strips disallowed tags like img, iframe, div', () => {
    const result = sanitizeHtml('<div><img src="x.png"><iframe src="evil.com"></iframe></div>');
    expect(result).not.toContain('<div');
    expect(result).not.toContain('<img');
    expect(result).not.toContain('<iframe');
  });

  it('removes all attributes from allowed tags', () => {
    const result = sanitizeHtml('<p class="danger" style="color:red">text</p>');
    expect(result).toBe('<p>text</p>');
  });

  it('removes javascript: URLs', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">link</a>');
    expect(result).not.toContain('javascript:');
  });
});

describe('hasNonEmptyContent', () => {
  it('returns true for plain text', () => {
    expect(hasNonEmptyContent('hello')).toBe(true);
  });

  it('returns true for HTML with text content', () => {
    expect(hasNonEmptyContent('<p>hello</p>')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(hasNonEmptyContent('')).toBe(false);
  });

  it('returns false for whitespace-only string', () => {
    expect(hasNonEmptyContent('   ')).toBe(false);
  });

  it('returns false for empty HTML tags', () => {
    expect(hasNonEmptyContent('<p></p><br>')).toBe(false);
  });

  it('returns false for HTML tags with only whitespace', () => {
    expect(hasNonEmptyContent('<p>   </p>')).toBe(false);
  });

  it('returns true for nested tags with text', () => {
    expect(hasNonEmptyContent('<p><strong>text</strong></p>')).toBe(true);
  });
});
