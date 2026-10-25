import { ApiError, type FieldIssue } from './ApiError';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type QueryParams = Record<string, string | number | boolean | undefined | null>;

interface ErrorPayload {
  error?: { message?: string; details?: FieldIssue[] };
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly getToken: () => string | null;
  private unauthorizedHandler: (() => void) | null = null;

  constructor(baseUrl: string, getToken: () => string | null) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.getToken = getToken;
  }

  onUnauthorized(handler: () => void): void {
    this.unauthorizedHandler = handler;
  }

  get<T>(path: string, query?: QueryParams): Promise<T> {
    return this.request<T>('GET', path, undefined, query);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  delete<T = void>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  buildUrl(path: string, query?: QueryParams): string {
    const url = `${this.baseUrl}/${path.replace(/^\//, '')}`;
    if (!query) return url;

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
    }
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
  }

  private async request<T>(method: HttpMethod, path: string, body?: unknown, query?: QueryParams): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    let response: Response;
    try {
      response = await fetch(this.buildUrl(path, query), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError(0, 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.');
    }

    if (response.status === 204) return undefined as T;

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const error = (payload as ErrorPayload | null)?.error;
      if (response.status === 401 && token) this.unauthorizedHandler?.();
      throw new ApiError(
        response.status,
        error?.message ?? `Error inesperado (${response.status})`,
        error?.details ?? [],
      );
    }

    return payload as T;
  }
}
