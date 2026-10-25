import { API_URL } from '../config/env';
import { HttpClient } from '../core/http/HttpClient';
import { TokenStorage } from '../core/storage/TokenStorage';
import { AuthService } from './AuthService';
import { ProductService } from './ProductService';
import { UserService } from './UserService';

export const tokenStorage = new TokenStorage();
export const httpClient = new HttpClient(API_URL, () => tokenStorage.get());

export const authService = new AuthService(httpClient, tokenStorage);
export const productService = new ProductService(httpClient);
export const userService = new UserService(httpClient);
