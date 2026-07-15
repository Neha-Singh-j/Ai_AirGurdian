import api from './api';
import type {
  AdminAnalytics,
  AQReading,
  HealthAdvice,
  HeatmapPoint,
  InterventionPlan,
  PredictionResponse,
  SourceAttribution,
  User,
  WhatIfResult,
  Zone,
} from '../types';

export const authApi = {
  login: async (email: string, password: string) => {
    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);
    const { data } = await api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data as { access_token: string; user: User };
  },
  register: async (email: string, fullName: string, password: string) => {
    const { data } = await api.post('/auth/register', {
      email,
      full_name: fullName,
      password,
    });
    return data as User;
  },
  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data as User;
  },
};

export const pollutionApi = {
  getZones: async () => {
    const { data } = await api.get('/pollution/zones');
    return data as Zone[];
  },
  getReadings: async (zoneId?: string) => {
    const { data } = await api.get('/pollution/readings', {
      params: zoneId ? { zone_id: zoneId } : {},
    });
    return data as AQReading[];
  },
  getHeatmap: async () => {
    const { data } = await api.get('/pollution/heatmap');
    return data as HeatmapPoint[];
  },
  getPredictions: async (zoneId: string) => {
    const { data } = await api.get(`/pollution/predictions/${zoneId}`);
    return data as PredictionResponse;
  },
  getAttribution: async (zoneId: string) => {
    const { data } = await api.get(`/pollution/attribution/${zoneId}`);
    return data as { zone_id: string; zone_name: string; total_aqi: number; sources: SourceAttribution[] };
  },
};

export const aiApi = {
  planInterventions: async (zoneId: string, budgetLevel = 'medium') => {
    const { data } = await api.post('/ai/interventions', {
      zone_id: zoneId,
      budget_level: budgetLevel,
    });
    return data as InterventionPlan;
  },
  getHealthAdvice: async (params: {
    age: number;
    has_asthma: boolean;
    has_heart_condition: boolean;
    activity_level: string;
    zone_id: string;
    outdoor_hours: number;
  }) => {
    const { data } = await api.post('/ai/health-advice', params);
    return data as HealthAdvice;
  },
  simulateWhatIf: async (zoneId: string, interventions: string[], durationHours = 24) => {
    const { data } = await api.post('/ai/what-if', {
      zone_id: zoneId,
      interventions,
      duration_hours: durationHours,
    });
    return data as WhatIfResult;
  },
  generateReport: async (zoneId: string, reportType = 'comprehensive') => {
    const { data } = await api.post('/ai/reports', {
      zone_id: zoneId,
      report_type: reportType,
    });
    return data as { id: number; title: string; download_url: string; created_at: string };
  },
};

export const analyticsApi = {
  getDashboard: async () => {
    const { data } = await api.get('/analytics/dashboard');
    return data as AdminAnalytics;
  },
};
