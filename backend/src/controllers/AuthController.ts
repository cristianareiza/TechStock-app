import type { Request, Response } from 'express';
import type { AuthService } from '../services/AuthService.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body);
    res.json({ data: result });
  };

  me = (req: Request, res: Response) => {
    res.json({ data: this.authService.getProfile(req.user!.id) });
  };
}
