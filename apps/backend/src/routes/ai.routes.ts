import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const aiController = new AiController();

router.use(authenticate); // Protect all AI routes

router.get('/config', aiController.getConfig);
router.post('/config', aiController.updateConfig);

export default router;
