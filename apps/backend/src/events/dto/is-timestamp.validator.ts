import {
  isISO8601,
  isRFC3339,
  ValidateBy,
  type ValidationArguments,
} from 'class-validator';

const EARLIEST = Date.parse('2000-01-01T00:00:00Z');
const LATEST = Date.parse('2100-01-01T00:00:00Z');

// RFC 3339 requires an offset; strict ISO 8601 rejects dates like Feb 30,
// which `new Date()` would silently roll over.
export function IsTimestamp(): PropertyDecorator {
  return ValidateBy({
    name: 'isTimestamp',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' &&
        isRFC3339(value) &&
        isISO8601(value, { strict: true }) &&
        Date.parse(value) >= EARLIEST &&
        Date.parse(value) < LATEST,
      defaultMessage: ({ property }: ValidationArguments) =>
        `${property} must be a date-time with an offset, between 2000 and 2100`,
    },
  });
}
