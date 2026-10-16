const BASE = 'http://same-origin.invalid';

// Resolve like the browser would (it strips tabs/newlines, so `/\t/evil` is `//evil`)
// and accept only targets that stay on this origin.
export function safeNext(next: string | null): string {
  if (!next || !URL.canParse(next, BASE)) {
    return '/';
  }
  const url = new URL(next, BASE);
  // Dot segments can normalize to `//host`, which the router treats as another site.
  if (url.origin !== BASE || url.pathname.startsWith('//')) {
    return '/';
  }
  return url.pathname + url.search + url.hash;
}

// Read at submit time so the forms themselves need no dynamic rendering.
export function nextPath(): string {
  return safeNext(new URLSearchParams(window.location.search).get('next'));
}
