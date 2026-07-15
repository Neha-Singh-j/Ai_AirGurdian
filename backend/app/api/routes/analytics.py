"""Admin analytics API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_current_admin
from app.models.user import User
from app.schemas.schemas import AdminAnalyticsResponse, ZoneAnalytics
from app.services.mock_data import (
    CITY_ZONES,
    ZONE_BASE_AQI,
    get_aqi_category,
    get_category_distribution,
    get_current_readings,
    get_hourly_trend,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=AdminAnalyticsResponse)
async def get_admin_dashboard(current_user: Annotated[User, Depends(get_current_admin)]):
    readings = get_current_readings()
    zones_analytics = []
    unhealthy = 0

    for reading in readings:
        if reading["aqi"] > 150:
            unhealthy += 1
        base = ZONE_BASE_AQI.get(reading["zone_id"], 150)
        zones_analytics.append(
            ZoneAnalytics(
                zone_id=reading["zone_id"],
                zone_name=reading["zone_name"],
                avg_aqi=reading["aqi"],
                max_aqi=round(base * 1.15, 1),
                min_aqi=round(base * 0.75, 1),
                trend="rising" if reading["aqi"] > base else "stable",
            )
        )

    avg_aqi = round(sum(r["aqi"] for r in readings) / len(readings), 1)

    return AdminAnalyticsResponse(
        total_zones=len(CITY_ZONES),
        city_avg_aqi=avg_aqi,
        unhealthy_zones=unhealthy,
        interventions_active=3,
        zones=zones_analytics,
        hourly_trend=get_hourly_trend(),
        category_distribution=get_category_distribution(),
    )
