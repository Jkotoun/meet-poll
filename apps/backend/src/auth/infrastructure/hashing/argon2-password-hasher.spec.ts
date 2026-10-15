import { describe, expect, it, spyOn } from 'bun:test';
import { Argon2PasswordHasher } from './argon2-password-hasher.js';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  it('uses argon2id at the OWASP minimum parameters', async () => {
    expect(await hasher.hash('correct horse battery')).toStartWith(
      '$argon2id$v=19$m=19456,t=2,p=1$',
    );
  });

  it('verifies the right password only', async () => {
    const hash = await hasher.hash('correct horse battery');

    expect(await hasher.verify('correct horse battery', hash)).toBe(true);
    expect(await hasher.verify('wrong horse battery', hash)).toBe(false);
  });

  it('still runs a full check when there is no hash, then rejects', async () => {
    const verify = spyOn(Bun.password, 'verify');

    expect(await hasher.verify('correct horse battery', null)).toBe(false);
    expect(verify).toHaveBeenCalledTimes(1);
    verify.mockRestore();
  });

  it('hashes NFKC-equivalent passwords alike', async () => {
    const hash = await hasher.hash('ｐａｓｓｗｏｒｄ１２');

    expect(await hasher.verify('password12', hash)).toBe(true);
  });

  it('salts every hash', async () => {
    expect(await hasher.hash('same password')).not.toBe(
      await hasher.hash('same password'),
    );
  });
});
