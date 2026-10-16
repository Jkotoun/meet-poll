export function backendUrl(): URL {
  const value = process.env.BACKEND_URL;
  if (value && URL.canParse(value)) {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url;
    }
  }
  throw new Error('BACKEND_URL must be an http(s) URL of the backend');
}
