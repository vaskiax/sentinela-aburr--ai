# Sentinela Aburrá AI

**Sentinela Aburrá AI** is a specialized ML Ops platform designed to monitor, analyze, and predict criminal dynamics in the Valle de Aburrá region (Medellín, Colombia). It combines intelligent web scraping, Large Language Models (LLMs), and deterministic risk modeling to provide actionable intelligence on security threats.

## 🏗️ System Architecture

The system operates on a linear pipeline: **Configuration -> Scraping -> Cleaning -> Analysis -> Prediction -> Visualization**.

### Tech Stack
- **Frontend**: React, Vite, TailwindCSS, Recharts, D3.js.
- **Backend**: FastAPI (Python), Pydantic.
- **AI/NLP**: 
    - **Perplexity API**: For deep web search and article discovery.
    - **DeepSeek V3**: For entity extraction, relevance scoring, and query generation.
- **Data Processing**: BeautifulSoup4, Requests.

---

## 🚀 Pipeline & Modules Explained

### 1. Intelligent Scraping (`backend/scraper.py`)
This module is responsible for gathering raw intelligence from the web. It does NOT simply crawl random pages; it uses an AI-driven targeted approach.

**Step-by-Step Process:**
1.  **Query Generation**: The system sends the user's configuration (Target Orgs, Crimes, Events) to the LLM (`nlp.py`). The LLM generates ~50 optimized search queries (e.g., *"Captura cabecilla Clan del Golfo Medellín 2024"*).
2.  **Discovery**: These queries are sent to the **Perplexity API**, which searches the open web and returns a list of relevant URLs from news sources like *Minuto30*, *El Colombiano*, and *Q'Hubo*.
3.  **Fetching**: The scraper visits each URL.
    *   **Safety Check**: It enforces a **5MB limit** on downloads to prevent hanging on large files (like government CSVs).
4.  **Extraction**: The HTML content is parsed. The system extracts the Headline, Body, and Date.
5.  **AI Scoring**: The content is sent to the LLM to calculate a **Relevance Score (0-1)** based on how well it matches the user's criteria.

### 2. Data Cleaning & Filtering (`backend/scraper.py` & `backend/nlp.py`)
Before data reaches the predictor, it undergoes rigorous cleaning to ensure quality.

**Cleaning Logic:**
-   **Relevance Filter**: Any article with a relevance score **< 0.15** is immediately discarded. This removes noise (e.g., traffic accidents, unrelated petty crime).
-   **Date Normalization**: The NLP engine extracts the publication date from HTML metadata or text. If a date cannot be found, it is estimated from context or flagged.
-   **Deduplication**: Duplicate URLs or identical headlines are removed.

### 3. Predictive Engine (`backend/predictor.py`)
This is the core intelligence module. It now implements a **Multi-Model Supervised Learning** pipeline using `scikit-learn`.

**How it works:**
1.  **Ingestion**: Receives the list of cleaned, high-relevance `ScrapedItems`.
2.  **Data Enrichment**: Uses structured metadata extracted by the NLP module (Crime Type, Organization, Locations) as training labels.
3.  **Real-Time Training**:
    -   **Vectorization**: Converts text (Headline + Snippet) to TF-IDF vectors.
    -   **Split**: Performs an 80/20 Train/Test split.
    -   **Multi-Model Competition**: Trains three distinct classifiers simultaneously:
        -   🌲 **Random Forest**: Robust against overfitting.
        -   bayes **Naive Bayes**: Excellent for text classification.
        -   📈 **Logistic Regression**: Provides a solid linear baseline.
    -   **Selection**: Automatically selects the model with the highest **F1-Score** on the test set.
4.  **Risk Calculation**:
    -   Uses the winning model to predict risk categories for all items.
    -   Combines model predictions with volume and keyword density to generate the final **Risk Index**.
4.  **Timeline Generation**:
    -   Aggregates the risk scores by the **actual publication dates** of the articles.
    -   This creates the time-series chart showing the evolution of the threat over the selected date range.

### 4. NLP Processor (`backend/nlp.py`)
The "Brain" of the operation. It handles all communication with the LLMs.
-   **`build_search_queries`**: Translates config into search operator strings.
-   **`extract_article_data`**: Reads raw HTML (up to 15,000 chars) and returns structured JSON (Headline, Date, Snippet, Relevance).
-   **`web_search`**: Interfaces with Perplexity to find URLs.

---

## 📊 Dashboard Indicators

### Violence Risk Index
A composite score indicating the stability of the region.
-   🟢 **0 - 30 (Low)**: Routine police activity. Stable.
-   🟠 **31 - 70 (Elevated)**: Increased gang movement, specific threats detected.
-   🔴 **71 - 100 (Critical)**: High probability of violent confrontation or major criminal events.

### Spatial Risk Map
Visualizes the **Zone Extraction** data.
-   Zones are colored based on their specific risk contribution.
-   **Red**: Critical activity detected (>70).
-   **Orange**: Elevated activity (>30).
-   **Blue**: Low/Routine activity (>10).

---

## 🛠️ Configuration & Environment

### Environment Variables (`.env`)
Required keys for the backend:
```bash
DEEPSEEK_API_KEY=sk-...      # For NLP extraction and scoring
PERPLEXITY_API_KEY=pplx-...  # For web search and discovery
```

### Installation
1.  **Backend**:
    ```bash
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload
    ```
2.  **Frontend**:
    ```bash
    npm install
    npm run dev
    ```
