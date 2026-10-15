import type { Test } from 'supertest';

export function fromClientIp(test: Test, ip: string): Test {
  return test
    .set('x-proxy-secret', process.env.PROXY_SECRET ?? '')
    .set('x-client-ip', ip);
}

// Tests that create many accounts would otherwise share one rate-limit bucket.
export function fromNewClientIp(test: Test): Test {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  return fromClientIp(test, `10.${octet()}.${octet()}.${octet()}`);
}
