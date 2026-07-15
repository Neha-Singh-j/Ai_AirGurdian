export type UserRole = 'admin' | 'analyst' | 'citizen';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AQReading {
  zone_id: string;
  zone_name: string;
  latitude: number;
  longitude: number;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  co: number;
  category: string;
  recorded_at: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  aqi: number;
  intensity: number;
}

export interface PredictionPoint {
  hours_ahead: number;
  aqi: number;
  pm25: number;
  category: string;
  confidence: number;
}

export interface PredictionResponse {
  zone_id: string;
  zone_name: string;
  current_aqi: number;
  predictions: PredictionPoint[];
}

export interface SourceAttribution {
  source: string;
  percentage: number;
  confidence: number;
  description: string;
}

export interface InterventionAction {
  title: string;
  description: string;
  category: string;
  priority: string;
  estimated_aqi_reduction: number;
  cost_estimate: string;
  timeline: string;
  confidence: number;
}

export interface InterventionPlan {
  zone_id: string;
  zone_name: string;
  current_aqi: number;
  risk_level: string;
  actions: InterventionAction[];
  ai_summary: string;
}

export interface HealthAdvice {
  risk_level: string;
  recommendations: string[];
  safe_outdoor_hours: string;
  mask_recommendation: string;
  ai_summary: string;
}

export interface WhatIfResult {
  zone_id: string;
  zone_name: string;
  baseline_aqi: number;
  projected_aqi: number;
  aqi_reduction: number;
  reduction_percentage: number;
  timeline: { hour: number; aqi: number }[];
  impact_summary: string;
}

export interface Zone {
  zone_id: string;
  zone_name: string;
  lat: number;
  lng: number;
}

export interface AdminAnalytics {
  total_zones: number;
  city_avg_aqi: number;
  unhealthy_zones: number;
  interventions_active: number;
  zones: {
    zone_id: string;
    zone_name: string;
    avg_aqi: number;
    max_aqi: number;
    min_aqi: number;
    trend: string;
  }[];
  hourly_trend: { hour: string; aqi: number; pm25: number }[];
  category_distribution: { category: string; count: number }[];
}
