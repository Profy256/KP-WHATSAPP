import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../prisma';

export class ContactController {
  constructor() {
    this.toggleAiPause = this.toggleAiPause.bind(this);
    this.getContacts = this.getContacts.bind(this);
  }

  async getContacts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const business = await prisma.business.findFirst({ where: { userId } });
      if (!business) {
         res.status(404).json({ error: 'Business not found' });
         return;
      }

      const contacts = await prisma.contact.findMany({ where: { businessId: business.id } });
      res.status(200).json(contacts);
    } catch (error) {
      next(error);
    }
  }

  async toggleAiPause(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { remoteJid, isAiPaused } = req.body;
      
      const business = await prisma.business.findFirst({ where: { userId } });
      if (!business) {
         res.status(404).json({ error: 'Business not found' });
         return;
      }

      const contact = await prisma.contact.upsert({
        where: { businessId_remoteJid: { businessId: business.id, remoteJid } },
        update: { isAiPaused },
        create: { businessId: business.id, remoteJid, isAiPaused }
      });

      res.status(200).json(contact);
    } catch (error) {
      next(error);
    }
  }
}
