"""Mock pollution data for offline/demo mode."""

from datetime import datetime, timedelta, timezone
from typing import List

# Delhi NCR zones - realistic coordinates
CITY_ZONES = [
    {"zone_id": "ZN-001", "zone_name": "Connaught Place", "lat": 28.6315, "lng": 77.2167},
    {"zone_id": "ZN-002", "zone_name": "Dwarka", "lat": 28.5921, "lng": 77.0460},
    {"zone_id": "ZN-003", "zone_name": "Rohini", "lat": 28.7495, "lng": 77.0565},
    {"zone_id": "ZN-004", "zone_name": "Noida Sector 62", "lat": 28.6246, "lng": 77.3570},
    {"zone_id": "ZN-005", "zone_name": "Gurgaon Cyber City", "lat": 28.4946, "lng": 77.0887},
    {"zone_id": "ZN-006", "zone_name": "Anand Vihar", "lat": 28.6469, "lng": 77.3164},
    {"zone_id": "ZN-007", "zone_name": "ITO Industrial", "lat": 28.6289, "lng": 77.2410},
    {"zone_id": "ZN-008", "zone_name": "Saket", "lat": 28.5244, "lng": 77.2066},
    {"zone_id": "ZN-009", "zone_name": "Mayur Vihar", "lat": 28.6090, "lng": 77.2955},
    {"zone_id": "ZN-010", "zone_name": "Punjabi Bagh", "lat": 28.6692, "lng": 77.1460},
]

# Base AQI values per zone (simulates real variation)
ZONE_BASE_AQI = {
    "ZN-001": 185, "ZN-002": 142, "ZN-003": 168, "ZN-004": 195,
    "ZN-005": 178, "ZN-006": 220, "ZN-007": 245, "ZN-008": 125,
    "ZN-009": 198, "ZN-010": 155,
}


def get_aqi_category(aqi: float) -> str:
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Moderate"
    if aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    if aqi <= 200:
        return "Unhealthy"
    if aqi <= 300:
        return "Very Unhealthy"
    return "Hazardous"


def _pollutants_from_aqi(aqi: float) -> dict:
    """Derive pollutant levels from AQI (simplified model)."""
    factor = aqi / 100
    return {
        "pm25": round(12 * factor + 5, 1),
        "pm10": round(25 * factor + 10, 1),
        "no2": round(20 * factor + 8, 1),
        "o3": round(35 * factor + 12, 1),
        "co": round(0.8 * factor + 0.3, 2),
    }


def get_current_readings() -> List[dict]:
    now = datetime.now(timezone.utc)
    readings = []
    for zone in CITY_ZONES:
        base = ZONE_BASE_AQI.get(zone["zone_id"], 150)
        # Add time-of-day variation
        hour_factor = 1.0 + 0.15 * abs((now.hour - 8) % 24 - 12) / 12
        aqi = round(base * hour_factor, 1)
        pollutants = _pollutants_from_aqi(aqi)
        readings.append({
            "zone_id": zone["zone_id"],
            "zone_name": zone["zone_name"],
            "latitude": zone["lat"],
            "longitude": zone["lng"],
            "aqi": aqi,
            **pollutants,
            "category": get_aqi_category(aqi),
            "recorded_at": now.isoformat(),
        })
    return readings


def get_zone_by_id(zone_id: str) -> dict | None:
    for zone in CITY_ZONES:
        if zone["zone_id"] == zone_id:
            return zone
    return None


def get_heatmap_data() -> List[dict]:
    readings = get_current_readings()
    return [
        {
            "lat": r["latitude"],
            "lng": r["longitude"],
            "aqi": r["aqi"],
            "intensity": min(r["aqi"] / 300, 1.0),
        }
        for r in readings
    ]


