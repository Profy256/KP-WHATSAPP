import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';
import { AdminController } from '../controllers/admin.controller';

const router = Router();
const ctrl = new AdminController();

router.use(authenticate, requireAdmin);

// Overview
router.get('/stats', ctrl.getStats);

// Analytics
router.get('/analytics/signups', ctrl.getSignupSeries);
router.get('/analytics/messages', ctrl.getMessageSeries);
router.get('/analytics/sources', ctrl.getSourceBreakdown);
router.get('/analytics/packages', ctrl.getPackageDistribution);
router.get('/analytics/referrals', ctrl.getReferralSeries);

// Users
router.get('/users', ctrl.getUsers);
router.patch('/users/:userId', ctrl.updateUserAdmin);
router.delete('/users/:userId', ctrl.deleteUser);

// Businesses
router.get('/businesses', ctrl.getBusinesses);
router.patch('/businesses/:businessId', ctrl.updateBusinessPackage);

// Sessions
router.get('/sessions', ctrl.getSessions);

// Logs
router.get('/logs', ctrl.getMessageLogs);

// Contacts
router.get('/contacts', ctrl.getContacts);

// AI Configs
router.get('/ai-configs', ctrl.getAiConfigs);

// Platform Config
router.get('/platform-config', ctrl.getPlatformConfigs);
router.post('/platform-config', ctrl.upsertPlatformConfig);
router.put('/platform-config/:configId', ctrl.upsertPlatformConfig);
router.delete('/platform-config/:configId', ctrl.deletePlatformConfig);
router.post('/platform-config/:configId/set-default', ctrl.setDefaultPlatformConfig);

// Developer Profile
router.get('/developer-profile', ctrl.getDeveloperProfile);
router.put('/developer-profile/:profileId', ctrl.updateDeveloperProfile);

// Referrals
router.get('/referrals', ctrl.getReferrals);

export default router;
