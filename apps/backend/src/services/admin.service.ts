import { prisma } from '../prisma';
import { businessCache, platformConfigCache, PLATFORM_CONFIG_KEY } from '../cache';

export class AdminService {
  // ─── Overview stats ──────────────────────────────────────────────────────

  async getOverviewStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOf7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOf30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersToday,
      newUsers7d,
      newUsers30d,
      totalBusinesses,
      totalSessions,
      connectedSessions,
      totalMessages,
      messagesToday,
      messages7d,
      totalContacts,
      activeAiConfigs,
      totalReferrals,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: { createdAt: { gte: startOf7Days } } }),
      prisma.user.count({ where: { createdAt: { gte: startOf30Days } } }),
      prisma.business.count(),
      prisma.session.count(),
      prisma.session.count({ where: { status: 'CONNECTED' } }),
      prisma.messageLog.count(),
      prisma.messageLog.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.messageLog.count({ where: { createdAt: { gte: startOf7Days } } }),
      prisma.contact.count(),
      prisma.aiConfig.count({ where: { isActive: true } }),
      prisma.referral.count(),
    ]);

    return {
      users: { total: totalUsers, today: newUsersToday, last7d: newUsers7d, last30d: newUsers30d },
      businesses: { total: totalBusinesses },
      sessions: { total: totalSessions, connected: connectedSessions, disconnected: totalSessions - connectedSessions },
      messages: { total: totalMessages, today: messagesToday, last7d: messages7d },
      contacts: { total: totalContacts },
      ai: { activeConfigs: activeAiConfigs },
      referrals: { total: totalReferrals },
    };
  }

  // ─── Analytics time-series ────────────────────────────────────────────────

  async getSignupTimeSeries(days = 30) {
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return this.bucketByDay(users.map(u => u.createdAt), days);
  }

  async getMessageTimeSeries(days = 30) {
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [incoming, outgoing] = await Promise.all([
      prisma.messageLog.findMany({
        where: { createdAt: { gte: start }, direction: 'INCOMING' },
        select: { createdAt: true },
      }),
      prisma.messageLog.findMany({
        where: { createdAt: { gte: start }, direction: 'OUTGOING' },
        select: { createdAt: true },
      }),
    ]);
    return {
      incoming: this.bucketByDay(incoming.map(m => m.createdAt), days),
      outgoing: this.bucketByDay(outgoing.map(m => m.createdAt), days),
    };
  }

  async getMessageSourceBreakdown() {
    const results = await prisma.messageLog.groupBy({
      by: ['source'],
      _count: { source: true },
    });
    return results.map(r => ({ source: r.source, count: r._count.source }));
  }

  async getPackageDistribution() {
    const results = await prisma.business.groupBy({
      by: ['selectedPackage'],
      _count: { selectedPackage: true },
    });
    return results.map(r => ({ package: r.selectedPackage, count: r._count.selectedPackage }));
  }

  async getReferralTimeSeries(days = 30) {
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const referrals = await prisma.referral.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    });
    return this.bucketByDay(referrals.map(r => r.createdAt), days);
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? { OR: [{ email: { contains: search, mode: 'insensitive' as const } }, { name: { contains: search, mode: 'insensitive' as const } }] }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, name: true, isAdmin: true, referralCode: true, createdAt: true, updatedAt: true,
          businesses: { select: { id: true, name: true, selectedPackage: true, session: { select: { status: true } } } },
          _count: { select: { referrals: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async updateUserAdmin(userId: string, isAdmin: boolean) {
    return prisma.user.update({ where: { id: userId }, data: { isAdmin } });
  }

  async deleteUser(userId: string) {
    return prisma.user.delete({ where: { id: userId } });
  }

  // ─── Businesses ───────────────────────────────────────────────────────────

  async getBusinesses(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, name: true } },
          session: { select: { status: true, whatsappId: true, updatedAt: true } },
          _count: { select: { messageLogs: true, contacts: true } },
        },
      }),
      prisma.business.count({ where }),
    ]);

    return { businesses, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async updateBusinessPackage(businessId: string, selectedPackage: string) {
    const updated = await prisma.business.update({ where: { id: businessId }, data: { selectedPackage } });
    // The per-message path keys AI/keyword behaviour off the package; clear the
    // cached business so the change takes effect immediately.
    businessCache.delete(businessId);
    return updated;
  }

  // ─── Sessions ─────────────────────────────────────────────────────────────

  async getSessions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          business: { select: { id: true, name: true, user: { select: { email: true, name: true } } } },
          _count: { select: { keys: true } },
        },
      }),
      prisma.session.count(),
    ]);
    return { sessions, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─── Message Logs ─────────────────────────────────────────────────────────

  async getMessageLogs(page = 1, limit = 50, businessId?: string, direction?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (businessId) where.businessId = businessId;
    if (direction) where.direction = direction;

    const [logs, total] = await Promise.all([
      prisma.messageLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { business: { select: { name: true, user: { select: { email: true } } } } },
      }),
      prisma.messageLog.count({ where }),
    ]);

    return { logs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─── Contacts ─────────────────────────────────────────────────────────────

  async getContacts(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search ? { remoteJid: { contains: search } } : {};

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { business: { select: { name: true, user: { select: { email: true } } } } },
      }),
      prisma.contact.count({ where }),
    ]);

    return { contacts, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─── AI Configs ───────────────────────────────────────────────────────────

  async getAiConfigs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [configs, total] = await Promise.all([
      prisma.aiConfig.findMany({
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: { business: { select: { name: true, selectedPackage: true, user: { select: { email: true } } } } },
      }),
      prisma.aiConfig.count(),
    ]);
    return { configs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─── Platform Config ──────────────────────────────────────────────────────

  async getPlatformConfigs() {
    return prisma.platformConfig.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async upsertPlatformConfig(data: { id?: string; provider: string; model: string; apiKey: string; isDefault: boolean; isActive: boolean }) {
    if (data.id) {
      const updated = await prisma.platformConfig.update({ where: { id: data.id }, data });
      platformConfigCache.delete(PLATFORM_CONFIG_KEY);
      return updated;
    }
    const { id, ...createData } = data;
    const created = await prisma.platformConfig.create({ data: createData });
    platformConfigCache.delete(PLATFORM_CONFIG_KEY);
    return created;
  }

  async deletePlatformConfig(id: string) {
    const deleted = await prisma.platformConfig.delete({ where: { id } });
    platformConfigCache.delete(PLATFORM_CONFIG_KEY);
    return deleted;
  }

  async setDefaultPlatformConfig(id: string) {
    await prisma.platformConfig.updateMany({ data: { isDefault: false } });
    const updated = await prisma.platformConfig.update({ where: { id }, data: { isDefault: true } });
    platformConfigCache.delete(PLATFORM_CONFIG_KEY);
    return updated;
  }

  // ─── Referrals ────────────────────────────────────────────────────────────

  async getReferrals(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [referrals, total] = await Promise.all([
      prisma.referral.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          referrer: { select: { email: true, name: true } },
          referee: { select: { email: true, name: true } },
        },
      }),
      prisma.referral.count(),
    ]);
    return { referrals, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─── Developer Profile ───────────────────────────────────────────────────

  async getDeveloperProfile() {
    let profile = await prisma.developerProfile.findFirst();
    if (!profile) {
      profile = await prisma.developerProfile.create({ data: {} });
    }
    return profile;
  }

  async updateDeveloperProfile(id: string, data: any) {
    return prisma.developerProfile.update({ where: { id }, data });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private bucketByDay(dates: Date[], days: number) {
    const buckets: Record<string, number> = {};
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      buckets[key] = 0;
    }

    for (const date of dates) {
      const key = date.toISOString().split('T')[0];
      if (key in buckets) buckets[key]++;
    }

    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }
}
