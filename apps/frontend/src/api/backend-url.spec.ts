import { afterEach, describe, expect, it } from 'bun:test';
import { backendUrl } from './backend-url';

describe('backendUrl', () => {
  const original = process.env.BACKEND_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.BACKEND_URL;
    } else {
      process.env.BACKEND_URL = original;
    }
  });

  it('parses BACKEND_URL', () => {
    process.env.BACKEND_URL = 'https://backend.test';
    expect(backendUrl().href).toBe('https://backend.test/');
  });

  it('fails when BACKEND_URL is missing', () => {
    delete process.env.BACKEND_URL;
    expect(() => backendUrl()).toThrow(/BACKEND_URL/);
  });

  it.each(['not a url', 'localhost:3001', 'ftp://backend.test'])(
    'fails when BACKEND_URL is %p',
    (value) => {
      process.env.BACKEND_URL = value;
      expect(() => backendUrl()).toThrow(/BACKEND_URL/);
    },
  );
});
