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
  hash(password: string): Promise<string> {
    // NFKC so visually identical passwords (e.g. full-width digits) hash alike.
    return Bun.password.hash(password.normalize('NFKC'), ARGON2_OPTIONS);
  }
}
