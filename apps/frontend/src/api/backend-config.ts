export interface BackendConfig {
  url: URL;
  proxySecret: string;
}

export function backendConfig(): BackendConfig {
  return { url: backendUrl(), proxySecret: proxySecret() };
}

function backendUrl(): URL {
  const value = process.env.BACKEND_URL;
  if (value && URL.canParse(value)) {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url;
    }
  }
  throw new Error('BACKEND_URL must be an http(s) URL of the backend');
}

function proxySecret(): string {
  const value = process.env.PROXY_SECRET;
  if (!value || value.length < 32) {
    throw new Error('PROXY_SECRET must be at least 32 characters');
  }
  return value;
}
