import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../prisma';

export class LogController {
  constructor() {
    this.getLogs = this.getLogs.bind(this);
  }

  async getLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      
      const business = await prisma.business.findFirst({ where: { userId } });
      if (!business) {
         res.status(404).json({ error: 'Business not found' });
         return;
      }

      const logs = await prisma.messageLog.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'asc' }
      });

      res.status(200).json(logs);
    } catch (error) {
      next(error);
    }
  }
}
