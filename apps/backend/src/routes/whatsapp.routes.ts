import { Router } from 'express';
import { WhatsappController } from '../controllers/whatsapp.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const whatsappController = new WhatsappController();

router.use(authenticate); // Protect all routes below

router.get('/qr', whatsappController.getQrCode);
router.get('/status', whatsappController.getStatus);
router.post('/retry', whatsappController.retry);
router.post('/pairing-code', whatsappController.requestPairingCode);
router.post('/send', whatsappController.sendMessage);

export default router;
