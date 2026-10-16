// Kept out of session.ts, which imports client-only code, so the server can use it.
export const CURRENT_USER_KEY = ['auth', 'me'] as const;
