import type { HttpClient } from '../core/http/HttpClient';
import type { TokenStorage } from '../core/storage/TokenStorage';
import { User } from '../models/User';
import type { ApiResponse, UserDTO } from '../models/types';

export class AuthService {
  private readonly http: HttpClient;
  private readonly storage: TokenStorage;

  constructor(http: HttpClient, storage: TokenStorage) {
    this.http = http;
    this.storage = storage;
  }

  hasSession(): boolean {
    return this.storage.get() !== null;
  }

  async login(email: string, password: string): Promise<User> {
    const { data } = await this.http.post<ApiResponse<{ token: string; user: UserDTO }>>('auth/login', {
      email,
      password,
    });
    this.storage.set(data.token);
    return User.fromDTO(data.user);
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await this.http.get<ApiResponse<UserDTO>>('auth/me');
    return User.fromDTO(data);
  }

  logout(): void {
    this.storage.clear();
  }
}
