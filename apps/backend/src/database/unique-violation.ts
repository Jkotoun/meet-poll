import { UniqueConstraintViolationException } from '@mikro-orm/postgresql';

export function isUniqueViolation(error: unknown, constraint: string): boolean {
  return (
    error instanceof UniqueConstraintViolationException &&
    // The driver's constraint name is present at runtime but not typed by MikroORM.
    (error as { constraint?: string }).constraint === constraint
  );
}
