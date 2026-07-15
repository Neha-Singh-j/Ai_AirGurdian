"""Pydantic request/response schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


# Auth
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    role: UserRole = UserRole.CITIZEN


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# AQI & Pollution
class AQReadingResponse(BaseModel):
    zone_id: str
    zone_name: str
    latitude: float
    longitude: float
    aqi: float
    pm25: float
    pm10: float
    no2: float
    o3: float
    co: float
    category: str
    recorded_at: datetime


class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    aqi: float
    intensity: float


class PredictionPoint(BaseModel):
    hours_ahead: int
    aqi: float
    pm25: float
    category: str
    confidence: float


class PredictionResponse(BaseModel):
    zone_id: str
    zone_name: str
    current_aqi: float
    predictions: List[PredictionPoint]


class SourceAttribution(BaseModel):
    source: str
    percentage: float
    confidence: float
    description: str


class SourceAttributionResponse(BaseModel):
    zone_id: str
    zone_name: str
    total_aqi: float
    sources: List[SourceAttribution]


# AI Features
class InterventionRequest(BaseModel):
    zone_id: str
    current_aqi: Optional[float] = None
    budget_level: str = "medium"  # low, medium, high


class InterventionAction(BaseModel):
    title: str
    description: str
    category: str
    priority: str
    estimated_aqi_reduction: float
    cost_estimate: str
    timeline: str
    confidence: float


class InterventionPlanResponse(BaseModel):
    zone_id: str
    zone_name: str
    current_aqi: float
    risk_level: str
    actions: List[InterventionAction]
    ai_summary: str


class HealthAssistantRequest(BaseModel):
    age: int = Field(ge=1, le=120)
    has_asthma: bool = False
    has_heart_condition: bool = False
    activity_level: str = "moderate"  # low, moderate, high
    zone_id: str
    outdoor_hours: float = Field(ge=0, le=24, default=2)


class HealthAdviceResponse(BaseModel):
    risk_level: str
    recommendations: List[str]
    safe_outdoor_hours: str
    mask_recommendation: str
    ai_summary: str


class WhatIfRequest(BaseModel):
    zone_id: str
    interventions: List[str]
    duration_hours: int = 24


class WhatIfResponse(BaseModel):
    zone_id: str
    zone_name: str
    baseline_aqi: float
    projected_aqi: float
    aqi_reduction: float
    reduction_percentage: float
    timeline: List[dict]
    impact_summary: str


class ReportRequest(BaseModel):
    zone_id: str
    report_type: str = "comprehensive"  # comprehensive, executive, health


class ReportResponse(BaseModel):
    id: int
    title: str
    file_path: str
    download_url: str
    created_at: datetime


# Analytics
class ZoneAnalytics(BaseModel):
    zone_id: str
    zone_name: str
    avg_aqi: float
    max_aqi: float
    min_aqi: float
    trend: str


class AdminAnalyticsResponse(BaseModel):
    total_zones: int
    city_avg_aqi: float
    unhealthy_zones: int
    interventions_active: int
    zones: List[ZoneAnalytics]
    hourly_trend: List[dict]
    category_distribution: List[dict]
