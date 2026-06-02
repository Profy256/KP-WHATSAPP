import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const contactController = new ContactController();

router.use(authenticate);

router.get('/', contactController.getContacts);
router.post('/pause', contactController.toggleAiPause);

export default router;
