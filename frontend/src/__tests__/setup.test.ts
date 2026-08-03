describe('Jest setup', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should support TypeScript', () => {
    const greet = (name: string): string => `Hello, ${name}`;
    expect(greet('World')).toBe('Hello, World');
  });
});
