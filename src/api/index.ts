import { apiClient } from './client';
import {
  Exhibition,
  ExhibitionDay,
  Merchant,
  Reward,
  WheelConfigDisplay,
  ProbabilityPreviewResponse,
  Participation,
  SpinResult,
  Award,
  DashboardSummary,
  UserProfile,
} from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<{ accessToken: string; user: UserProfile }> => {
    return apiClient.post('/auth/login', { email, password });
  },
  getProfile: async (): Promise<UserProfile> => {
    return apiClient.get('/auth/me');
  },
  listUsers: async (): Promise<UserProfile[]> => {
    return apiClient.get('/auth/users');
  },
  createUser: async (data: { email: string; name: string; password: string }): Promise<UserProfile> => {
    return apiClient.post('/auth/users', data);
  },
};

export const exhibitionsApi = {
  getCurrent: async (): Promise<Exhibition> => {
    return apiClient.get('/exhibitions/current');
  },
  getActiveDay: async (): Promise<ExhibitionDay | null> => {
    return apiClient.get('/exhibitions/days/active');
  },
  getDayById: async (dayId: string): Promise<ExhibitionDay> => {
    return apiClient.get(`/exhibitions/days/${dayId}`);
  },
  startDay: async (dayId: string): Promise<{ message: string; day: ExhibitionDay }> => {
    return apiClient.post(`/exhibitions/days/${dayId}/start`);
  },
  endDay: async (dayId: string): Promise<{ message: string; day: ExhibitionDay; closedParticipationsCount: number }> => {
    return apiClient.post(`/exhibitions/days/${dayId}/end`);
  },
  pauseExhibition: async (exhibitionId: string): Promise<Exhibition> => {
    return apiClient.post(`/exhibitions/${exhibitionId}/pause`);
  },
  resumeExhibition: async (exhibitionId: string): Promise<Exhibition> => {
    return apiClient.post(`/exhibitions/${exhibitionId}/resume`);
  },
  updateDay: async (dayId: string, data: { label?: string; pacingStartTime?: string; pacingEndTime?: string }): Promise<ExhibitionDay> => {
    return apiClient.patch(`/exhibitions/days/${dayId}`, data);
  },
};

export const qrApi = {
  getCurrentToken: async (): Promise<{ token: string; expiresAt: string; ttlSeconds: number; dayNumber: number; dayLabel: string }> => {
    return apiClient.get('/qr/current');
  },
  rotateToken: async (): Promise<{ token: string; expiresAt: string; ttlSeconds: number; dayNumber: number; dayLabel: string }> => {
    return apiClient.post('/qr/rotate');
  },
  verifyToken: async (token: string): Promise<{ token: string; isValid: boolean; status: string; isExpired: boolean; dayNumber: number; dayLabel: string }> => {
    return apiClient.get(`/qr/verify/${token}`);
  },
  claimToken: async (token: string): Promise<{ sessionToken: string; expiresAt: string; dayId: string; dayNumber: number; dayLabel: string }> => {
    return apiClient.post(`/qr/claim/${token}`);
  },
};

export const participationsApi = {
  register: async (data: { sessionToken: string; name: string; phone: string }): Promise<{ reference: string; visitorName: string; registeredAt: string; message: string }> => {
    return apiClient.post('/participations/register', data);
  },
  getQueue: async (params?: { status?: string; limit?: number; offset?: number; search?: string; order?: 'asc' | 'desc' }): Promise<Participation[]> => {
    return apiClient.get('/participations/queue', { params });
  },
  getById: async (id: string): Promise<Participation> => {
    return apiClient.get(`/participations/${id}`);
  },
  select: async (id: string): Promise<Participation> => {
    return apiClient.post(`/participations/${id}/select`);
  },
  skip: async (id: string): Promise<Participation> => {
    return apiClient.post(`/participations/${id}/skip`);
  },
  requeue: async (id: string): Promise<Participation> => {
    return apiClient.post(`/participations/${id}/requeue`);
  },
};

export const merchantsApi = {
  list: async (all = true): Promise<Merchant[]> => {
    return apiClient.get('/merchants', { params: { all } });
  },
  getById: async (id: string): Promise<Merchant> => {
    return apiClient.get(`/merchants/${id}`);
  },
  create: async (data: Partial<Merchant>): Promise<Merchant> => {
    return apiClient.post('/merchants', data);
  },
  update: async (id: string, data: Partial<Merchant>): Promise<Merchant> => {
    return apiClient.patch(`/merchants/${id}`, data);
  },
  delete: async (id: string): Promise<Merchant> => {
    return apiClient.delete(`/merchants/${id}`);
  },
};

export const rewardsApi = {
  list: async (all = true): Promise<Reward[]> => {
    return apiClient.get('/rewards', { params: { all } });
  },
  getById: async (id: string): Promise<Reward> => {
    return apiClient.get(`/rewards/${id}`);
  },
  create: async (data: any): Promise<Reward> => {
    return apiClient.post('/rewards', data);
  },
  update: async (id: string, data: any): Promise<Reward> => {
    return apiClient.patch(`/rewards/${id}`, data);
  },
  adjustStock: async (id: string, data: { quantityDelta: number; notes: string }): Promise<Reward> => {
    return apiClient.post(`/rewards/${id}/adjust-stock`, data);
  },
  listAwards: async (dayId?: string): Promise<Award[]> => {
    return apiClient.get('/rewards/awards', { params: { dayId } });
  },
  cancelAward: async (awardId: string, data: { resolution: string; reason: string }): Promise<{ message: string; award: Award }> => {
    return apiClient.post(`/rewards/awards/${awardId}/cancel`, data);
  },
};

export const wheelApi = {
  getActiveDisplay: async (): Promise<WheelConfigDisplay> => {
    return apiClient.get('/wheel/active');
  },
  getProbabilityPreview: async (): Promise<ProbabilityPreviewResponse> => {
    return apiClient.get('/wheel/probability-preview');
  },
  listConfigs: async (): Promise<any[]> => {
    return apiClient.get('/wheel/configs');
  },
  createConfig: async (data: any): Promise<any> => {
    return apiClient.post('/wheel/configs', data);
  },
  publishConfig: async (configId: string): Promise<any> => {
    return apiClient.post(`/wheel/configs/${configId}/publish`);
  },
  listPriorityLists: async (): Promise<any[]> => {
    return apiClient.get('/wheel/priority-lists');
  },
  createPriorityList: async (data: { name: string; items: { rewardId: string; rank: number }[] }): Promise<any> => {
    return apiClient.post('/wheel/priority-lists', data);
  },
  publishPriorityList: async (id: string): Promise<any> => {
    return apiClient.post(`/wheel/priority-lists/${id}/publish`);
  },
  deactivatePriorityList: async (id: string): Promise<any> => {
    return apiClient.post(`/wheel/priority-lists/${id}/deactivate`);
  },
};

export const spinsApi = {
  execute: async (participationId: string, idempotencyKey: string): Promise<SpinResult> => {
    return apiClient.post('/spins/execute', { participationId, idempotencyKey });
  },
  getCrashRecovery: async (participationId: string): Promise<SpinResult> => {
    return apiClient.get(`/spins/participation/${participationId}`);
  },
};

export const reportsApi = {
  getDashboard: async (): Promise<DashboardSummary> => {
    return apiClient.get('/reports/dashboard');
  },
  getSummary: async (dayId?: string): Promise<any> => {
    return apiClient.get('/reports/summary', { params: { dayId } });
  },
  getAuditLogs: async (limit = 100, action?: string): Promise<any[]> => {
    return apiClient.get('/reports/audit-logs', { params: { limit, action } });
  },
};
