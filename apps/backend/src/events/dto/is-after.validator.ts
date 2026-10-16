import { ValidateBy, type ValidationArguments } from 'class-validator';

export function IsAfter(property: string): PropertyDecorator {
  return ValidateBy({
    name: 'isAfter',
    constraints: [property],
    validator: {
      validate: (value: unknown, { object }: ValidationArguments) =>
        typeof value === 'string' &&
        Date.parse(value) >
          Date.parse(String((object as Record<string, unknown>)[property])),
      defaultMessage: ({ property: own }: ValidationArguments) =>
        `${own} must be after ${property}`,
    },
  });
}
