"""LangChain + Gemini AI services with FAISS vector store."""

import os
from pathlib import Path
from typing import List, Optional

from app.core.config import get_settings
from app.services.mock_data import (
    ZONE_BASE_AQI,
    get_aqi_category,
    get_source_attribution,
    get_zone_by_id,
)

settings = get_settings()

# Policy knowledge base for RAG
POLICY_DOCUMENTS = [
    "Implement odd-even vehicle rationing during AQI above 200 to reduce vehicular emissions by 15-25%.",
    "Deploy water sprinklers on major roads during morning hours to suppress road dust by 10-15%.",
    "Ban construction activities when AQI exceeds 300 for 48 hours to reduce dust by 20-30%.",
    "Increase public transport frequency by 30% during high pollution days to shift mode share.",
    "Deploy mobile air quality monitoring units to industrial zones for real-time enforcement.",
    "Mandate use of BS-VI compliant vehicles in commercial fleets within city limits.",
    "Install anti-smog guns at construction sites larger than 20,000 sq meters.",
    "Create green buffers along highways using native tree species to trap particulates.",
    "Enforce strict emission standards on diesel generators during peak pollution hours.",
    "Distribute N95 masks to vulnerable populations when AQI exceeds 150 for 24 hours.",
    "Coordinate with neighboring states on crop residue burning prevention programs.",
    "Implement dynamic parking fees in congested zones to discourage private vehicle use.",
    "Promote work-from-home policies for government employees during severe air quality events.",
    "Deploy electric bus fleets on high-traffic corridors to replace diesel buses.",
    "Establish low-emission zones around schools and hospitals with vehicle restrictions.",
]


