import type { HttpClient } from '../http/HttpClient';
import type { ApiResponse } from '../../models/types';

export abstract class BaseCrudService<TModel, TDto, TInput> {
  protected readonly http: HttpClient;
  protected readonly resource: string;

  constructor(http: HttpClient, resource: string) {
    this.http = http;
    this.resource = resource;
  }

  protected abstract toModel(dto: TDto): TModel;

  async getById(id: number): Promise<TModel> {
    const { data } = await this.http.get<ApiResponse<TDto>>(`${this.resource}/${id}`);
    return this.toModel(data);
  }

  async create(input: TInput): Promise<TModel> {
    const { data } = await this.http.post<ApiResponse<TDto>>(this.resource, input);
    return this.toModel(data);
  }

  async update(id: number, input: Partial<TInput>): Promise<TModel> {
    const { data } = await this.http.put<ApiResponse<TDto>>(`${this.resource}/${id}`, input);
    return this.toModel(data);
  }

  async remove(id: number): Promise<void> {
    await this.http.delete(`${this.resource}/${id}`);
  }
}
