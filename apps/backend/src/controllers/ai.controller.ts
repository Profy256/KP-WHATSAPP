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

      let config = await prisma.aiConfig.findFirst({ where: { businessId: business.id } });

      if (!config) {
        config = await prisma.aiConfig.create({
          data: {
            businessId: business.id,
            prompt: 'You are a helpful AI sales assistant for our business. Be concise and professional.',
            isActive: false,
            rules: [],
            greetingEnabled: false,
            greetingMessage: 'Thanks for contacting us! We will get back to you shortly.',
          },
        });
      }

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

      let config = await prisma.aiConfig.findFirst({ where: { businessId: business.id } });

      if (config) {
        config = await prisma.aiConfig.update({
          where: { id: config.id },
          data: { prompt, isActive, rules, greetingEnabled, greetingMessage },
        });
      } else {
        config = await prisma.aiConfig.create({
          data: { businessId: business.id, prompt, isActive, rules, greetingEnabled, greetingMessage },
        });
      }

      res.status(200).json(config);
    } catch (error) {
      next(error);
    }
  }
}
