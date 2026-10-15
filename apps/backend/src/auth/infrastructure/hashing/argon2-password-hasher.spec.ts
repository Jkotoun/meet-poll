import { describe, expect, it } from 'bun:test';
import { Argon2PasswordHasher } from './argon2-password-hasher.js';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  it('uses argon2id at the OWASP minimum parameters', async () => {
    expect(await hasher.hash('correct horse battery')).toStartWith(
      '$argon2id$v=19$m=19456,t=2,p=1$',
    );
  });

  it('produces a hash that verifies the password', async () => {
    const hash = await hasher.hash('correct horse battery');

    expect(await Bun.password.verify('correct horse battery', hash)).toBe(true);
  });

  it('hashes NFKC-equivalent passwords alike', async () => {
    const hash = await hasher.hash('ｐａｓｓｗｏｒｄ１２');

    expect(await Bun.password.verify('password12', hash)).toBe(true);
  });

  it('salts every hash', async () => {
    expect(await hasher.hash('same password')).not.toBe(
      await hasher.hash('same password'),
    );
  });
});
