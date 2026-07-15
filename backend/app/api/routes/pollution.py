"""Pollution data and AQI API routes."""

from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.schemas import (
    AQReadingResponse,
    HeatmapPoint,
    PredictionResponse,
    SourceAttributionResponse,
)
from app.services.attribution_service import attribution_service
from app.services.mock_data import get_current_readings, get_heatmap_data, get_zone_by_id, CITY_ZONES
from app.services.prediction_service import prediction_service

router = APIRouter(prefix="/pollution", tags=["Pollution Data"])


@router.get("/zones")
async def list_zones(current_user: Annotated[User, Depends(get_current_user)]):
    return CITY_ZONES


@router.get("/readings", response_model=List[AQReadingResponse])
async def get_readings(
    current_user: Annotated[User, Depends(get_current_user)],
    zone_id: Optional[str] = Query(None),
):
    readings = get_current_readings()
    if zone_id:
        readings = [r for r in readings if r["zone_id"] == zone_id]
    return readings


@router.get("/heatmap", response_model=List[HeatmapPoint])
async def get_heatmap(current_user: Annotated[User, Depends(get_current_user)]):
    return get_heatmap_data()


@router.get("/predictions/{zone_id}", response_model=PredictionResponse)
async def get_predictions(
    zone_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await prediction_service.predict(zone_id)


@router.get("/attribution/{zone_id}", response_model=SourceAttributionResponse)
async def get_attribution(
    zone_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await attribution_service.attribute(zone_id)
