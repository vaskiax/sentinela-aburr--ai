
# Sentinela Aburrá AI

**Sentinela Aburrá AI** is a specialized ML Ops platform designed to monitor, analyze, and predict criminal dynamics in the Valle de Aburrá region (Medellín, Colombia).

## Key Features

- **Intelligent Scraping**: Targeted extraction of news articles using Google Search Operators and NLP to filter by relevance and date.
- **NLP Analysis**: Uses Gemini 2.5 Flash to extract structured entities (Organizations, Ranks, Aliases) from unstructured text.
- **Violence Risk Index**: A heuristic model that calculates the probability of instability based on the type of event (Capture/Death), the rank of the target, and the organization involved.
- **Predictive Dashboard**: Visualizes risk scores, expected crime types, and affected zones.

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Recharts.
- **Backend**: FastAPI, Python, Pydantic.
- **AI/ML**: Google Gemini API (NLP), Heuristic Risk Engine.

## Run Locally

1. **Backend**:

   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```
2. **Frontend**:

   ```bash
   npm install
   npm run dev
   ```
3. **Environment**:
   Ensure you have a `.env` file with `GEMINI_API_KEY`.