class AIService:
    def __init__(self):
        self._llm = None
        self._vectorstore = None
        self._initialized = False

    def validate_startup(self):
        if settings.USE_MOCK_DATA:
            print("Running in MOCK MODE")
            return

        if not settings.GEMINI_API_KEY:
            print("Running in MOCK MODE")
            raise ValueError("USE_MOCK_DATA is false, but GEMINI_API_KEY is not set.")

        try:
            self._init_llm()
            if self._llm is not None:
                print("✓ Gemini initialized successfully")
                print("Running in GEMINI MODE")
            else:
                print("Running in MOCK MODE")
                raise ValueError("Failed to initialize Gemini LLM.")
        except Exception as e:
            print("Running in MOCK MODE")
            raise ValueError(f"Failed to initialize Gemini: {e}") from e

    def _init_llm(self):
        if self._initialized:
            if not self._llm and not settings.USE_MOCK_DATA:
                raise ValueError("Gemini LLM is not initialized.")
            return
        self._initialized = True
        if not settings.GEMINI_API_KEY:
            if not settings.USE_MOCK_DATA:
                raise ValueError("GEMINI_API_KEY is not configured.")
            return
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI

            self._llm = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.3,
            )
            self._init_vectorstore()
        except Exception as e:
            self._llm = None
            if not settings.USE_MOCK_DATA:
                raise RuntimeError(f"Failed to initialize ChatGoogleGenerativeAI: {e}") from e

    def _init_vectorstore(self):
        try:
            from langchain_community.vectorstores import FAISS
            from langchain_core.documents import Document
            from langchain_google_genai import GoogleGenerativeAIEmbeddings

            index_path = settings.FAISS_INDEX_PATH
            embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=settings.GEMINI_API_KEY,
            )

            if os.path.exists(f"{index_path}/index.faiss"):
                self._vectorstore = FAISS.load_local(
                    index_path, embeddings, allow_dangerous_deserialization=True
                )
            else:
                docs = [Document(page_content=d, metadata={"source": "policy"}) for d in POLICY_DOCUMENTS]
                self._vectorstore = FAISS.from_documents(docs, embeddings)
                Path(index_path).parent.mkdir(parents=True, exist_ok=True)
                self._vectorstore.save_local(index_path)
        except Exception as e:
            self._vectorstore = None
            if not settings.USE_MOCK_DATA:
                raise RuntimeError(f"Failed to initialize vectorstore: {e}") from e

    async def _generate(self, prompt: str) -> Optional[str]:
        self._init_llm()
        if not self._llm:
            if not settings.USE_MOCK_DATA:
                raise ValueError("LLM is not initialized.")
            return None
        try:
            response = await self._llm.ainvoke(prompt)
            return response.content
        except Exception as e:
            if not settings.USE_MOCK_DATA:
                raise RuntimeError(f"Gemini API call failed: {e}") from e
            return None

    def _get_relevant_policies(self, query: str, k: int = 5) -> List[str]:
        if self._vectorstore:
            try:
                docs = self._vectorstore.similarity_search(query, k=k)
                return [d.page_content for d in docs]
            except Exception as e:
                if not settings.USE_MOCK_DATA:
                    raise RuntimeError(f"Vector store similarity search failed: {e}") from e
        elif not settings.USE_MOCK_DATA:
            raise ValueError("Vector store is not initialized.")
        return POLICY_DOCUMENTS[:k]

    def _get_environmental_data(self, zone_id: str, aqi: float) -> dict:
        is_hub = zone_id in ["ZN-006", "ZN-007"]
        traffic = "Heavy" if (is_hub or aqi > 180) else "Moderate" if aqi > 120 else "Light"
        
        if aqi > 200:
            weather = "Dense Smog"
            wind_speed = round(3.0 + (aqi % 3), 1)
            humidity = round(65.0 + (aqi % 10), 1)
        elif aqi > 150:
            weather = "Hazy / Smoke"
            wind_speed = round(5.0 + (aqi % 4), 1)
            humidity = round(55.0 + (aqi % 10), 1)
        else:
            weather = "Clear Sky" if aqi < 80 else "Partly Cloudy"
            wind_speed = round(10.0 + (aqi % 8), 1)
            humidity = round(45.0 + (aqi % 10), 1)
            
        return {
            "weather": weather,
            "wind_speed": f"{wind_speed} km/h",
            "humidity": f"{humidity}%",
            "traffic": traffic
        }

    async def plan_interventions(
        self, zone_id: str, current_aqi: Optional[float] = None, budget_level: str = "medium"
    ) -> dict:
        zone = get_zone_by_id(zone_id) or {"zone_id": zone_id, "zone_name": "Unknown Zone"}
        aqi = current_aqi or ZONE_BASE_AQI.get(zone_id, 150)
        category = get_aqi_category(aqi)
        attribution = get_source_attribution(zone_id)
        top_sources = ", ".join(f"{s['source']} ({s['percentage']}%)" for s in attribution["sources"])

        readings = get_current_readings()
        zone_reading = next((r for r in readings if r["zone_id"] == zone_id), None)
        pm25 = zone_reading["pm25"] if zone_reading else round(aqi * 0.12, 1)
        pm10 = zone_reading["pm10"] if zone_reading else round(aqi * 0.25, 1)
        env = self._get_environmental_data(zone_id, aqi)

        if settings.USE_MOCK_DATA:
            return self._mock_intervention_plan(zone, aqi, category, budget_level)

        policies = self._get_relevant_policies(
            f"air pollution intervention {top_sources} AQI {aqi} budget {budget_level}"
        )
        policy_text = "\n".join(f"- {p}" for p in policies)

        prompt = f"""You are an urban air quality policy advisor for city government. Analyze the following air quality data:
Zone: {zone['zone_name']} (ID: {zone_id})
Current AQI: {aqi} ({category})
PM2.5: {pm25} µg/m³
PM10: {pm10} µg/m³
Weather: {env['weather']}
Wind Speed: {env['wind_speed']}
Humidity: {env['humidity']}
Traffic Level: {env['traffic']}
Budget Level for Interventions: {budget_level}
Primary Pollution Sources: {top_sources}

Relevant Policies/Guidance:
{policy_text}

Using this data, you must produce:
1. A Root Cause Analysis (why the pollution is at this level based on weather, wind, sources, etc.)
2. 4-5 Government recommendations/actions (under the specified budget level)
3. Expected impact, timeline, and cost for each action
4. Citizen advice (how residents should protect themselves or cooperate)
5. Confidence level and reasoning for each action

Your response must be in valid JSON matching this exact structure:
{{
    "actions": [
        {{
            "title": "Action Title",
            "description": "Detailed description of the action. Include the expected impact, reasoning, and specific citizen advice.",
            "category": "Traffic Management / Dust Control / Industrial Regulation / etc.",
            "priority": "critical / high / medium / low",
            "estimated_aqi_reduction": 15.5,
            "cost_estimate": "Estimated cost details",
            "timeline": "Timeline to implement",
            "confidence": 0.85
        }}
    ],
    "ai_summary": "Root Cause Analysis: [Your detailed root cause analysis based on weather, wind speed, humidity, and traffic]. Confidence Explanation & Reasoning: [Your reasoning and confidence explanation for the proposed plan]. Citizen Advice: [Actionable advice for the public]."
}}
Respond ONLY with valid JSON. Do not include markdown code block syntax (like ```json)."""

        ai_response = await self._generate(prompt)
        if not ai_response:
            raise ValueError("No response generated from Gemini API for intervention plan.")

        try:
            import json
            import re

            json_match = re.search(r"\{.*\}", ai_response, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                
                # Normalize action confidence and aqi reduction type safety
                for action in data.get("actions", []):
                    action["estimated_aqi_reduction"] = float(action.get("estimated_aqi_reduction", 0))
                    action["confidence"] = float(action.get("confidence", 0.8))
                
                return self._build_intervention_response(zone, aqi, category, data)
            else:
                raise ValueError("Could not extract JSON block from Gemini response.")
        except Exception as e:
            if not settings.USE_MOCK_DATA:
                raise ValueError(f"Failed to parse JSON response from Gemini API: {e}. Raw response: {ai_response}") from e
            return self._mock_intervention_plan(zone, aqi, category, budget_level)

    def _build_intervention_response(self, zone: dict, aqi: float, category: str, data: dict) -> dict:
        risk = "Critical" if aqi > 200 else "High" if aqi > 150 else "Moderate" if aqi > 100 else "Low"
        return {
            "zone_id": zone["zone_id"],
            "zone_name": zone["zone_name"],
            "current_aqi": aqi,
            "risk_level": risk,
            "actions": data.get("actions", []),
            "ai_summary": data.get("ai_summary", "AI-generated intervention plan."),
        }

    def _mock_intervention_plan(self, zone: dict, aqi: float, category: str, budget: str) -> dict:
        risk = "Critical" if aqi > 200 else "High" if aqi > 150 else "Moderate" if aqi > 100 else "Low"
        actions = [
            {
                "title": "Odd-Even Vehicle Rationing",
                "description": "Implement alternate-day vehicle restrictions for private cars based on license plate numbers.",
                "category": "Traffic Management",
                "priority": "critical" if aqi > 200 else "high",
                "estimated_aqi_reduction": 22.0,
                "cost_estimate": "Low - ₹50L enforcement",
                "timeline": "48 hours to implement",
                "confidence": 0.88,
            },
            {
                "title": "Construction Activity Ban",
                "description": "Suspend all non-essential construction and demolition activities in the zone.",
                "category": "Construction Control",
                "priority": "high",
                "estimated_aqi_reduction": 18.0,
                "cost_estimate": "Medium - compensation fund needed",
                "timeline": "Immediate",
                "confidence": 0.85,
            },
            {
                "title": "Road Dust Suppression",
                "description": "Deploy water sprinklers and mechanical sweepers on all arterial roads twice daily.",
                "category": "Dust Control",
                "priority": "high",
                "estimated_aqi_reduction": 12.0,
                "cost_estimate": f"{'Low' if budget == 'low' else 'Medium'} - ₹2Cr/month",
                "timeline": "24 hours",
                "confidence": 0.82,
            },
            {
                "title": "Industrial Emission Audit",
                "description": "Conduct surprise inspections at top 20 industrial emitters; enforce shutdown for violators.",
                "category": "Industrial Regulation",
                "priority": "medium",
                "estimated_aqi_reduction": 15.0,
                "cost_estimate": "Medium - ₹1.5Cr inspection drive",
                "timeline": "1 week",
                "confidence": 0.79,
            },
            {
                "title": "Public Transport Surge",
                "description": "Increase metro and bus frequency by 40%; add 50 electric buses on congested routes.",
                "category": "Transport",
                "priority": "medium",
                "estimated_aqi_reduction": 10.0,
                "cost_estimate": "High - ₹5Cr/month",
                "timeline": "72 hours",
                "confidence": 0.76,
            },
        ]
        return {
            "zone_id": zone["zone_id"],
            "zone_name": zone["zone_name"],
            "current_aqi": aqi,
            "risk_level": risk,
            "actions": actions,
            "ai_summary": (
                f"{zone['zone_name']} is at {category} air quality (AQI {aqi}). "
                f"Immediate odd-even rationing combined with construction bans could reduce AQI by ~35 points within 72 hours."
            ),
        }

    async def health_advice(
        self,
        age: int,
        has_asthma: bool,
        has_heart_condition: bool,
        activity_level: str,
        zone_id: str,
        outdoor_hours: float,
    ) -> dict:
        zone = get_zone_by_id(zone_id) or {"zone_id": zone_id, "zone_name": "Your Area"}
        aqi = ZONE_BASE_AQI.get(zone_id, 150)
        category = get_aqi_category(aqi)

        readings = get_current_readings()
        zone_reading = next((r for r in readings if r["zone_id"] == zone_id), None)
        pm25 = zone_reading["pm25"] if zone_reading else round(aqi * 0.12, 1)
        pm10 = zone_reading["pm10"] if zone_reading else round(aqi * 0.25, 1)
        env = self._get_environmental_data(zone_id, aqi)
        attribution = get_source_attribution(zone_id)
        top_sources = ", ".join(f"{s['source']} ({s['percentage']}%)" for s in attribution["sources"])

        if settings.USE_MOCK_DATA:
            return self._mock_health_advice(age, has_asthma, has_heart_condition, activity_level, aqi, category, outdoor_hours)

        prompt = f"""You are a public health advisor for air pollution. Analyze the health risk for the following individual under these environmental conditions:
Person Profile:
- Age: {age}
- Asthma: {has_asthma}
- Heart Condition: {has_heart_condition}
- Typical Activity Level: {activity_level}
- Planned Outdoor Exposure: {outdoor_hours} hours today

Environmental Conditions:
- Zone: {zone['zone_name']} (ID: {zone_id})
- Current AQI: {aqi} ({category})
- PM2.5: {pm25} µg/m³
- PM10: {pm10} µg/m³
- Weather: {env['weather']}
- Wind Speed: {env['wind_speed']}
- Humidity: {env['humidity']}
- Traffic Level: {env['traffic']}
- Primary Pollution Sources: {top_sources}

Provide personalized, dynamic health advice as JSON matching this exact structure:
{{
    "risk_level": "Low / Moderate / High / Very High / Critical",
    "recommendations": [
        "Recommendation 1 (specific citizen advice for their medical condition)",
        "Recommendation 2 ...",
        "Recommendation 3 ..."
    ],
    "safe_outdoor_hours": "Specific outdoor time advice (e.g. 'Under 1 hour during afternoon', 'Avoid outdoor activity')",
    "mask_recommendation": "Specific mask recommendation (e.g. 'N95 respirator required', 'No mask needed')",
    "ai_summary": "Root Cause Analysis: [How the environmental factors and sources impact this specific individual]. Reasoning: [Medical reasoning for the risk level and recommendations]. Confidence Explanation: [Explanation of confidence in this medical advice]."
}}
Respond ONLY with valid JSON. Do not include markdown code block syntax (like ```json)."""

        ai_response = await self._generate(prompt)
        if not ai_response:
            raise ValueError("No response generated from Gemini API for health advice.")

        try:
            import json
            import re

            json_match = re.search(r"\{.*\}", ai_response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                raise ValueError("Could not extract JSON block from Gemini response.")
        except Exception as e:
            if not settings.USE_MOCK_DATA:
                raise ValueError(f"Failed to parse JSON response from Gemini API: {e}. Raw response: {ai_response}") from e
            return self._mock_health_advice(age, has_asthma, has_heart_condition, activity_level, aqi, category, outdoor_hours)

    def _mock_health_advice(
        self, age, has_asthma, has_heart_condition, activity_level, aqi, category, outdoor_hours
    ) -> dict:
        risk_score = 0
        if aqi > 150:
            risk_score += 2
        elif aqi > 100:
            risk_score += 1
        if has_asthma:
            risk_score += 2
        if has_heart_condition:
            risk_score += 2
        if age > 65 or age < 12:
            risk_score += 1
        if activity_level == "high":
            risk_score += 1

        risk_levels = {0: "Low", 1: "Low", 2: "Moderate", 3: "High", 4: "Very High", 5: "Critical"}
        risk = risk_levels.get(min(risk_score, 5), "Critical")

        recs = []
        if aqi > 100:
            recs.append("Limit strenuous outdoor activities, especially during morning and evening peaks.")
        if has_asthma:
            recs.append("Keep rescue inhaler accessible; consider pre-medication before any outdoor exposure.")
        if has_heart_condition:
            recs.append("Monitor heart rate during outdoor activity; seek medical attention if experiencing chest discomfort.")
        if outdoor_hours > 2 and aqi > 150:
            recs.append(f"Reduce outdoor time from {outdoor_hours}h to under 1 hour today.")
        recs.append("Use air purifiers indoors and keep windows closed during peak pollution hours.")
        recs.append("Stay hydrated and consume antioxidant-rich foods to support respiratory health.")

        mask = "N95 or N99 respirator required outdoors" if aqi > 150 else (
            "N95 recommended for sensitive individuals" if aqi > 100 else "No mask needed for healthy adults"
        )

        safe_hours = "Avoid outdoor activity" if aqi > 200 else (
            "6 AM - 9 AM only" if aqi > 150 else "Any time with moderate exertion"
        )

        return {
            "risk_level": risk,
            "recommendations": recs,
            "safe_outdoor_hours": safe_hours,
            "mask_recommendation": mask,
            "ai_summary": (
                f"Based on AQI {aqi} ({category}) and your health profile, your personal risk is {risk}. "
                f"{'Take immediate precautions.' if risk_score >= 3 else 'Standard precautions are sufficient.'}"
            ),
        }

    async def what_if_simulate(self, zone_id: str, interventions: List[str], duration_hours: int) -> dict:
        zone = get_zone_by_id(zone_id) or {"zone_id": zone_id, "zone_name": "Unknown Zone"}
        baseline = ZONE_BASE_AQI.get(zone_id, 150)

        readings = get_current_readings()
        zone_reading = next((r for r in readings if r["zone_id"] == zone_id), None)
        pm25 = zone_reading["pm25"] if zone_reading else round(baseline * 0.12, 1)
        pm10 = zone_reading["pm10"] if zone_reading else round(baseline * 0.25, 1)
        env = self._get_environmental_data(zone_id, baseline)
        attribution = get_source_attribution(zone_id)
        top_sources = ", ".join(f"{s['source']} ({s['percentage']}%)" for s in attribution["sources"])

        if settings.USE_MOCK_DATA:
            return self._mock_what_if_simulate(zone, baseline, interventions, duration_hours)

        prompt = f"""You are an air quality data scientist and policy simulator. Simulate the impact of applying these specific interventions:
Interventions to Apply: {interventions}
Duration: {duration_hours} hours

Baseline Environmental Conditions:
- Zone: {zone['zone_name']} (ID: {zone_id})
- Baseline AQI: {baseline}
- PM2.5: {pm25} µg/m³
- PM10: {pm10} µg/m³
- Weather: {env['weather']}
- Wind Speed: {env['wind_speed']}
- Humidity: {env['humidity']}
- Traffic Level: {env['traffic']}
- Pollution Sources: {top_sources}

Predict the outcome of this simulation and respond in valid JSON matching this exact structure:
{{
    "projected_aqi": 120.5,
    "aqi_reduction": 29.5,
    "reduction_percentage": 19.7,
    "timeline": [
        {{"hour": 0, "aqi": 150.0}},
        {{"hour": 6, "aqi": 142.0}},
        {{"hour": 12, "aqi": 135.0}},
        {{"hour": 24, "aqi": 120.5}}
    ],
    "impact_summary": "Root Cause & Expected Impact: [Analysis of how the interventions directly address the pollution sources, weather conditions, and traffic]. Reasoning: [Scientific reasoning behind the simulated AQI reduction and timeline]. Confidence Explanation: [Explanation of confidence in this simulation]. Citizen Advice: [Advice for citizens during these interventions]."
}}
Respond ONLY with valid JSON. Do not include markdown code block syntax (like ```json)."""

        ai_response = await self._generate(prompt)
        if not ai_response:
            raise ValueError("No response generated from Gemini API for simulation.")

        try:
            import json
            import re

            json_match = re.search(r"\{.*\}", ai_response, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                
                # Normalize data types
                timeline = []
                for point in data.get("timeline", []):
                    timeline.append({
                        "hour": int(point.get("hour", 0)),
                        "aqi": float(point.get("aqi", baseline))
                    })
                
                return {
                    "zone_id": zone["zone_id"],
                    "zone_name": zone["zone_name"],
                    "baseline_aqi": baseline,
                    "projected_aqi": float(data.get("projected_aqi", baseline)),
                    "aqi_reduction": float(data.get("aqi_reduction", 0.0)),
                    "reduction_percentage": float(data.get("reduction_percentage", 0.0)),
                    "timeline": timeline,
                    "impact_summary": data.get("impact_summary", "Simulated intervention impact."),
                }
            else:
                raise ValueError("Could not extract JSON block from Gemini response.")
        except Exception as e:
            if not settings.USE_MOCK_DATA:
                raise ValueError(f"Failed to parse JSON response from Gemini API: {e}. Raw response: {ai_response}") from e
            return self._mock_what_if_simulate(zone, baseline, interventions, duration_hours)

    def _mock_what_if_simulate(self, zone: dict, baseline: float, interventions: List[str], duration_hours: int) -> dict:
        reduction_map = {
            "odd-even": 22, "construction-ban": 18, "dust-suppression": 12,
            "industrial-audit": 15, "public-transport": 10, "green-buffers": 8,
            "biomass-control": 14, "work-from-home": 9,
        }

        total_reduction = 0.0
        for intervention in interventions:
            key = intervention.lower().replace(" ", "-").replace("_", "-")
            for map_key, reduction in reduction_map.items():
                if map_key in key or key in map_key:
                    total_reduction += reduction * 0.7  # Diminishing returns
                    break

        total_reduction = min(total_reduction, baseline * 0.6)
        projected = max(baseline - total_reduction, 25)

        timeline = []
        for h in range(0, duration_hours + 1, max(duration_hours // 6, 1)):
            progress = min(h / max(duration_hours * 0.7, 1), 1.0)
            aqi_at_h = round(baseline - total_reduction * progress, 1)
            timeline.append({"hour": h, "aqi": aqi_at_h})

        summary = (
            f"Applying {len(interventions)} intervention(s) in {zone['zone_name']} over {duration_hours} hours "
            f"is projected to reduce AQI from {baseline} to {projected:.0f} "
            f"({total_reduction / baseline * 100:.0f}% reduction). "
            f"Peak benefits expected within {min(duration_hours, 48)} hours."
        )

        return {
            "zone_id": zone["zone_id"],
            "zone_name": zone["zone_name"],
            "baseline_aqi": baseline,
            "projected_aqi": round(projected, 1),
            "aqi_reduction": round(total_reduction, 1),
            "reduction_percentage": round(total_reduction / baseline * 100, 1),
            "timeline": timeline,
            "impact_summary": summary,
        }

    async def generate_report_content(self, zone_id: str, report_type: str = "comprehensive") -> dict:
        zone = get_zone_by_id(zone_id) or {"zone_id": zone_id, "zone_name": "City Overview"}
        readings = get_current_readings()
        zone_reading = next((r for r in readings if r["zone_id"] == zone_id), readings[0])
        aqi = zone_reading["aqi"]
        pm25 = zone_reading["pm25"]
        pm10 = zone_reading["pm10"]

        env = self._get_environmental_data(zone_id, aqi)
        attribution = get_source_attribution(zone_id)
        top_sources = ", ".join(f"{s['source']} ({s['percentage']}%)" for s in attribution["sources"])

        if settings.USE_MOCK_DATA:
            return {
                "recommendations": [
                    "1. Implement odd-even vehicle rationing if AQI exceeds 200 for 24 consecutive hours.",
                    "2. Deploy water sprinklers on arterial roads during early morning hours.",
                    "3. Conduct targeted industrial emission audits in high-contribution zones.",
                    "4. Increase public transport capacity by 30% on high-pollution days.",
                    "5. Issue health advisories for vulnerable populations when AQI > 150."
                ],
                "ai_summary": f"This is a mocked comprehensive report summary for {zone['zone_name']}."
            }

        prompt = f"""You are a senior environmental health and policy analyst generating an official air quality report.
Zone Name: {zone['zone_name']} (ID: {zone_id})
Report Type: {report_type}
Current AQI: {aqi} ({get_aqi_category(aqi)})
PM2.5: {pm25} µg/m³
PM10: {pm10} µg/m³
Weather: {env['weather']}
Wind Speed: {env['wind_speed']}
Humidity: {env['humidity']}
Traffic Level: {env['traffic']}
Primary Pollution Sources: {top_sources}

Based on these details, generate the following report sections:
1. Root Cause Analysis (based on the environmental readings and primary pollution sources)
2. 5 specific, actionable recommended government actions (with thresholds/numbers)
3. Expected impact, reasoning, and citizen advice for each action

Your response must be in valid JSON matching this exact structure:
{{
    "recommendations": [
        "Recommendation 1 (specific, actionable, including threshold/numbers)",
        "Recommendation 2 ...",
        "Recommendation 3 ...",
        "Recommendation 4 ...",
        "Recommendation 5 ..."
    ],
    "ai_summary": "Root Cause Analysis: [Your detailed root cause analysis based on weather, wind speed, humidity, traffic, and pollution sources]. Reasoning: [Scientific reasoning for recommendations]. Citizen Advice: [How public should respond]."
}}
Respond ONLY with valid JSON. Do not include markdown code block syntax (like ```json)."""

        ai_response = await self._generate(prompt)
        if not ai_response:
            raise ValueError("No response generated from Gemini API for report content.")

        try:
            import json
            import re

            json_match = re.search(r"\{.*\}", ai_response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                raise ValueError("Could not extract JSON block from Gemini response.")
        except Exception as e:
            if not settings.USE_MOCK_DATA:
                raise ValueError(f"Failed to parse JSON response from Gemini API for report: {e}. Raw response: {ai_response}") from e
            return {
                "recommendations": [
                    "1. Implement odd-even vehicle rationing if AQI exceeds 200 for 24 consecutive hours.",
                    "2. Deploy water sprinklers on arterial roads during early morning hours."
                ],
                "ai_summary": "Report fallback summary."
            }


ai_service = AIService()