def get_predictions(zone_id: str) -> dict:
    zone = get_zone_by_id(zone_id) or CITY_ZONES[0]
    base_aqi = ZONE_BASE_AQI.get(zone["zone_id"], 150)
    now = datetime.now(timezone.utc)
    hour_factor = 1.0 + 0.15 * abs((now.hour - 8) % 24 - 12) / 12
    current = round(base_aqi * hour_factor, 1)

    predictions = []
    for hours in [6, 12, 24, 72]:
        # Simulate diurnal cycle + slight upward trend
        cycle = 1.0 + 0.1 * ((hours % 24) / 24)
        trend = 1.0 + (hours / 72) * 0.08
        pred_aqi = round(current * cycle * trend, 1)
        pm25 = round(12 * (pred_aqi / 100) + 5, 1)
        predictions.append({
            "hours_ahead": hours,
            "aqi": pred_aqi,
            "pm25": pm25,
            "category": get_aqi_category(pred_aqi),
            "confidence": round(max(0.65, 0.95 - hours * 0.004), 2),
        })

    return {
        "zone_id": zone["zone_id"],
        "zone_name": zone["zone_name"],
        "current_aqi": current,
        "predictions": predictions,
    }


def get_source_attribution(zone_id: str) -> dict:
    zone = get_zone_by_id(zone_id) or CITY_ZONES[0]
    base_aqi = ZONE_BASE_AQI.get(zone["zone_id"], 150)

    # Zone-specific source profiles
    profiles = {
        "ZN-007": [  # Industrial
            ("Vehicular Emissions", 28, 0.88, "Heavy truck traffic on NH-24 corridor"),
            ("Industrial Stack", 35, 0.92, "Manufacturing units in Okhla industrial area"),
            ("Construction Dust", 18, 0.85, "Metro expansion and road work"),
            ("Biomass Burning", 12, 0.78, "Seasonal crop residue burning upwind"),
            ("Power Generation", 7, 0.80, "Nearby thermal power plant"),
        ],
        "ZN-006": [  # Anand Vihar - transport hub
            ("Vehicular Emissions", 42, 0.91, "ISBT bus terminal and highway junction"),
            ("Construction Dust", 22, 0.86, "Eastern peripheral expressway work"),
            ("Industrial Stack", 15, 0.82, "Warehousing and logistics emissions"),
            ("Biomass Burning", 14, 0.75, "Open waste burning in nearby settlements"),
            ("Residential Heating", 7, 0.70, "Winter heating and cooking fuels"),
        ],
    }

    default_sources = [
        ("Vehicular Emissions", 32, 0.89, "Urban traffic congestion and idling"),
        ("Construction Dust", 20, 0.84, "Ongoing infrastructure projects"),
        ("Industrial Stack", 18, 0.87, "Industrial zone emissions"),
        ("Biomass Burning", 15, 0.76, "Agricultural and waste burning"),
        ("Power Generation", 8, 0.81, "Grid power and backup generators"),
        ("Residential Heating", 7, 0.72, "Cooking and heating emissions"),
    ]

    sources_data = profiles.get(zone["zone_id"], default_sources)
    sources = [
        {
            "source": s[0],
            "percentage": s[1],
            "confidence": s[2],
            "description": s[3],
        }
        for s in sources_data
    ]

    return {
        "zone_id": zone["zone_id"],
        "zone_name": zone["zone_name"],
        "total_aqi": base_aqi,
        "sources": sources,
    }


def get_hourly_trend() -> List[dict]:
    now = datetime.now(timezone.utc)
    trend = []
    for i in range(24):
        t = now - timedelta(hours=23 - i)
        hour = t.hour
        factor = 1.0 + 0.2 * abs(hour - 8) / 12
        trend.append({
            "hour": t.strftime("%H:00"),
            "aqi": round(165 * factor, 1),
            "pm25": round(45 * factor, 1),
        })
    return trend


def get_category_distribution() -> List[dict]:
    readings = get_current_readings()
    categories: dict[str, int] = {}
    for r in readings:
        cat = r["category"]
        categories[cat] = categories.get(cat, 0) + 1
    return [{"category": k, "count": v} for k, v in categories.items()]
