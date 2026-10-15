import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

function rewriteTarget(path: string): string | null {
  return proxy(new NextRequest(`http://0.0.0.0:8080${path}`)).headers.get(
    'x-middleware-rewrite',
  );
}

describe('proxy', () => {
  const original = process.env.BACKEND_URL;

  beforeEach(() => {
    process.env.BACKEND_URL = 'https://backend.test';
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.BACKEND_URL;
    } else {
      process.env.BACKEND_URL = original;
    }
  });

  it('forwards /api/* to the backend without the prefix, keeping the query', () => {
    expect(rewriteTarget('/api/v1/events?limit=5')).toBe(
      'https://backend.test/v1/events?limit=5',
    );
  });

  it('keeps a protocol-relative path on the backend host', () => {
    expect(rewriteTarget('/api//evil.test/steal')).toStartWith(
      'https://backend.test/',
    );
  });
});
