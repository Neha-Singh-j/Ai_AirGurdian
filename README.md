# AirGuardian AI

**Predict. Plan. Protect.**

AirGuardian is an AI-based air pollution monitoring system that helps users understand air quality in different areas. It displays AQI data on a dashboard and map, provides basic AQI predictions, and uses AI to provide suggestions for controlling pollution and staying safe.

## Features

- **AQI Dashboard** — Shows current AQI and pollution levels of different areas.
- **Pollution Map** — Displays pollution levels of different locations on a map.
- **AQI Prediction** — Provides AQI predictions for the upcoming hours.
- **Pollution Sources** — Shows the major factors affecting air quality.
- **AI Suggestions** — Provides suggestions for reducing pollution.
- **Health Assistant** — Gives basic health advice based on local AQI.
- **Admin Dashboard** — Shows pollution trends and area-wise data.
- **User Login** — Supports Admin, Analyst, and Citizen accounts.
- **Mock Data** — The application can run using sample data without external APIs.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, CSS |
| Maps & Charts | Leaflet, Recharts |
| Backend | FastAPI, Python |
| Database | SQLite / PostgreSQL |
| AI | Google Gemini |
| Reports | ReportLab |
| Authentication | JWT |

## Quick Start

### Backend

```bash
cd backend

python -m venv venv
```

Activate the virtual environment:

**Windows:**
```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend will run at:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at:

```text
http://localhost:5173
```

## Environment Variables

Create a `.env` file in the backend:

```env
DATABASE_URL=sqlite+aiosqlite:///./data/airguardian.db
SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
USE_MOCK_DATA=true
CORS_ORIGINS=http://localhost:5173
```

`GEMINI_API_KEY` is optional when using mock data.

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@airguardian.gov` | `admin123` |
| Analyst | `analyst@airguardian.gov` | `analyst123` |
| Citizen | `citizen@example.com` | `citizen123` |

## Main API Endpoints

### Authentication

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

### Pollution Data

```text
GET /api/v1/pollution/zones
GET /api/v1/pollution/readings
GET /api/v1/pollution/heatmap
GET /api/v1/pollution/predictions/{zone_id}
```

### AI Features

```text
POST /api/v1/ai/interventions
POST /api/v1/ai/health-advice
POST /api/v1/ai/reports
```

### Dashboard

```text
GET /api/v1/analytics/dashboard
```

## Project Structure

```text
AirGuardian-AI/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── services/
│   │   └── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── context/
│   └── package.json
│
├── docs/
├── docker-compose.yml
└── README.md
```

## AI Integration

Google Gemini is used for AI-based features such as:

1. **Pollution Suggestions** — Provides possible actions to reduce pollution.
2. **Health Assistant** — Provides basic safety advice according to AQI.
3. **Report Generation** — Helps create understandable air-quality reports.

The application also supports **mock responses**, so the main features can be demonstrated without an external AI API.

## Project Highlights

- Built a full-stack air-quality monitoring application.
- Created interactive AQI dashboards and pollution maps.
- Added AI-based suggestions using Google Gemini.
- Implemented user authentication with different roles.
- Added mock data to make the application easy to demonstrate.

## Certification

Built for **ET AI Hackathon 2026**.
[Detailed Docs](https://drive.google.com/file/d/1k7oTHTRz3ta5MQ4inSocF71rJDqPwOyS/view?usp=sharing)

[Project Appreciation Certificate](https://drive.google.com/file/d/16DlfB_gS0LcTHne4G8FBp_I39E-pihnD/view?usp=sharing)

**Created by Neha Singh And Its Team**
