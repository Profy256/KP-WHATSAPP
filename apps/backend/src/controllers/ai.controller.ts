import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../prisma';

export class AiController {
  constructor() {
    this.getConfig = this.getConfig.bind(this);
    this.updateConfig = this.updateConfig.bind(this);
  }

  async getConfig(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;

      const business = await prisma.business.findFirst({ where: { userId } });
      if (!business) {
        res.status(404).json({ error: 'Business not found' });
        return;
      }

      // Auto-create defaults on first read; upsert is race-safe under the
      // unique businessId constraint.
      const config = await prisma.aiConfig.upsert({
        where: { businessId: business.id },
        update: {},
        create: {
          businessId: business.id,
          prompt: 'You are a helpful AI sales assistant for our business. Be concise and professional.',
          isActive: false,
          rules: [],
          greetingEnabled: false,
          greetingMessage: 'Thanks for contacting us! We will get back to you shortly.',
        },
      });

      res.status(200).json(config);
    } catch (error) {
      next(error);
    }
  }

  async updateConfig(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { prompt, isActive, rules, greetingEnabled, greetingMessage } = req.body;

      const business = await prisma.business.findFirst({ where: { userId } });
      if (!business) {
        res.status(404).json({ error: 'Business not found' });
        return;
      }

      // businessId is unique — upsert keeps it one-to-one and is race-safe.
      const config = await prisma.aiConfig.upsert({
        where: { businessId: business.id },
        update: { prompt, isActive, rules, greetingEnabled, greetingMessage },
        create: { businessId: business.id, prompt, isActive, rules, greetingEnabled, greetingMessage },
      });

      res.status(200).json(config);
    } catch (error) {
      next(error);
    }
  }
}
