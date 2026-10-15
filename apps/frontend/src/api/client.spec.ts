import { describe, expect, it } from 'bun:test';
import { createApiClient } from './client';

const notFound = {
  type: 'about:blank',
  title: 'Not Found',
  status: 404,
  instance: '/health',
};

describe('createApiClient', () => {
  it('sends requests under the base URL', async () => {
    const urls: string[] = [];
    const client = createApiClient('https://app.test/api', async (request) => {
      urls.push(request.url);
      return Response.json({ status: 'ok' });
    });

    const { data } = await client.GET('/health');

    expect(urls).toEqual(['https://app.test/api/health']);
    expect(data).toEqual({ status: 'ok' });
  });

  it('returns problem details as the error', async () => {
    const client = createApiClient('https://app.test/api', async () =>
      Response.json(notFound, {
        status: 404,
        headers: { 'content-type': 'application/problem+json' },
      }),
    );

    const { data, error } = await client.GET('/health');

    expect(data).toBeUndefined();
    expect(error).toEqual(notFound);
  });
});
