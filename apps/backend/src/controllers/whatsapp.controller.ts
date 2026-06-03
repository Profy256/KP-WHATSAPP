import { Request, Response, NextFunction } from 'express';
import { whatsappService } from '../services/whatsapp.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../prisma';

export class WhatsappController {
  private whatsappService = whatsappService;

  constructor() {
    this.getQrCode = this.getQrCode.bind(this);
    this.getStatus = this.getStatus.bind(this);
    this.retry = this.retry.bind(this);
    this.requestPairingCode = this.requestPairingCode.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
  }

  async getQrCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;

      const business = await prisma.business.findFirst({ where: { userId } });
      if (!business) {
         res.status(404).json({ error: 'Business not found' });
         return;
      }

      const state = await this.whatsappService.getConnectionState(business.id);
      res.status(200).json(state);
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const business = await prisma.business.findFirst({ where: { userId } });

      if (!business) {
         res.status(404).json({ error: 'Business not found' });
         return;
      }

      const state = await this.whatsappService.getStatus(business.id);
      res.status(200).json(state);
    } catch (error) {
      next(error);
    }
  }

  async retry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const business = await prisma.business.findFirst({ where: { userId } });

      if (!business) {
         res.status(404).json({ error: 'Business not found' });
         return;
      }

      const state = await this.whatsappService.retry(business.id);
      res.status(200).json(state);
    } catch (error) {
      next(error);
    }
  }

  async requestPairingCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { phoneNumber } = req.body;

      if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.replace(/\D/g, '').length < 8) {
        res.status(400).json({ error: 'A valid phone number in international format is required.' });
        return;
      }

      const business = await prisma.business.findFirst({ where: { userId } });
      if (!business) {
         res.status(404).json({ error: 'Business not found' });
         return;
      }

      const state = await this.whatsappService.startPairingCode(business.id, phoneNumber);
      res.status(200).json(state);
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { remoteJid, text } = req.body;
      
      const business = await prisma.business.findFirst({ where: { userId } });
      if (!business) {
         res.status(404).json({ error: 'Business not found' });
         return;
      }

      const success = await this.whatsappService.sendMessage(business.id, remoteJid, text);
      if (!success) {
        res.status(400).json({ error: 'WhatsApp session not active' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
