import { hours, minutes } from '@nestjs/throttler';

export const PER_IP = 'ip';
export const PER_EMAIL = 'email';

export const LOGIN_PER_IP = { limit: 20, ttl: minutes(1) };
export const LOGIN_PER_EMAIL = { limit: 5, ttl: minutes(1) };
export const REGISTER_PER_IP = { limit: 5, ttl: hours(1) };
