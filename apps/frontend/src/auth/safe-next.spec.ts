import { describe, expect, it } from 'bun:test';
import { safeNext } from './safe-next';

describe('safeNext', () => {
  it.each(['/account', '/events/abc?tab=votes#top'])(
    'keeps the local path %p',
    (path) => {
      expect(safeNext(path)).toBe(path);
    },
  );

  it.each([
    null,
    '',
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/\t/evil.test',
    '/\n/evil.test',
    '/.//evil.test',
    '/a/..//evil.test',
    '/%2e%2e//evil.test',
    'javascript:alert(1)',
  ])('falls back to / for %p', (next) => {
    expect(safeNext(next)).toBe('/');
  });
});
