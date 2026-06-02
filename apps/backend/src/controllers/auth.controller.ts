import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
    this.signup = this.signup.bind(this);
    this.login = this.login.bind(this);
    this.googleAuth = this.googleAuth.bind(this);
  }

  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, businessName, referralCode } = req.body;
      const result = await this.authService.signup(email, password, name, businessName, referralCode);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async googleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { credential } = req.body;
      if (!credential) {
        res.status(400).json({ error: 'Google credential is required' });
        return;
      }
      const result = await this.authService.googleAuth(credential);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
