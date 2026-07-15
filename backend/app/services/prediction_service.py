"""AQI prediction service with mock fallback."""

from app.services.mock_data import get_predictions as mock_predictions


class PredictionService:
    async def predict(self, zone_id: str) -> dict:
        return mock_predictions(zone_id)


prediction_service = PredictionService()
