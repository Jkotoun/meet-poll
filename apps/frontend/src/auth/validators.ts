export function required(label: string) {
  return ({ value }: { value: string }) =>
    value.trim() ? undefined : `${label} is required`;
}

export function minLength(label: string, min: number) {
  return ({ value }: { value: string }) =>
    value.length >= min
      ? undefined
      : `${label} must be at least ${min} characters`;
}
