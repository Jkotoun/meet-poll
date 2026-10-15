import { normalizeEmail } from '../../../users/users.api.js';

type TransformInput = { value: unknown };

function forStrings(transform: (value: string) => string) {
  return ({ value }: TransformInput) =>
    typeof value === 'string' ? transform(value) : value;
}

export const trimmed = forStrings((value) => value.trim());
// Validated after normalizing: lowercasing can lengthen Unicode text.
export const normalizedEmail = forStrings(normalizeEmail);
// Passwords are NFKC-normalized (look-alike characters unified) before the
// length check, so the limits apply to what gets hashed.
export const nfkc = forStrings((value) => value.normalize('NFKC'));
