"""AI-powered feature API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin, get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.schemas import (
    HealthAdviceResponse,
    HealthAssistantRequest,
    InterventionPlanResponse,
    InterventionRequest,
    ReportRequest,
    ReportResponse,
    WhatIfRequest,
    WhatIfResponse,
)
from app.models.user import Report as ReportModel, Simulation
from app.services.ai_service import ai_service
from app.services.pdf_service import pdf_service

router = APIRouter(prefix="/ai", tags=["AI Features"])


@router.post("/interventions", response_model=InterventionPlanResponse)
async def plan_interventions(
    request: InterventionRequest,
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await ai_service.plan_interventions(
        request.zone_id, request.current_aqi, request.budget_level
    )


@router.post("/health-advice", response_model=HealthAdviceResponse)
async def get_health_advice(
    request: HealthAssistantRequest,
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await ai_service.health_advice(
        request.age,
        request.has_asthma,
        request.has_heart_condition,
        request.activity_level,
        request.zone_id,
        request.outdoor_hours,
    )


@router.post("/what-if", response_model=WhatIfResponse)
async def simulate_what_if(
    request: WhatIfRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await ai_service.what_if_simulate(
        request.zone_id, request.interventions, request.duration_hours
    )
    simulation = Simulation(
        user_id=current_user.id,
        name=f"What-If: {', '.join(request.interventions[:2])}",
        scenario=str(request.interventions),
        baseline_aqi=result["baseline_aqi"],
        projected_aqi=result["projected_aqi"],
        interventions_applied=str(request.interventions),
    )
    db.add(simulation)
    return result


@router.post("/reports", response_model=ReportResponse)
async def generate_report(
    request: ReportRequest,
    current_user: Annotated[User, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    report_data = pdf_service.generate_report(
        request.zone_id, request.report_type, current_user.id
    )
    report = ReportModel(
        user_id=current_user.id,
        title=report_data["title"],
        file_path=report_data["file_path"],
        report_type=request.report_type,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)

    return ReportResponse(
        id=report.id,
        title=report.title,
        file_path=report.file_path,
        download_url=f"/api/v1/ai/reports/{report.id}/download",
        created_at=report.created_at,
    )


@router.get("/reports/{report_id}/download")
async def download_report(
    report_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from sqlalchemy import select

    result = await db.execute(select(ReportModel).where(ReportModel.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Report not found")

    return FileResponse(
        report.file_path,
        media_type="application/pdf",
        filename=report.file_path.split("/")[-1].split("\\")[-1],
    )
