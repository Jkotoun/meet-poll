export function loginPath(next: string): string {
  return `/login?${new URLSearchParams({ next })}`;
}
