// OWASP minimum for argon2id; Bun's 64 MiB default is too much per concurrent request.
const ARGON2_OPTIONS = {
  algorithm: 'argon2id',
  memoryCost: 19_456,
  timeCost: 2,
} as const;

// Checked when there is no hash (unknown email), so that answer takes as long
// as a wrong password. Created at startup, not on the first such login.
const dummyHash = hashPassword(Bun.randomUUIDv7());

export function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(normalize(password), ARGON2_OPTIONS);
}

export async function verifyPassword(
  password: string,
  hash: string | null,
): Promise<boolean> {
  const matches = await Bun.password.verify(
    normalize(password),
    hash ?? (await dummyHash),
  );
  return hash !== null && matches;
}

// NFKC so visually identical passwords (e.g. full-width digits) hash alike.
function normalize(password: string): string {
  return password.normalize('NFKC');
}
