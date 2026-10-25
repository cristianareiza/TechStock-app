import type { Request, Response } from 'express';
import type { ProductService } from '../services/ProductService.js';
import { parseId } from '../utils/parseId.js';
import { productQuerySchema } from '../validators/product.validator.js';

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  list = (req: Request, res: Response) => {
    const query = productQuerySchema.parse(req.query);
    res.json(this.productService.list(query));
  };

  stats = (_req: Request, res: Response) => {
    res.json({ data: this.productService.getStats() });
  };

  getById = (req: Request, res: Response) => {
    res.json({ data: this.productService.getById(parseId(req.params.id)) });
  };

  create = (req: Request, res: Response) => {
    const product = this.productService.create(req.body, req.user!.id);
    res.status(201).location(`/api/products/${product.id}`).json({ data: product });
  };

  update = (req: Request, res: Response) => {
    res.json({ data: this.productService.update(parseId(req.params.id), req.body) });
  };

  delete = (req: Request, res: Response) => {
    this.productService.delete(parseId(req.params.id));
    res.status(204).send();
  };
}
