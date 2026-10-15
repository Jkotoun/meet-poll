import { Injectable } from '@nestjs/common';
import { PasswordHasher } from '../../application/password-hasher.js';

// OWASP minimum for argon2id; Bun's 64 MiB default is too much per concurrent request.
const ARGON2_OPTIONS = {
  algorithm: 'argon2id',
  memoryCost: 19_456,
  timeCost: 2,
} as const;

@Injectable()
export class Argon2PasswordHasher extends PasswordHasher {
  private readonly dummyHash = this.hash(Bun.randomUUIDv7());

  hash(password: string): Promise<string> {
    return Bun.password.hash(normalize(password), ARGON2_OPTIONS);
  }

  async verify(password: string, hash: string | null): Promise<boolean> {
    const matches = await Bun.password.verify(
      normalize(password),
      hash ?? (await this.dummyHash),
    );
    return hash !== null && matches;
  }
}

// NFKC so visually identical passwords (e.g. full-width digits) hash alike.
function normalize(password: string): string {
  return password.normalize('NFKC');
}
