import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Response } from 'express';

const router = Router();
const authController = new AuthController();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);

// Get current user profile + referral info
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true, email: true, name: true, isAdmin: true, referralCode: true, createdAt: true,
      businesses: { select: { id: true, name: true, selectedPackage: true } },
      _count: { select: { referrals: true } },
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Update package selection
router.patch('/package', authenticate, async (req: AuthRequest, res: Response) => {
  const { selectedPackage } = req.body;
  const allowed = ['WHATSAPP_BOT', 'AI_AUTOMATION', 'FULL'];
  if (!allowed.includes(selectedPackage)) {
    return res.status(400).json({ error: 'Invalid package' });
  }
  const business = await prisma.business.findFirst({ where: { userId: req.userId } });
  if (!business) return res.status(404).json({ error: 'Business not found' });
  const updated = await prisma.business.update({
    where: { id: business.id },
    data: { selectedPackage },
  });
  res.json(updated);
});

export default router;
