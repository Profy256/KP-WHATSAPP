import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AdminService } from '../services/admin.service';

const svc = new AdminService();

const qs = (v: any): string | undefined => (typeof v === 'string' ? v : undefined);

export class AdminController {
  // Overview
  getStats = async (req: AuthRequest, res: Response) => {
    const stats = await svc.getOverviewStats();
    res.json(stats);
  };

  // Analytics
  getSignupSeries = async (req: AuthRequest, res: Response) => {
    const days = Number(req.query.days) || 30;
    res.json(await svc.getSignupTimeSeries(days));
  };

  getMessageSeries = async (req: AuthRequest, res: Response) => {
    const days = Number(req.query.days) || 30;
    res.json(await svc.getMessageTimeSeries(days));
  };

  getSourceBreakdown = async (req: AuthRequest, res: Response) => {
    res.json(await svc.getMessageSourceBreakdown());
  };

  getPackageDistribution = async (req: AuthRequest, res: Response) => {
    res.json(await svc.getPackageDistribution());
  };

  getReferralSeries = async (req: AuthRequest, res: Response) => {
    const days = Number(req.query.days) || 30;
    res.json(await svc.getReferralTimeSeries(days));
  };

  // Users
  getUsers = async (req: AuthRequest, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    res.json(await svc.getUsers(page, limit, qs(req.query.search)));
  };

  updateUserAdmin = async (req: AuthRequest, res: Response) => {
    const userId = String(req.params.userId);
    const { isAdmin } = req.body;
    res.json(await svc.updateUserAdmin(userId, isAdmin));
  };

  deleteUser = async (req: AuthRequest, res: Response) => {
    const userId = String(req.params.userId);
    await svc.deleteUser(userId);
    res.json({ success: true });
  };

  // Businesses
  getBusinesses = async (req: AuthRequest, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    res.json(await svc.getBusinesses(page, limit, qs(req.query.search)));
  };

  updateBusinessPackage = async (req: AuthRequest, res: Response) => {
    const businessId = String(req.params.businessId);
    const { selectedPackage } = req.body;
    res.json(await svc.updateBusinessPackage(businessId, selectedPackage));
  };

  // Sessions
  getSessions = async (req: AuthRequest, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    res.json(await svc.getSessions(page, limit));
  };

  // Logs
  getMessageLogs = async (req: AuthRequest, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    res.json(await svc.getMessageLogs(page, limit, qs(req.query.businessId), qs(req.query.direction)));
  };

  // Contacts
  getContacts = async (req: AuthRequest, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    res.json(await svc.getContacts(page, limit, qs(req.query.search)));
  };

  // AI Configs
  getAiConfigs = async (req: AuthRequest, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    res.json(await svc.getAiConfigs(page, limit));
  };

  // Platform Config
  getPlatformConfigs = async (req: AuthRequest, res: Response) => {
    res.json(await svc.getPlatformConfigs());
  };

  upsertPlatformConfig = async (req: AuthRequest, res: Response) => {
    const id = req.params.configId ? String(req.params.configId) : undefined;
    res.json(await svc.upsertPlatformConfig(id ? { id, ...req.body } : req.body));
  };

  deletePlatformConfig = async (req: AuthRequest, res: Response) => {
    await svc.deletePlatformConfig(String(req.params.configId));
    res.json({ success: true });
  };

  setDefaultPlatformConfig = async (req: AuthRequest, res: Response) => {
    res.json(await svc.setDefaultPlatformConfig(String(req.params.configId)));
  };

  // Developer Profile
  getDeveloperProfile = async (req: AuthRequest, res: Response) => {
    res.json(await svc.getDeveloperProfile());
  };

  updateDeveloperProfile = async (req: AuthRequest, res: Response) => {
    const id = String(req.params.profileId);
    res.json(await svc.updateDeveloperProfile(id, req.body));
  };

  // Referrals
  getReferrals = async (req: AuthRequest, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    res.json(await svc.getReferrals(page, limit));
  };
}
