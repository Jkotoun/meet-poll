import { describe, expect, it } from 'bun:test';
import { NodeEnv, validateEnvironment } from './environment.js';

const valid = {
  NODE_ENV: 'production',
  PORT: '8080',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
};

describe('validateEnvironment', () => {
  it('parses and converts valid variables', () => {
    expect(validateEnvironment(valid)).toMatchObject({
      NODE_ENV: NodeEnv.Production,
      PORT: 8080,
      DATABASE_URL: valid.DATABASE_URL,
    });
  });

  it('defaults PORT', () => {
    const { PORT: _port, ...withoutPort } = valid;
    expect(validateEnvironment(withoutPort).PORT).toBe(3001);
  });

  it('fails when NODE_ENV is missing', () => {
    expect(() =>
      validateEnvironment({ ...valid, NODE_ENV: undefined }),
    ).toThrow(/NODE_ENV/);
  });

  it('fails when DATABASE_URL is missing', () => {
    expect(() =>
      validateEnvironment({ ...valid, DATABASE_URL: undefined }),
    ).toThrow(/DATABASE_URL/);
  });

  it('fails on a non-numeric PORT', () => {
    expect(() => validateEnvironment({ ...valid, PORT: 'abc' })).toThrow(
      /PORT/,
    );
  });

  it('fails on an unknown NODE_ENV', () => {
    expect(() =>
      validateEnvironment({ ...valid, NODE_ENV: 'staging' }),
    ).toThrow(/NODE_ENV/);
  });
});
