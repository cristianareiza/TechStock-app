import { AuthController } from './controllers/AuthController.js';
import { ProductController } from './controllers/ProductController.js';
import { UserController } from './controllers/UserController.js';
import type { DB } from './database/connection.js';
import { ProductRepository } from './repositories/ProductRepository.js';
import { UserRepository } from './repositories/UserRepository.js';
import { AuthService } from './services/AuthService.js';
import { ProductService } from './services/ProductService.js';
import { UserService } from './services/UserService.js';

export function createContainer(db: DB) {
  const userRepository = new UserRepository(db);
  const productRepository = new ProductRepository(db);

  const authService = new AuthService(userRepository);
  const userService = new UserService(userRepository);
  const productService = new ProductService(productRepository);

  return {
    authService,
    authController: new AuthController(authService),
    userController: new UserController(userService),
    productController: new ProductController(productService),
  };
}

export type Container = ReturnType<typeof createContainer>;
