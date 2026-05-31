import { withOptionalTimeout } from '../../../src/utils/optionalAsync';

describe('withOptionalTimeout', () => {
  it('returns the fallback when optional work takes too long', async () => {
    const result = await withOptionalTimeout(
      new Promise((resolve) => setTimeout(() => resolve('slow'), 50)),
      1,
      'fallback'
    );

    expect(result).toBe('fallback');
  });

  it('returns the resolved value when optional work is fast', async () => {
    const result = await withOptionalTimeout(Promise.resolve('fast'), 50, 'fallback');

    expect(result).toBe('fast');
  });
});
