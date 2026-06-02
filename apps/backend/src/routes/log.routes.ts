import { Router } from 'express';
import { LogController } from '../controllers/log.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const logController = new LogController();

router.use(authenticate);

router.get('/', logController.getLogs);

export default router;
