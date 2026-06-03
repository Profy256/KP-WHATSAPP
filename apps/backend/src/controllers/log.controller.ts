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

      // Bound the result so the inbox never fetches an unbounded history (the
      // table grows forever). Take the most recent `limit` messages via the
      // descending index, then return them ascending so the client renders
      // each conversation in chronological order as before.
      const limit = Math.min(Math.max(Number(req.query.limit) || 500, 1), 1000);
      const recent = await prisma.messageLog.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      res.status(200).json(recent.reverse());
    } catch (error) {
      next(error);
    }
  }
}
