import React, { useState } from 'react';
import { Shield, BookOpen, Activity, AlertTriangle, Database, Cpu, Layers, History, ChevronDown, Lightbulb, TrendingUp, Users, Settings, HelpCircle, Code } from 'lucide-react';

const DocSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="mb-6 border border-slate-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-950 rounded border border-slate-700 text-blue-400">
            {icon}
          </div>
          <h2 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">{title}</h2>
        </div>
        <ChevronDown size={16} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-slate-950 text-slate-400 text-sm leading-relaxed space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

const Documentation = () => {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 shadow-2xl h-full overflow-y-auto custom-scrollbar">
      <div className="mb-10 pb-6 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-white mb-2">Sentinela Aburrá — Technical Operations Guide</h1>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">v3.1 · Future Risk Forecasting · Auto-Calibrated</p>
        <p className="text-xs text-slate-400 mt-3">Predictive operations assistant: quantifies relative risk from precursor activity (not deterministic crime prediction).</p>
      </div>

      {/* 1. Core Principles */}
      <DocSection title="1. Core Principles" icon={<Lightbulb size={20} />} defaultOpen={true}>
        <div className="space-y-4">
          <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
            <h4 className="text-blue-300 font-bold text-sm mb-2">What we actually predict</h4>
            <p className="text-xs text-blue-200">
              We do <strong>relative risk</strong> forecasting from precursor signals (gang activity, media mentions, leadership disruption, seizures), not point crime prediction. Risk is a comparative probability against the historical worst-case.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900 rounded border border-slate-800">
              <h4 className="text-emerald-400 font-bold text-xs mb-2 uppercase">What we DO</h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• Detect shifts vs. historical patterns</li>
                <li>• Quantify how anomalous today is</li>
                <li>• Benchmark against historical maxima</li>
                <li>• Provide operational decision support</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-900 rounded border border-slate-800">
              <h4 className="text-red-400 font-bold text-xs mb-2 uppercase">What we DO NOT do</h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• Predict exact crimes, dates, or places</li>
                <li>• Guarantee violence will occur</li>
                <li>• Use fixed 100% thresholds</li>
                <li>• Operate without historical context</li>
              </ul>
            </div>
          </div>

          <div className="p-3 bg-slate-800/50 rounded text-center border border-slate-700">
            <span className="text-white font-bold text-sm">100% Risk = Worst Recorded Historical Scenario</span>
          </div>
        </div>
      </DocSection>

      {/* 2. End-to-End Pipeline (5 stages) */}
      <DocSection title="2. End-to-End Pipeline (5 Stages)" icon={<Layers size={20} />} defaultOpen={true}>
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-blue-300 font-bold text-xs mb-2 flex items-center gap-2">Stage 1 — Configuration</h4>
            <p className="text-xs text-slate-400 mb-2">Select forecast horizon (days ahead), aggregation granularity (D/W/M), and historical scope. Defaults favor weekly operational use with 7-day lookback.</p>
            <ul className="text-[11px] text-slate-300 space-y-1 ml-2">
              <li>• Horizon: 7/14/30/90 days (shorter = more reactive, longer = more stable)</li>
              <li>• Granularity: Daily for sensitivity, Weekly for stability, Monthly for trend</li>
              <li>• Historical window: 90–365 days; more data helps calibration if quality is good</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-purple-300 font-bold text-xs mb-2 flex items-center gap-2">Stage 2 — Scraping / Data Ingest</h4>
            <p className="text-xs text-slate-400 mb-2">Upload CSV with historical events (TRIGGER_EVENT, CRIME_STAT). Backend validates schema and keeps data in-memory for rapid iteration.</p>
            <code className="block bg-slate-950 p-2 rounded text-[9px] font-mono text-slate-300 mb-1 overflow-x-auto">
              Date, Source, Type, Headline, Relevance, URL
            </code>
            <p className="text-[11px] text-slate-300 mt-2">Types: <strong>TRIGGER_EVENT</strong> (captures, seizures, leadership hits) and <strong>CRIME_STAT</strong> (homicides, robberies).</p>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-yellow-300 font-bold text-xs mb-2 flex items-center gap-2">Stage 3 — Data Preview & QA</h4>
            <p className="text-xs text-slate-400 mb-2">Quick validation: row counts, required columns, basic cleaning stats. Ensures the dataset is aligned before training.</p>
            <ul className="text-[11px] text-slate-300 space-y-1 ml-2">
              <li>• Required columns: Date (YYYY-MM-DD), Type, Headline, Relevance</li>
              <li>• Optional enrichments: Source, URL, zone/commune if available</li>
              <li>• Cleaning report: duplicates removed, valid/invalid rows</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-orange-300 font-bold text-xs mb-2 flex items-center gap-2">Stage 4 — Training</h4>
            <p className="text-xs text-slate-400 mb-2">Feature engineering with rolling windows; models trained and scored; best model persisted with metadata (granularity, horizon, RMSE, model name).</p>
            <ul className="text-[11px] text-slate-300 space-y-1 ml-2">
              <li>• Models: RandomForest, XGBoost, LightGBM (select lowest RMSE)</li>
              <li>• Features: trigger volume, relevance sums, velocity/recency, zone activity</li>
              <li>• Calibration: max_observed_crimes, max_observed_zone_activity for scaling</li>
              <li>• Outputs stored: PredictionResult + ModelMetadata → sentinela_model_metadata.json</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-green-300 font-bold text-xs mb-2 flex items-center gap-2">Stage 5 — Dashboard & Inference</h4>
            <p className="text-xs text-slate-400 mb-2">Dashboard auto-loads latest persisted result. Inference updates live forecasts but preserves the last trained Model Configuration.</p>
            <ul className="text-[11px] text-slate-300 space-y-1 ml-2">
              <li>• Current Threat Assessment: live forecast (risk score, volume, hotspots)</li>
              <li>• Recent Model Configuration: persistent metadata (granularity, horizon, model, RMSE)</li>
              <li>• Inference controls: manual what-if runs without overwriting model metadata</li>
            </ul>
          </div>
        </div>
      </DocSection>

      {/* 3. Risk Model & Semaphores */}
      <DocSection title="3. Risk Model & Semaphores" icon={<Activity size={20} />} defaultOpen={true}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900 rounded border border-slate-800">
              <h4 className="text-blue-400 font-bold text-xs mb-2 uppercase">Model Risk (Volume)</h4>
              <code className="block bg-slate-950 p-2 rounded text-[9px] font-mono text-slate-300 mb-2">
                (predicted_volume / max_observed_crimes) * 100
              </code>
              <p className="text-xs text-slate-400">Benchmarks forecasted volume against historical maximum. If max=100 and prediction=50, model risk=50%.</p>
            </div>

            <div className="p-4 bg-slate-900 rounded border border-slate-800">
              <h4 className="text-purple-400 font-bold text-xs mb-2 uppercase">Zone Risk (Activity)</h4>
              <code className="block bg-slate-950 p-2 rounded text-[9px] font-mono text-slate-300 mb-2">
                (current_zone_mentions / max_observed_zone_activity) * 100
              </code>
              <p className="text-xs text-slate-400">Captures local hotspot pressure. If max zone activity=30 and current=15, zone risk=50%.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-800/50 rounded border border-slate-700">
            <h4 className="text-white font-bold text-sm mb-2">Global Risk Formula</h4>
            <code className="block bg-slate-950 p-3 rounded text-xs font-mono text-slate-300 text-center">
              Global Risk = 0.70 × Model Risk + 0.30 × Zone Risk
            </code>
            <p className="text-xs text-slate-400 mt-2">70% weight on aggregated volume forecast, 30% on localized hotspot activity. Tunable per operational policy.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div className="p-3 bg-emerald-900/30 rounded border border-emerald-700 text-center"><p className="font-bold text-emerald-300">0-20%</p><p className="text-emerald-200 text-xs">GREEN</p></div>
            <div className="p-3 bg-cyan-900/30 rounded border border-cyan-700 text-center"><p className="font-bold text-cyan-300">21-40%</p><p className="text-cyan-200 text-xs">BLUE</p></div>
            <div className="p-3 bg-yellow-900/30 rounded border border-yellow-700 text-center"><p className="font-bold text-yellow-300">41-60%</p><p className="text-yellow-200 text-xs">YELLOW</p></div>
            <div className="p-3 bg-orange-900/30 rounded border border-orange-700 text-center"><p className="font-bold text-orange-300">61-80%</p><p className="text-orange-200 text-xs">ORANGE</p></div>
            <div className="p-3 bg-red-900/30 rounded border border-red-700 text-center"><p className="font-bold text-red-300">81-100%</p><p className="text-red-200 text-xs">RED</p></div>
          </div>
        </div>
      </DocSection>

      {/* 4. Operational Guide */}
      <DocSection title="4. Operational Guide" icon={<Users size={20} />} defaultOpen={true}>
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-white font-bold text-xs mb-3 flex items-center gap-2"><Settings size={14}/> Configure</h4>
            <div className="text-xs text-slate-300 space-y-2">
              <p><strong>Forecast Horizon:</strong> 7/14/30/90 days. 7 for operations; 30+ for strategic planning.</p>
              <p><strong>Granularity:</strong> D (sensitive), W (balanced), M (trend). Impacts volatility.</p>
              <p><strong>Historical Scope:</strong> 90–365 days. More data helps if clean; noisy history hurts calibration.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-white font-bold text-xs mb-3 flex items-center gap-2"><Database size={14}/> Prepare Data</h4>
            <div className="text-xs text-slate-300 space-y-2">
              <p><strong>CSV schema (required):</strong></p>
              <code className="block bg-slate-950 p-2 rounded text-[8px] font-mono text-slate-200 overflow-x-auto">
                Date,Source,Type,Headline,Relevance,URL<br/>
                2025-01-15,Perplexity,TRIGGER_EVENT,Capture Urabenos in Manrique,0.9,https://...<br/>
                2025-01-16,News,CRIME_STAT,Homicides barrio Obrero,0.85,https://...
              </code>
              <p className="text-xs">Types: TRIGGER_EVENT or CRIME_STAT. Relevance 0.0–1.0.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-white font-bold text-xs mb-3 flex items-center gap-2"><TrendingUp size={14}/> Interpret Results</h4>
            <div className="text-xs text-slate-300 space-y-2">
              <p><strong>Forecast Panel (red):</strong> Live prediction vs. historical max. 75% = three quarters of worst observed scenario.</p>
              <p><strong>Audit Trail:</strong> Transparent calculation breakdown; shows how risk was derived.</p>
              <p><strong>Validation (Training view):</strong> RMSE, dataset size, model choice. Past performance only; not shown on Dashboard KPIs.</p>
              <p><strong>Zone Breakdown:</strong> Top neighborhoods driving the risk; use for resource allocation.</p>
            </div>
          </div>

          <div className="p-4 bg-amber-900/20 border border-amber-800/50 rounded-lg">
            <h4 className="text-amber-300 font-bold text-xs mb-2 flex items-center gap-2"><AlertTriangle size={14}/> Operational Warnings</h4>
            <ul className="text-xs text-amber-200 space-y-1">
              <li><strong>Data Scarcity:</strong> Short history → weak signal; banner will warn.</li>
              <li><strong>Scale Mismatch:</strong> If new data does not align with historical calibration, fallback uses last good model.</li>
              <li><strong>Outliers:</strong> Abrupt jumps (0→100%) may be real or data errors. Review manually.</li>
            </ul>
          </div>
        </div>
      </DocSection>

      {/* 5. FAQ & Troubleshooting */}
      <DocSection title="5. FAQ & Troubleshooting" icon={<HelpCircle size={20} />} defaultOpen={false}>
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-blue-300 font-bold text-xs mb-2">Why did risk jump from 30% to 75%?</h4>
            <p className="text-xs text-slate-300">Likely surge in triggers or high-impact events. Check zone breakdown and timeline. If genuine, treat as alert; if not, review data quality (duplicates, timestamps, inflated relevance).</p>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-blue-300 font-bold text-xs mb-2">What does 150% risk mean?</h4>
            <p className="text-xs text-slate-300">Forecast exceeded historical max. Interpreted as worse than any observed scenario. Investigate immediately—could be data error or a truly exceptional event.</p>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-blue-300 font-bold text-xs mb-2">How to read RMSE?</h4>
            <p className="text-xs text-slate-300">Root Mean Squared Error in event units. RMSE=2.5 means average error ~2-3 events. Lower is better. Pair with R² for explained variance.</p>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-blue-300 font-bold text-xs mb-2">Why "data_source: training_fallback"?</h4>
            <p className="text-xs text-slate-300">New data did not align with historical scale. System served last good trained model. Orange banner indicates fallback. Re-run with cleaner or longer history.</p>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-blue-300 font-bold text-xs mb-2">Can I use 10-year history?</h4>
            <p className="text-xs text-slate-300">Possible but risky: gangs, context, and measurement change. Best: 12–18 months of relevant, clean data. More is not better if obsolete/noisy.</p>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-blue-300 font-bold text-xs mb-2">Why not predict specific crimes?</h4>
            <p className="text-xs text-slate-300">Discrete crimes are unpredictable. We forecast elevated risk from precursor patterns to guide resource allocation, not exact events.</p>
          </div>
        </div>
      </DocSection>

      {/* 6. Technical Architecture */}
      <DocSection title="6. Technical Architecture" icon={<Code size={20} />} defaultOpen={false}>
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-green-300 font-bold text-xs mb-3">Stack</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
              <div>
                <p className="font-bold text-blue-400">Frontend</p>
                <ul className="ml-2 space-y-1">
                  <li>• React 18 + TypeScript + Vite</li>
                  <li>• TailwindCSS, Lucide Icons</li>
                  <li>• Recharts for charts</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-blue-400">Backend</p>
                <ul className="ml-2 space-y-1">
                  <li>• FastAPI (Python)</li>
                  <li>• Scikit-learn, XGBoost, LightGBM</li>
                  <li>• Google Generative AI (Gemini) for NLP</li>
                  <li>• Pandas, NumPy</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-green-300 font-bold text-xs mb-3">Data Flow</h4>
            <div className="text-xs text-slate-300 space-y-2">
              <p>1) Upload CSV → frontend schema validation</p>
              <p>2) POST /config → set horizon/granularity</p>
              <p>3) POST /scrape → simulated ingest → DATA_PREVIEW</p>
              <p>4) POST /train → NLP + features + model selection → TRAINING</p>
              <p>5) GET /result → prediction + risk + metadata → DASHBOARD</p>
              <p>6) GET /options → enums + combos CSV for dropdowns</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-green-300 font-bold text-xs mb-3">Key Folders</h4>
            <div className="text-xs text-slate-300 space-y-1 font-mono">
              <p><strong className="text-blue-400">backend/</strong></p>
              <p className="ml-4">├─ main.py → FastAPI routes</p>
              <p className="ml-4">├─ models.py → Pydantic schemas (PredictionResult, ModelMetadata)</p>
              <p className="ml-4">├─ predictor.py → training/inference + persistence</p>
              <p className="ml-4">├─ nlp.py → Gemini NLP (mock if no key)</p>
              <p className="ml-4">├─ data_loader.py → options from combos_v2.csv</p>
              <p className="ml-4">└─ data/ → combos_v2.csv, sentinela_model_metadata.json</p>
              <p><strong className="text-blue-400">src/</strong></p>
              <p className="ml-4">├─ App.tsx → orchestration & polling</p>
              <p className="ml-4">├─ services/api.ts → single HTTP client</p>
              <p className="ml-4">├─ components/ → pipeline views, dashboard widgets</p>
              <p className="ml-4">└─ services/geminiService.ts → frontend NER only</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-green-300 font-bold text-xs mb-3">Environment</h4>
            <div className="text-xs text-slate-300">
              <p><strong>Backend:</strong> <code className="bg-slate-950 px-2 py-1 rounded">GEMINI_API_KEY</code> enables real NLP; mock otherwise.</p>
              <p><strong>Frontend:</strong> <code className="bg-slate-950 px-2 py-1 rounded">VITE_GEMINI_API_KEY</code> injected by Vite for geminiService.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-green-300 font-bold text-xs mb-3">Deployment Quick Start (Windows)</h4>
            <code className="block bg-slate-950 p-3 rounded text-[8px] font-mono text-slate-300 overflow-x-auto">
              # Backend<br/>
              python -m venv venv; .\venv\Scripts\Activate.ps1<br/>
              pip install -r backend/requirements.txt<br/>
              $env:GEMINI_API_KEY="your_key"<br/>
              uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000<br/>
              <br/>
              # Frontend<br/>
              npm install<br/>
              $env:VITE_GEMINI_API_KEY="your_key"<br/>
              npm run dev
            </code>
          </div>
        </div>
      </DocSection>

      <div className="mt-10 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>Sentinela Aburrá © 2025 | Documentation v3.1 | Last update: {new Date().toLocaleDateString('en-US')}</p>
      </div>
    </div>
  );
};

export default Documentation;
