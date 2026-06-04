import { IDIPClient, IDIPNetworkError } from '../src/api/client';

describe('IDIPClient', () => {
  const baseUrl = 'https://api.example.com';
  const apiKey = 'idip_testkey123';
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    // @ts-expect-error assigning a mock to the global fetch
    global.fetch = fetchMock;
  });

  function ok(body: object) {
    return Promise.resolve({ ok: true, status: 200, json: async () => body });
  }

  test('scan POSTs to /v1/scan with auth header and body', async () => {
    fetchMock.mockReturnValueOnce(ok({ scan_id: 's1', result: 'ALLOW' }));
    const client = new IDIPClient(baseUrl, apiKey);
    const res = await client.scan({ barcode_data: 'RAW', scan_method: 'manual' });

    expect(res.scan_id).toBe('s1');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.example.com/v1/scan');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe(`Bearer ${apiKey}`);
    expect(JSON.parse(init.body)).toMatchObject({ barcode_data: 'RAW', scan_method: 'manual' });
  });

  test('strips trailing slash from baseUrl', async () => {
    fetchMock.mockReturnValueOnce(ok({ items: [] }));
    const client = new IDIPClient('https://api.example.com/', apiKey);
    await client.getLogs();
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/v1/logs');
  });

  test('builds log query string from filters', async () => {
    fetchMock.mockReturnValueOnce(ok({ items: [] }));
    const client = new IDIPClient(baseUrl, apiKey);
    await client.getLogs({ decision: 'DENY', state: 'TX', limit: 10 });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.com/v1/logs?decision=DENY&state=TX&limit=10',
    );
  });

  test('throws IDIPNetworkError on non-2xx', async () => {
    fetchMock.mockReturnValueOnce(
      Promise.resolve({ ok: false, status: 401, json: async () => ({}) }),
    );
    const client = new IDIPClient(baseUrl, apiKey);
    await expect(client.scan({ barcode_data: 'x' })).rejects.toBeInstanceOf(
      IDIPNetworkError,
    );
  });

  test('IDIPNetworkError carries the status code', async () => {
    fetchMock.mockReturnValueOnce(
      Promise.resolve({ ok: false, status: 429, json: async () => ({}) }),
    );
    const client = new IDIPClient(baseUrl, apiKey);
    try {
      await client.getMetrics();
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(IDIPNetworkError);
      expect((e as IDIPNetworkError).status).toBe(429);
    }
  });
});
