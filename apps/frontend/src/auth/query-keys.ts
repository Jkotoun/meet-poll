// Plain module: server code can't read values exported from 'use client' files.
export const CURRENT_USER_KEY = ['auth', 'me'] as const;
