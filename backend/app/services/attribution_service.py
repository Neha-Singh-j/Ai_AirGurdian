"""Pollution source attribution service."""

from app.services.mock_data import get_source_attribution as mock_attribution


class AttributionService:
    async def attribute(self, zone_id: str) -> dict:
        return mock_attribution(zone_id)


attribution_service = AttributionService()
