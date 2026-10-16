import { describe, expect, it, spyOn } from 'bun:test';
import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('uses argon2id at the OWASP minimum parameters', async () => {
    expect(await hashPassword('correct horse battery')).toStartWith(
      '$argon2id$v=19$m=19456,t=2,p=1$',
    );
  });

  it('verifies the right password only', async () => {
    const hash = await hashPassword('correct horse battery');

    expect(await verifyPassword('correct horse battery', hash)).toBe(true);
    expect(await verifyPassword('wrong horse battery', hash)).toBe(false);
  });

  it('still runs a full check when there is no hash, then rejects', async () => {
    const verify = spyOn(Bun.password, 'verify');

    expect(await verifyPassword('correct horse battery', null)).toBe(false);
    expect(verify).toHaveBeenCalledTimes(1);
    verify.mockRestore();
  });

  it('hashes NFKC-equivalent passwords alike', async () => {
    const hash = await hashPassword('ｐａｓｓｗｏｒｄ１２');

    expect(await verifyPassword('password12', hash)).toBe(true);
  });

  it('salts every hash', async () => {
    expect(await hashPassword('same password')).not.toBe(
      await hashPassword('same password'),
    );
  });
});
