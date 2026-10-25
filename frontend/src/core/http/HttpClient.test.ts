import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './ApiError';
import { HttpClient } from './HttpClient';

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('HttpClient', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('construye URLs ignorando parámetros vacíos', () => {
    const client = new HttpClient('/api/', () => null);
    expect(client.buildUrl('/products', { search: 'mouse', category: '', page: 2, lowStock: undefined })).toBe(
      '/api/products?search=mouse&page=2',
    );
  });

  it('envía el token y el cuerpo JSON', async () => {
    const fetchMock = mockFetch(200, { data: { ok: true } });
    const client = new HttpClient('/api', () => 'mi-token');

    const result = await client.post('items', { name: 'x' });

    expect(result).toEqual({ data: { ok: true } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/items');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer mi-token');
    expect(init.body).toBe('{"name":"x"}');
  });

  it('devuelve undefined en respuestas 204', async () => {
    mockFetch(204);
    const client = new HttpClient('/api', () => null);
    await expect(client.delete('items/1')).resolves.toBeUndefined();
  });

  it('convierte los errores de la API en ApiError con detalles por campo', async () => {
    mockFetch(400, {
      error: { message: 'Datos inválidos', details: [{ field: 'price', message: 'Debe ser positivo' }] },
    });
    const client = new HttpClient('/api', () => null);

    const error = await client.post('products', {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).fieldErrors()).toEqual({ price: 'Debe ser positivo' });
  });

  it('notifica el 401 cuando había sesión', async () => {
    mockFetch(401, { error: { message: 'Token inválido' } });
    const client = new HttpClient('/api', () => 'vencido');
    const handler = vi.fn();
    client.onUnauthorized(handler);

    await expect(client.get('auth/me')).rejects.toThrow('Token inválido');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('lanza un error de red legible si el servidor no responde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const client = new HttpClient('/api', () => null);

    const error = (await client.get('products').catch((e: unknown) => e)) as ApiError;
    expect(error.isNetworkError).toBe(true);
  });
});
