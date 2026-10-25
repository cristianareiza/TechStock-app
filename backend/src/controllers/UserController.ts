import type { Request, Response } from 'express';
import type { UserService } from '../services/UserService.js';
import { parseId } from '../utils/parseId.js';

export class UserController {
  constructor(private readonly userService: UserService) {}

  list = (_req: Request, res: Response) => {
    res.json({ data: this.userService.list() });
  };

  getById = (req: Request, res: Response) => {
    res.json({ data: this.userService.getById(parseId(req.params.id)) });
  };

  create = async (req: Request, res: Response) => {
    const user = await this.userService.create(req.body);
    res.status(201).location(`/api/users/${user.id}`).json({ data: user });
  };

  update = async (req: Request, res: Response) => {
    const user = await this.userService.update(parseId(req.params.id), req.body, req.user!.id);
    res.json({ data: user });
  };

  delete = (req: Request, res: Response) => {
    this.userService.delete(parseId(req.params.id), req.user!.id);
    res.status(204).send();
  };
}
