import { afterEach, describe, expect, it } from 'bun:test';
import { backendConfig } from './backend-config';

const validSecret = 's'.repeat(32);

describe('backendConfig', () => {
  const original = {
    BACKEND_URL: process.env.BACKEND_URL,
    PROXY_SECRET: process.env.PROXY_SECRET,
  };

  afterEach(() => {
    for (const [name, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });

  function configure(
    backendUrl: string | undefined,
    proxySecret = validSecret,
  ) {
    if (backendUrl === undefined) {
      delete process.env.BACKEND_URL;
    } else {
      process.env.BACKEND_URL = backendUrl;
    }
    process.env.PROXY_SECRET = proxySecret;
  }

  it('reads BACKEND_URL and PROXY_SECRET', () => {
    configure('https://backend.test');

    const config = backendConfig();

    expect(config.url.href).toBe('https://backend.test/');
    expect(config.proxySecret).toBe(validSecret);
  });

  it('fails when BACKEND_URL is missing', () => {
    configure(undefined);
    expect(() => backendConfig()).toThrow(/BACKEND_URL/);
  });

  it.each(['not a url', 'localhost:3001', 'ftp://backend.test'])(
    'fails when BACKEND_URL is %p',
    (value) => {
      configure(value);
      expect(() => backendConfig()).toThrow(/BACKEND_URL/);
    },
  );

  it('fails when PROXY_SECRET is shorter than 32 characters', () => {
    configure('https://backend.test', 'short');
    expect(() => backendConfig()).toThrow(/PROXY_SECRET/);
  });
});
