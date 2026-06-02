import api from './api';

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getSignupSeries: (days = 30) => api.get(`/admin/analytics/signups?days=${days}`),
  getMessageSeries: (days = 30) => api.get(`/admin/analytics/messages?days=${days}`),
  getSourceBreakdown: () => api.get('/admin/analytics/sources'),
  getPackageDistribution: () => api.get('/admin/analytics/packages'),
  getReferralSeries: (days = 30) => api.get(`/admin/analytics/referrals?days=${days}`),

  getUsers: (page = 1, limit = 20, search?: string) =>
    api.get('/admin/users', { params: { page, limit, search } }),
  updateUser: (userId: string, data: object) => api.patch(`/admin/users/${userId}`, data),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),

  getBusinesses: (page = 1, limit = 20, search?: string) =>
    api.get('/admin/businesses', { params: { page, limit, search } }),
  updateBusiness: (businessId: string, data: object) => api.patch(`/admin/businesses/${businessId}`, data),

  getSessions: (page = 1, limit = 20) => api.get('/admin/sessions', { params: { page, limit } }),

  getLogs: (page = 1, limit = 50, filters?: object) =>
    api.get('/admin/logs', { params: { page, limit, ...filters } }),

  getContacts: (page = 1, limit = 20, search?: string) =>
    api.get('/admin/contacts', { params: { page, limit, search } }),

  getAiConfigs: (page = 1, limit = 20) => api.get('/admin/ai-configs', { params: { page, limit } }),

  getPlatformConfigs: () => api.get('/admin/platform-config'),
  savePlatformConfig: (data: object) => api.post('/admin/platform-config', data),
  updatePlatformConfig: (id: string, data: object) => api.put(`/admin/platform-config/${id}`, data),
  deletePlatformConfig: (id: string) => api.delete(`/admin/platform-config/${id}`),
  setDefaultPlatformConfig: (id: string) => api.post(`/admin/platform-config/${id}/set-default`),

  getReferrals: (page = 1, limit = 20) => api.get('/admin/referrals', { params: { page, limit } }),

  getDeveloperProfile: () => api.get('/admin/developer-profile'),
  updateDeveloperProfile: (id: string, data: object) => api.put(`/admin/developer-profile/${id}`, data),
};
