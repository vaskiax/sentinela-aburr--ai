import React, { useState } from 'react';
import { ShieldAlert, Layout, Code, Play, RefreshCw, ChevronRight, Activity, Target, BookOpen, Database } from 'lucide-react';
import PipelineStatus from './components/PipelineStatus';
import ProjectArchitecture from './components/ProjectArchitecture';
import PipelineConfig from './components/PipelineConfig';
import DataPreview from './components/DataPreview';
import Documentation from './components/Documentation';
import AburraMap from './components/AburraMap';
import ModelMetrics from './components/ModelMetrics';
import CleaningReport from './components/CleaningReport';
import TrainingInsights from './components/TrainingInsights';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar } from 'recharts';
import { PredictionResult, ProcessingLog, ScrapingConfig, PipelineStage, ScrapedItem, CleaningStats } from './types';
import { MOCK_LOGS, PROJECT_STRUCTURE, MASTER_PREDICTOR_EVENTS, MASTER_PREDICTOR_RANKS, MASTER_TARGET_CRIMES } from './constants';
import { api } from './services/api';
import { useEffect } from 'react';

function App() {
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'ARCHITECTURE' | 'DOCS'>('DASHBOARD');
  const [pipelineStep, setPipelineStep] = useState<PipelineStage>('DASHBOARD');

  const [scrapingConfig, setScrapingConfig] = useState<ScrapingConfig>({
    target_organizations: [],
    local_combos: [],
    predictor_events: [],
    predictor_ranks: [],
    target_crimes: [],
    date_range_start: '2023-01-01'
  });
  const [scrapedData, setScrapedData] = useState<ScrapedItem[]>([]);
  const [logs, setLogs] = useState<ProcessingLog[]>(MOCK_LOGS as ProcessingLog[]);

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [scrapeStats, setScrapeStats] = useState<CleaningStats | undefined>(undefined);

  // Polling for status updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await api.getStatus();
        setLogs(status.logs);

        // Only update stage from backend if we're in a processing state
        // Don't override user navigation (DASHBOARD, CONFIGURATION)
        const processingStages: PipelineStage[] = ['SCRAPING', 'TRAINING', 'DATA_PREVIEW'];
        const isProcessing = processingStages.includes(pipelineStep);

        if (isProcessing && status.stage !== pipelineStep) {
          setPipelineStep(status.stage);
        }

        if (status.stage === 'DATA_PREVIEW' && scrapedData.length === 0) {
          const data = await api.getData();
          setScrapedData(data);
          try {
            const stats = await api.getScrapeStats();
            setScrapeStats(stats);
          } catch { }
        }
        if (status.stage === 'DASHBOARD' && !result) {
          const res = await api.getResult();
          setResult(res);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [scrapedData.length, result, pipelineStep]);

  const handleStartNewAnalysis = async () => {
    console.log('[Frontend] Starting new analysis, resetting state...');
    setPipelineStep('CONFIGURATION');
    setLogs([]);
    setResult(null);
    setScrapedData([]);
    setScrapeStats(undefined);
    // Prefill minimal defaults so the Start button is enabled
    const initialConfig = {
      target_organizations: [],
      local_combos: [],
      predictor_events: [MASTER_PREDICTOR_EVENTS[0]].filter(Boolean),
      predictor_ranks: [MASTER_PREDICTOR_RANKS[0]].filter(Boolean),
      target_crimes: [MASTER_TARGET_CRIMES[0]].filter(Boolean),
      date_range_start: '2023-01-01'
    };
    setScrapingConfig(initialConfig);
    console.log('[Frontend] New analysis initialized with defaults');
  };

  const handleStartScraping = async () => {
    try {
      // CRITICAL: Capture and send current config IMMEDIATELY before scraping
      // Don't rely on previous setConfig calls - user may have changed selections
      const currentConfig = { ...scrapingConfig };

      console.log('[Frontend] ===== CONFIG BEING SENT TO BACKEND =====');
      console.log('[Frontend] Organizations:', currentConfig.target_organizations);
      console.log('[Frontend] Combos:', currentConfig.local_combos.slice(0, 5));
      console.log('[Frontend] Events:', currentConfig.predictor_events);
      console.log('[Frontend] Ranks:', currentConfig.predictor_ranks);
      console.log('[Frontend] Crimes:', currentConfig.target_crimes);
      console.log('[Frontend] ========================================');

      // Send fresh config to backend
      await api.setConfig(currentConfig);

      setLogs(prev => [...prev, { id: (prev[prev.length - 1]?.id || 0) + 1, timestamp: new Date().toLocaleTimeString(), stage: 'SCRAPING', message: 'Starting scraping…', status: 'success' } as any]);

      // Now start scraping with the fresh config
      await api.startScraping();

      // Optimistically reflect stage change to improve UX
      setPipelineStep('SCRAPING');
    } catch (e) {
      console.error('Failed to start scraping', e);
      setLogs(prev => [...prev, { id: (prev[prev.length - 1]?.id || 0) + 1, timestamp: new Date().toLocaleTimeString(), stage: 'SCRAPING', message: 'Failed to start scraping', status: 'error' } as any]);
    }
  };

  const handleTrainModel = async () => {
    await api.startTraining();
  };

  const downloadReport = () => {
    console.log("Attempting download...");
    if (!result) {
      alert("No results to export yet.");
      return;
    }

    try {
      // 1. Prediction Summary CSV
      const summaryData = [
        ['Metric', 'Value'],
        ['Risk Score', result.risk_score],
        ['Risk Level', result.risk_score > 70 ? 'CRITICAL' : 'ELEVATED'],
        ['Predicted Crime', result.expected_crime_type],
        ['Forecast Duration', `${result.duration_days} days`],
        ['Affected Zones', result.affected_zones.join('; ')]
      ];

      // 2. Zone Risks CSV
      const zoneData = [['Zone', 'Risk Score']];
      (result.zone_risks || []).forEach(z => zoneData.push([z.zone, z.risk.toString()]));

      // 3. Scraped Data CSV
      const evidenceData = [['Date', 'Headline', 'Source', 'Relevance']];
      scrapedData.forEach(item => evidenceData.push([item.date, item.headline, item.source, item.relevance_score.toString()]));

      // Helper to create blob
      const createCSV = (rows: (string | number)[][]) => rows.map(r => r.join(',')).join('\n');

      const csvContent = "--- SUMMARY ---\n" + createCSV(summaryData) +
        "\n\n--- ZONE RISKS ---\n" + createCSV(zoneData) +
        "\n\n--- EVIDENCE LOG ---\n" + createCSV(evidenceData);

      const blob = new Blob([csvContent], { type: 'text/csv' });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sentinela_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a); // Append to body to ensure click works
      a.click();
      document.body.removeChild(a); // Cleanup
      window.URL.revokeObjectURL(url);
      console.log("Download triggered.");
    } catch (e) {
      console.error("Export failed:", e);
      alert("Export failed. Check console.");
    }
  };

  const renderContent = () => {
    if (viewMode === 'ARCHITECTURE') {
      return <ProjectArchitecture files={PROJECT_STRUCTURE} />;
    }
    if (viewMode === 'DOCS') {
      return <Documentation />;
    }

    switch (pipelineStep) {
      case 'CONFIGURATION':
        return <PipelineConfig
          config={scrapingConfig}
          setConfig={setScrapingConfig}
          onStartPipeline={handleStartScraping}
        />;
      case 'SCRAPING':
      case 'TRAINING':
        return (
          <div className="flex flex-col items-center justify-center h-full bg-slate-900/50 rounded-xl border border-slate-800">
            <RefreshCw size={48} className="text-blue-500 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-white animate-pulse">
              {pipelineStep === 'SCRAPING' ? 'DUAL-STREAM SCRAPING (X & Y)...' : 'RETRAINING PREDICTIVE MODEL...'}
            </h3>
            <p className="text-slate-400 font-mono mt-2">Processing large dataset (2010 - Present).</p>
          </div>
        );
      case 'DATA_PREVIEW':
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <CleaningReport stats={scrapeStats} />
            <div className="flex-1 min-h-0">
              <DataPreview data={scrapedData} onProceed={handleTrainModel} />
            </div>
          </div>
        );
      case 'DASHBOARD':
      default:
        return (
          <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">Operational Dashboard</h2>
                <p className="text-xs text-slate-400">Real-time risk assessment based on historical & current intelligence.</p>
              </div>
              <button onClick={downloadReport} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-green-400 text-xs font-bold rounded border border-slate-700 flex items-center gap-2">
                <Database size={14} /> EXPORT DATA
              </button>
              <button onClick={handleStartNewAnalysis} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold rounded border border-slate-700 flex items-center gap-2">
                <RefreshCw size={14} /> NEW ANALYSIS RUN
              </button>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden">
                <p className="text-[10px] text-slate-500 font-mono mb-1 uppercase">Violence Risk Index</p>
                <div className="text-4xl font-bold text-white">{result?.risk_score ?? '--'}</div>
                <div className={`text-xs mt-1 font-bold ${(result?.risk_score ?? 0) > 70 ? 'text-red-500' : 'text-orange-500'}`}>
                  {(result?.risk_score ?? 0) > 70 ? 'CRITICAL LEVEL' : 'ELEVATED LEVEL'}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg col-span-2">
                <p className="text-[10px] text-slate-500 font-mono mb-1 uppercase">Primary Predicted Crime</p>
                <div className="text-2xl font-bold text-white mt-1">{result?.expected_crime_type ?? 'No data'}</div>
                <div className="flex gap-2 mt-2">
                  {result?.affected_zones?.slice(0, 4).map(z => (
                    <span key={z} className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">{z}</span>
                  ))}
                  {(result?.affected_zones?.length ?? 0) > 4 && <span className="text-[10px] px-2 py-0.5 text-slate-500">+{(result?.affected_zones?.length ?? 0) - 4} more</span>}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
                <p className="text-[10px] text-slate-500 font-mono mb-1 uppercase">Forecast Duration</p>
                <div className="text-4xl font-bold text-white">{result?.duration_days ?? '--'} <span className="text-sm font-normal text-slate-500">Days</span></div>
              </div>
            </div>

            {/* Middle Section: Training Metrics & Confusion Matrix */}
            {result?.model_metadata && (
              <TrainingInsights metadata={result.model_metadata} />
            )}
            {result?.training_metrics && (
              <ModelMetrics metrics={result.training_metrics} />
            )}

            {/* Bottom Section: Charts & Map */}
            <div className="grid grid-cols-3 gap-6 min-h-[400px]">
              <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                <h3 className="text-xs font-bold text-slate-400 mb-4">RISK BY ZONE (PREDICTED)</h3>
                <div className="flex-1 h-[300px] w-full">
                  {(!result?.zone_risks || result.zone_risks.length === 0) ? (
                    <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                      No zone risk data available.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.zone_risks} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="zone" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
                        <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                          itemStyle={{ color: '#e2e8f0' }}
                          cursor={{ fill: '#1e293b', opacity: 0.4 }}
                        />
                        <Bar dataKey="risk" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              <div className="col-span-1 h-full">
                <AburraMap affectedZones={result?.affected_zones || []} intensity={result?.risk_score || 0} />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col">
      {/* Navbar */}
      <nav className="h-14 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between">
        <button
          onClick={async () => {
            console.log('[Frontend] Logo clicked - resetting to fresh dashboard');
            // Reset backend first
            try {
              await api.resetPipeline();
            } catch (e) {
              console.error('Error resetting backend:', e);
            }
            // Force complete reset to dashboard
            setViewMode('DASHBOARD');
            setPipelineStep('DASHBOARD');
            setScrapedData([]);
            setScrapeStats(undefined);
            setLogs([]);
            setResult(null);
          }}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <ShieldAlert className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">SENTINELA ABURRÁ</h1>
            <p className="text-[9px] text-blue-400 font-mono tracking-wider">ML OPS PLATFORM</p>
          </div>
        </button>
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 gap-1">
          <button onClick={() => setViewMode('DASHBOARD')} className={`px-4 py-1.5 rounded-md text-xs font-medium ${viewMode === 'DASHBOARD' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            Operations
          </button>
          <button onClick={() => setViewMode('ARCHITECTURE')} className={`px-4 py-1.5 rounded-md text-xs font-medium ${viewMode === 'ARCHITECTURE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            Codebase
          </button>
          <button onClick={() => setViewMode('DOCS')} className={`px-4 py-1.5 rounded-md text-xs font-medium ${viewMode === 'DOCS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'} flex items-center gap-1`}>
            <BookOpen size={12} /> Docs
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-[1920px] mx-auto w-full h-[calc(100vh-56px)] overflow-hidden">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Left Column: Pipeline State & Logs */}
          <div className="col-span-3 flex flex-col gap-4 h-full">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pipeline Status</h3>
              <div className="space-y-2">
                {['CONFIGURATION', 'SCRAPING', 'DATA_PREVIEW', 'TRAINING', 'DASHBOARD'].map((step, idx) => (
                  <div key={step} className={`flex items-center gap-3 p-2 rounded-lg text-xs font-mono border ${pipelineStep === step ? 'bg-blue-900/20 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${pipelineStep === step ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`}></div>
                    {step}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-0 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              <PipelineStatus logs={logs} isProcessing={pipelineStep === 'SCRAPING' || pipelineStep === 'TRAINING'} scrapeStats={scrapeStats} />
            </div>
          </div>

          {/* Right Column: Dynamic Content */}
          <div className="col-span-9 h-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;