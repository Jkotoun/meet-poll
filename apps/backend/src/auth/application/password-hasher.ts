export abstract class PasswordHasher {
  abstract hash(password: string): Promise<string>;
  // A null hash (no such account) must take as long as a real check.
  abstract verify(password: string, hash: string | null): Promise<boolean>;
}
