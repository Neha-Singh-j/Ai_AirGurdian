# AirGuardian AI

**Predict. Plan. Protect.** — An AI-powered urban air pollution intelligence platform that helps city administrators take action before pollution becomes dangerous.

![Architecture](docs/ARCHITECTURE.md)

## Features

- **Real-time Dashboard** — City-wide AQI overview with live zone rankings
- **Interactive Heatmap** — Leaflet/OpenStreetMap pollution heat visualization
- **AQI Predictions** — 6, 12, 24, and 72-hour forecasts with confidence scores
- **Source Attribution** — Pollution source breakdown with confidence percentages
- **AI Intervention Planner** — Gemini-powered government action recommendations
- **Citizen Health Assistant** — Personalized health advice based on profile and local AQI
- **What-If Simulator** — Test intervention scenarios before implementation
- **PDF Reports** — AI-generated comprehensive air quality reports
- **Admin Analytics** — City-wide trends, zone performance, category distribution
- **Authentication** — JWT-based auth with admin/analyst/citizen roles
- **Mock APIs** — Full functionality without external API keys

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, Tailwind CSS, Leaflet, Recharts, Framer Motion |
| Backend | FastAPI, SQLAlchemy, Pydantic, ReportLab |
| AI | LangChain, Google Gemini API, FAISS Vector Database |
| Database | PostgreSQL |
| DevOps | Docker, Docker Compose, Nginx |

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Local Development

**Prerequisites:** Node.js 20+, Python 3.12+ (PostgreSQL is NOT required; SQLite is used by default)

```bash
# Backend setup
cd backend
python -m venv venv

# Activate virtual environment
# Windows (CMD):
venv\Scripts\activate
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Create environment configuration
# Windows:
copy .env.example .env
# macOS/Linux:
cp .env.example .env

# (Optional) Edit .env with your GEMINI_API_KEY if not using mock mode.
# By default, DATABASE_URL points to a local SQLite database file:
# DATABASE_URL=sqlite+aiosqlite:///./data/airguardian.db

# Run backend API
uvicorn app.main:app --reload --port 8000

# Frontend setup (in a new terminal window)
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://airguardian:airguardian@localhost:5432/airguardian` |
| `SECRET_KEY` | JWT signing key | (change in production) |
| `GEMINI_API_KEY` | Google Gemini API key (optional) | — |
| `USE_MOCK_DATA` | Use mock data when APIs unavailable | `true` |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:5173` |

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@airguardian.gov` | `admin123` |
| Analyst | `analyst@airguardian.gov` | `analyst123` |
| Citizen | `citizen@example.com` | `citizen123` |

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` — Register new user
- `POST /api/v1/auth/login` — Login (returns JWT)
- `GET /api/v1/auth/me` — Current user profile

### Pollution Data
- `GET /api/v1/pollution/zones` — List monitoring zones
- `GET /api/v1/pollution/readings` — Current AQI readings
- `GET /api/v1/pollution/heatmap` — Heatmap data points
- `GET /api/v1/pollution/predictions/{zone_id}` — AQI forecasts
- `GET /api/v1/pollution/attribution/{zone_id}` — Source attribution

### AI Features
- `POST /api/v1/ai/interventions` — Generate intervention plan
- `POST /api/v1/ai/health-advice` — Personalized health advice
- `POST /api/v1/ai/what-if` — Run intervention simulation
- `POST /api/v1/ai/reports` — Generate PDF report
- `GET /api/v1/ai/reports/{id}/download` — Download report

### Analytics
- `GET /api/v1/analytics/dashboard` — Admin analytics (admin/analyst only)

## Project Structure

```
AirGuardian-AI/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # API endpoint handlers
│   │   ├── core/             # Config, database, security
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Business logic & AI services
│   │   └── main.py           # FastAPI application entry
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route page components
│   │   ├── services/         # API client
│   │   ├── context/          # React context (auth)
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/            # Helper functions
│   ├── package.json
│   └── Dockerfile
├── docs/
│   └── ARCHITECTURE.md       # System architecture diagram
├── docker-compose.yml
└── README.md
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system architecture diagram and component details.

## AI Integration

The platform uses **LangChain** with **Google Gemini** for intelligent features:

1. **Intervention Planner** — RAG over policy documents stored in FAISS vector database
2. **Health Assistant** — Personalized advice based on health profile and local AQI
3. **What-If Simulator** — Impact analysis with AI-generated summaries

When `GEMINI_API_KEY` is not set, the system automatically falls back to high-quality mock responses, ensuring full demo functionality.

## License

MIT License — Built for EtAi Hackathon 2026
