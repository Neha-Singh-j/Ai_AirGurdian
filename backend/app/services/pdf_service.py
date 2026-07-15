"""PDF report generation service."""

import os
from datetime import datetime, timezone
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.core.config import get_settings
from app.services.mock_data import (
    get_aqi_category,
    get_category_distribution,
    get_current_readings,
    get_hourly_trend,
    get_predictions,
    get_source_attribution,
    get_zone_by_id,
)

settings = get_settings()


class PDFReportService:
    def __init__(self):
        self.reports_dir = Path(settings.REPORTS_DIR)
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    def generate_report(self, zone_id: str, report_type: str = "comprehensive", user_id: int = 0) -> dict:
        zone = get_zone_by_id(zone_id) or {"zone_id": zone_id, "zone_name": "City Overview"}
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filename = f"airguardian_{zone_id}_{report_type}_{timestamp}.pdf"
        filepath = self.reports_dir / filename

        doc = SimpleDocTemplate(str(filepath), pagesize=A4, topMargin=0.75 * inch, bottomMargin=0.75 * inch)
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle("CustomTitle", parent=styles["Title"], fontSize=22, spaceAfter=20, textColor=colors.HexColor("#1e40af"))
        heading_style = ParagraphStyle("CustomHeading", parent=styles["Heading2"], fontSize=14, spaceAfter=10, textColor=colors.HexColor("#1e3a5f"))
        body_style = ParagraphStyle("CustomBody", parent=styles["Normal"], fontSize=10, spaceAfter=8, leading=14)

        elements = []
        elements.append(Paragraph("AirGuardian AI — Air Quality Report", title_style))
        elements.append(Paragraph(
            f"Zone: {zone['zone_name']} | Type: {report_type.title()} | "
            f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
            body_style,
        ))
        elements.append(Spacer(1, 0.3 * inch))

        # Current status
        readings = get_current_readings()
        zone_reading = next((r for r in readings if r["zone_id"] == zone_id), readings[0])
        elements.append(Paragraph("Current Air Quality Status", heading_style))
        status_data = [
            ["Metric", "Value"],
            ["AQI", str(zone_reading["aqi"])],
            ["Category", zone_reading["category"]],
            ["PM2.5", f"{zone_reading['pm25']} µg/m³"],
            ["PM10", f"{zone_reading['pm10']} µg/m³"],
            ["NO₂", f"{zone_reading['no2']} µg/m³"],
        ]
        status_table = Table(status_data, colWidths=[2.5 * inch, 3 * inch])
        status_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0f4ff")]),
        ]))
        elements.append(status_table)
        elements.append(Spacer(1, 0.2 * inch))

        # Predictions
        predictions = get_predictions(zone_id)
        elements.append(Paragraph("AQI Forecast", heading_style))
        pred_data = [["Horizon", "AQI", "Category", "Confidence"]]
        for p in predictions["predictions"]:
            pred_data.append([f"{p['hours_ahead']}h", str(p["aqi"]), p["category"], f"{p['confidence']*100:.0f}%"])
        pred_table = Table(pred_data, colWidths=[1.2 * inch, 1 * inch, 2.5 * inch, 1 * inch])
        pred_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#059669")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(pred_table)
        elements.append(Spacer(1, 0.2 * inch))

        # Source attribution
        attribution = get_source_attribution(zone_id)
        elements.append(Paragraph("Pollution Source Attribution", heading_style))
        src_data = [["Source", "Contribution", "Confidence"]]
        for s in attribution["sources"]:
            src_data.append([s["source"], f"{s['percentage']}%", f"{s['confidence']*100:.0f}%"])
        src_table = Table(src_data, colWidths=[2.5 * inch, 1.5 * inch, 1.5 * inch])
        src_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dc2626")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(src_table)
        elements.append(Spacer(1, 0.2 * inch))

        # Recommendations
        elements.append(Paragraph("Recommended Government Actions", heading_style))
        recommendations = [
            "1. Implement odd-even vehicle rationing if AQI exceeds 200 for 24 consecutive hours.",
            "2. Deploy water sprinklers on arterial roads during early morning hours.",
            "3. Conduct targeted industrial emission audits in high-contribution zones.",
            "4. Increase public transport capacity by 30% on high-pollution days.",
            "5. Issue health advisories for vulnerable populations when AQI > 150.",
        ]
        for rec in recommendations:
            elements.append(Paragraph(rec, body_style))

        elements.append(Spacer(1, 0.3 * inch))
        elements.append(Paragraph(
            "<i>Report generated by AirGuardian AI. Data sources: municipal sensors, satellite imagery, and predictive models.</i>",
            ParagraphStyle("Footer", parent=body_style, fontSize=8, textColor=colors.grey),
        ))

        doc.build(elements)

        return {
            "title": f"Air Quality Report — {zone['zone_name']} ({report_type.title()})",
            "file_path": str(filepath),
            "filename": filename,
        }


pdf_service = PDFReportService()
