import { BaseCrudService } from '../core/services/BaseCrudService';
import type { HttpClient } from '../core/http/HttpClient';
import { User } from '../models/User';
import type { ApiResponse, UserDTO, UserInput } from '../models/types';

export class UserService extends BaseCrudService<User, UserDTO, UserInput> {
  constructor(http: HttpClient) {
    super(http, 'users');
  }

  protected toModel(dto: UserDTO): User {
    return User.fromDTO(dto);
  }

  async getAll(): Promise<User[]> {
    const { data } = await this.http.get<ApiResponse<UserDTO[]>>(this.resource);
    return data.map((dto) => this.toModel(dto));
  }
}
