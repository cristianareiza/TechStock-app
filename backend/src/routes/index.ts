import { Router } from 'express';
import type { Container } from '../container.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { createProductSchema, updateProductSchema } from '../validators/product.validator.js';
import { createUserSchema, loginSchema, updateUserSchema } from '../validators/user.validator.js';

export function createApiRouter(c: Container): Router {
  const router = Router();
  const auth = authenticate(c.authService);
  const adminOnly = authorize('admin');

  router.get('/health', (_req, res) => {
    res.json({ data: { status: 'ok', timestamp: new Date().toISOString() } });
  });

  // auth
  router.post('/auth/login', validateBody(loginSchema), c.authController.login);
  router.get('/auth/me', auth, c.authController.me);

  // usuarios (solo admin)
  const users = Router();
  users.use(auth, adminOnly);
  users.get('/', c.userController.list);
  users.get('/:id', c.userController.getById);
  users.post('/', validateBody(createUserSchema), c.userController.create);
  users.put('/:id', validateBody(updateUserSchema), c.userController.update);
  users.delete('/:id', c.userController.delete);
  router.use('/users', users);

  // productos (eliminar solo admin)
  const products = Router();
  products.use(auth);
  products.get('/', c.productController.list);
  products.get('/stats', c.productController.stats);
  products.get('/:id', c.productController.getById);
  products.post('/', validateBody(createProductSchema), c.productController.create);
  products.put('/:id', validateBody(updateProductSchema), c.productController.update);
  products.delete('/:id', adminOnly, c.productController.delete);
  router.use('/products', products);

  return router;
}
