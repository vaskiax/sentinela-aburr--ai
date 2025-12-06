import React, { useState, useRef } from 'react';
import { ShieldAlert, Play, RefreshCw, ChevronRight, Activity, Target, BookOpen, Settings, AlertTriangle, ChevronDown, ChevronUp, Camera } from 'lucide-react';
import PipelineStatus from './components/PipelineStatus';
import ProjectArchitecture from './components/ProjectArchitecture';
import PipelineConfig from './components/PipelineConfig';
import DataPreview from './components/DataPreview';
import Documentation from './components/Documentation';
import AburraMap from './components/AburraMap';
import ModelMetrics from './components/ModelMetrics';
import ModelComparison from './components/ModelComparison';
import CleaningReport from './components/CleaningReport';
import InferenceView from './components/InferenceView';
import AuditTrail from './components/AuditTrail';
import TrainingInsights from './components/TrainingInsights';
import DataFrameViewer from './components/DataFrameViewer';
import TrainingVisualization from './components/TrainingVisualization';
import ModelConfigMetadata from './components/ModelConfigMetadata';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar } from 'recharts';
import { PredictionResult, ProcessingLog, ScrapingConfig, PipelineStage, ScrapedItem, CleaningStats } from './types';
import { MOCK_LOGS, PROJECT_STRUCTURE, MASTER_PREDICTOR_EVENTS, MASTER_PREDICTOR_RANKS, MASTER_TARGET_CRIMES } from './constants';
import { api } from './services/api';
import { useEffect } from 'react';

function App() {
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'ARCHITECTURE' | 'DOCS'>('DASHBOARD');
  const [pipelineStep, setPipelineStep] = useState<PipelineStage>('DASHBOARD');
  const [backendStage, setBackendStage] = useState<PipelineStage>('DASHBOARD');
  const [isInferenceSectionOpen, setIsInferenceSectionOpen] = useState(false);

  const [scrapingConfig, setScrapingConfig] = useState<ScrapingConfig>({
    target_organizations: [],
    local_combos: [],
    predictor_events: [],
    predictor_ranks: [],
    target_crimes: [],
    date_range_start: '2023-01-01',
    date_range_end: new Date().toISOString().split('T')[0],
    forecast_horizon: 7,
    granularity: 'W'
  });
  const [scrapedData, setScrapedData] = useState<ScrapedItem[]>([]);
  const [logs, setLogs] = useState<ProcessingLog[]>(MOCK_LOGS as ProcessingLog[]);

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [scrapeStats, setScrapeStats] = useState<CleaningStats | undefined>(undefined);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Polling for status updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await api.getStatus();
        setLogs(status.logs);
        setBackendStage(status.stage); // Track backend stage separately

        // Only update stage from backend if we're in a processing state
        // Don't override user navigation (DASHBOARD, CONFIGURATION)
        const processingStages: PipelineStage[] = ['SCRAPING', 'TRAINING'];
        const isProcessing = processingStages.includes(pipelineStep);

        // Special case: Allow transition from CONFIGURATION to DATA_PREVIEW (for CSV upload)
        const allowConfigToPreview = pipelineStep === 'CONFIGURATION' && status.stage === 'DATA_PREVIEW';
        
        // Special case: Allow transition from DATA_PREVIEW to TRAINING when backend starts training
        const allowPreviewToTraining = pipelineStep === 'DATA_PREVIEW' && status.stage === 'TRAINING';

        if ((isProcessing && status.stage !== pipelineStep) || allowConfigToPreview || allowPreviewToTraining) {
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
        // Load result when training completes (ALWAYS reload to get latest training data)
        if (pipelineStep === 'TRAINING' && (status.stage === 'TRAINING' || status.stage === 'INFERENCE')) {
          const res = await api.getResult();
          if (res && res.model_metadata && res.model_metadata.model_name) {
            console.log('[Frontend] Training complete, loading fresh result:', res.model_metadata.model_name);
            setResult(res);
            // Don't auto-navigate - let user review training metrics first
          }
        }
        // Load result when reaching INFERENCE or DASHBOARD stage
        if ((status.stage === 'INFERENCE' || status.stage === 'DASHBOARD') && !result) {
          const res = await api.getResult();
          setResult(res);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [scrapedData.length, result, pipelineStep]);

  // Load persisted model metadata on app initialization (for inferencing without training)
  useEffect(() => {
    const loadPersistedModel = async () => {
      try {
        const res = await api.getResult();
        if (res && res.model_metadata) {
          console.log('[Frontend] Loaded persisted model metadata from backend:', res.model_metadata.model_name);
          setResult(res);
          setPipelineStep('DASHBOARD');
        }
      } catch (e) {
        console.log('[Frontend] No persisted model found on initialization');
      }
    };

    // Only run once on mount
    loadPersistedModel();
  }, []); // Empty dependency array means this runs only once

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
      date_range_start: '2023-01-01',
      date_range_end: new Date().toISOString().split('T')[0]
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
    try {
      await api.startTraining();
      // Don't manually set TRAINING - let polling detect backend stage change
      // This allows user to stay in DATA_PREVIEW until backend actually starts training
    } catch (e) {
      console.error('Failed to start training', e);
    }
  };

  const downloadReport = async () => {
    try {
      if (!dashboardRef.current) {
        alert('Dashboard not ready to capture');
        return;
      }
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `sentinela_dashboard_${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (e) {
      console.error('Snapshot export failed:', e);
      alert('Snapshot export failed. Check console.');
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
        return (
          <div className="flex flex-col items-center justify-center h-full bg-slate-900/50 rounded-xl border border-slate-800">
            <RefreshCw size={48} className="text-blue-500 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-white animate-pulse">
              DUAL-STREAM SCRAPING (X & Y)...
            </h3>
            <p className="text-slate-400 font-mono mt-2">Processing large dataset (2010 - Present).</p>
          </div>
        );
      case 'TRAINING':
        return (
          <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
            {/* Training Results Header */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center text-green-400">
                  <Activity size={18} />
                </div>
                Training Complete
              </h2>
              <p className="text-slate-400 text-sm">
                Review the model performance metrics below before proceeding to inference.
              </p>
            </div>

            {/* Training Insights */}
            {result?.model_metadata && (
              <TrainingInsights
                metadata={result.model_metadata}
                metrics={result.training_metrics}
              />
            )}

            {/* Model Comparison */}
            {result?.model_comparison && (
              <ModelComparison comparison={result.model_comparison} />
            )}

            {/* Model Metrics */}
            {result?.training_metrics && (
              <ModelMetrics metrics={result.training_metrics} />
            )}

            {/* Historical Visualization */}
            <TrainingVisualization data={result?.training_data_full} />

            {/* DataFrame Samples */}
            <DataFrameViewer
              data={result?.training_data_sample}
              fullData={result?.training_data_full}
              title="Training Set"
              description="Showing first 10 rows | Download button exports complete dataset"
              highlightTarget={true}
            />

            <DataFrameViewer
              data={result?.test_data_sample}
              fullData={result?.test_data_full}
              title="Test Set"
              description="Showing first 10 rows | Download button exports complete dataset"
              highlightTarget={true}
            />

            {/* Proceed Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setPipelineStep('DASHBOARD')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-900/20 flex items-center gap-3 transition-all"
              >
                Go to Dashboard <ChevronRight size={20} />
              </button>
            </div>
          </div>
        );
      case 'DATA_PREVIEW':
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <CleaningReport stats={scrapeStats} />
            <div className="flex-1 min-h-0">
              <DataPreview 
                data={scrapedData} 
                onProceed={handleTrainModel}
                isTrainingInProgress={backendStage === 'TRAINING'}
                onViewTraining={() => setPipelineStep('TRAINING')}
              />
            </div>
          </div>
        );
      case 'INFERENCE':
        return <InferenceView 
          onViewDashboard={() => setPipelineStep('DASHBOARD')}
          onSendToDashboard={(pred) => { 
            // PRESERVE model_metadata from training when updating with inference result
            const preservedMetadata = result?.model_metadata;
            setResult({ ...pred, model_metadata: preservedMetadata || pred.model_metadata }); 
            setPipelineStep('DASHBOARD'); 
          }}
        />;
      case 'DASHBOARD':
      default:
        return (
          <div ref={dashboardRef} className="flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">Dashboard Future Prediction</h2>
                <p className="text-xs text-slate-400">Operational forecast + Inline inference controls</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={downloadReport} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-green-400 text-xs font-bold rounded border border-slate-700 flex items-center gap-2">
                  <Camera size={14} /> EXPORT SNAPSHOT
                </button>
              </div>
            </div>

            {/* === MODEL CONFIGURATION METADATA (Persistent Section) === */}
            <ModelConfigMetadata metadata={result?.model_metadata} />

            {/* === PANEL 1: OPERACIONAL (Vivid Colors) === */}
            <div className="bg-gradient-to-br from-red-950/30 to-orange-950/20 border-2 border-red-800/40 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-red-600/30 flex items-center justify-center">
                  <Target size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-300 uppercase tracking-wider">
                    Current Threat Assessment (Forecast)
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Forward-looking prediction using full dataset
                  </p>
                </div>
              </div>

              {/* Top KPI Cards */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-900/70 border border-red-700/30 p-4 rounded-xl shadow-lg relative overflow-hidden">
                  <p className="text-[10px] text-slate-500 font-mono mb-2 uppercase font-bold">Violence Risk Index</p>
                  <div className={`text-5xl font-black mb-2 ${result?.risk_level === 'CRITICAL' ? 'text-red-500' :
                    result?.risk_level === 'HIGH' ? 'text-orange-500' :
                      result?.risk_level === 'ELEVATED' ? 'text-yellow-500' :
                        result?.risk_level === 'MODERATE' ? 'text-blue-500' : 'text-green-500'
                    }`}>
                    {result?.risk_score ?? '--'}
                  </div>
                  <div className={`text-sm font-bold mb-3 ${result?.risk_level === 'CRITICAL' ? 'text-red-400' :
                    result?.risk_level === 'HIGH' ? 'text-orange-400' :
                      result?.risk_level === 'ELEVATED' ? 'text-yellow-400' :
                        result?.risk_level === 'MODERATE' ? 'text-blue-400' : 'text-green-400'
                    }`}>
                    {result?.risk_level ? result.risk_level : '--'}
                  </div>
                  {/* Desglose */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Model Risk:</span>
                      <span className="font-bold text-blue-400">{result?.model_risk_score ?? '--'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Zone Activity:</span>
                      <span className="font-bold text-purple-400">{result?.zone_risk_score ?? '--'}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900/70 border border-red-700/30 p-4 rounded-xl shadow-lg col-span-2">
                  <p className="text-[10px] text-slate-500 font-mono mb-1 uppercase">Predicted Crime Volume</p>
                  <div className="text-2xl font-bold text-white mt-1">{result?.expected_crime_type ?? 'No data'}</div>
                  <div className="flex gap-2 mt-2">
                    {result?.affected_zones?.slice(0, 4).map(z => (
                      <span key={z} className="text-[10px] px-2 py-0.5 bg-red-900/30 text-red-300 rounded border border-red-700/30">{z}</span>
                    ))}
                    {(result?.affected_zones?.length ?? 0) > 4 && <span className="text-[10px] px-2 py-0.5 text-slate-500">+{(result?.affected_zones?.length ?? 0) - 4} more</span>}
                  </div>
                </div>
                <div className="bg-slate-900/70 border border-red-700/30 p-4 rounded-xl shadow-lg">
                  <p className="text-[10px] text-slate-500 font-mono mb-1 uppercase">Forecast Window</p>
                  <div className="flex flex-col gap-2 mt-2">
                    <div>
                      <p className="text-xs text-slate-400">Rolling Horizon (lookback):</p>
                      <div className="text-3xl font-bold text-white">
                        {result?.model_metadata?.horizon_days ?? result?.duration_days ?? '--'}
                        <span className="text-sm font-normal text-slate-500 ml-1">days</span>
                      </div>
                    </div>
                    <div className="border-t border-red-700/20 pt-2">
                      <p className="text-xs text-slate-400">Aggregation Granularity:</p>
                      <div className="text-xl font-bold text-red-300">
                        {result?.model_metadata?.granularity === 'M' ? 'Monthly' :
                          result?.model_metadata?.granularity === 'W' ? 'Weekly' : 'Daily'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* === PANEL 1: DATA SOURCE WARNING (if fallback) === */}
            {result?.data_source === 'training_fallback' && (
              <div className="bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded flex items-start gap-3">
                <AlertTriangle className="text-amber-400 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-bold text-amber-300">⚠️ Fallback Mode: Historical Validation Data</p>
                  <p className="text-xs text-amber-200/70 mt-1">
                    Real-time alignment could not complete. Showing results from the training dataset. This can happen if serialization fails or state is inconsistent.
                  </p>
                </div>
              </div>
            )}

            {/* Audit Trail: Transparency in Calculations */}
            {result?.calculation_breakdown && (
              <AuditTrail breakdown={result.calculation_breakdown} />
            )}

            {/* Embedded Inference Panel: update dashboard result */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setIsInferenceSectionOpen(!isInferenceSectionOpen)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
              >
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Inference Controls</h3>
                {isInferenceSectionOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>
              {isInferenceSectionOpen && (
                <div className="p-4 border-t border-slate-800">
                  <InferenceView
                    onSendToDashboard={(pred) => {
                      // PRESERVE model_metadata from training when updating with inference result
                      const preservedMetadata = result?.model_metadata;
                      setResult({ ...pred, model_metadata: preservedMetadata || pred.model_metadata });
                    }}
                    variant="embedded"
                  />
                </div>
              )}
            </div>

            {/* Bottom Section: Charts & Map */}
            <div className="grid grid-cols-3 gap-6 min-h-[600px]">
              <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                <h3 className="text-xs font-bold text-slate-400 mb-4">RISK BY ZONE (PREDICTED)</h3>
                <div className="flex-1 w-full overflow-hidden">
                  {(!result?.zone_risks || result.zone_risks.length === 0) ? (
                    <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                      No zone risk data available.
                    </div>
                  ) : (() => {
                    const filteredData = result.zone_risks.filter(z => (z.mentions ?? 0) > 0);
                    if (filteredData.length === 0) {
                      return (
                        <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                          No zones with mentions.
                        </div>
                      );
                    }
                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredData} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
                          <defs>
                            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis
                            dataKey="zone"
                            stroke="#64748b"
                            fontSize={9}
                            tickLine={false}
                            axisLine={false}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis
                            domain={[0, 100]}
                            stroke="#64748b"
                            fontSize={9}
                            tickLine={false}
                            axisLine={false}
                            width={30}
                            label={{ value: 'Risk %', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: '#64748b' } }}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 11 }}
                            itemStyle={{ color: '#e2e8f0' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="risk"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="url(#riskGradient)"
                            dot={{ fill: '#ef4444', r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              </div>
              <div className="col-span-2 h-full">
                <AburraMap zoneRisks={result?.zone_risks || []} />
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

        {/* Back to Configuration Button */}
        {pipelineStep !== 'CONFIGURATION' && pipelineStep !== 'SCRAPING' && pipelineStep !== 'TRAINING' && (
          <button
            onClick={() => {
              setPipelineStep('CONFIGURATION');
              setScrapedData([]);
              setScrapeStats(undefined);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold rounded border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <Settings size={14} /> NEW CONFIGURATION
          </button>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-[1920px] mx-auto w-full h-[calc(100vh-56px)] overflow-hidden">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Left Column: Pipeline State & Logs */}
          <div className="col-span-3 flex flex-col gap-4 h-full">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pipeline Status</h3>
              <div className="space-y-2">
                {['CONFIGURATION', 'SCRAPING', 'DATA_PREVIEW', 'TRAINING', 'DASHBOARD'].map((step) => (
                  <div key={step} className={`flex items-center gap-3 p-2 rounded-lg text-xs font-mono border ${pipelineStep === step ? 'bg-blue-900/20 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${pipelineStep === step ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`}></div>
                    {step}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-0 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col">
              <PipelineStatus 
                logs={logs} 
                isProcessing={pipelineStep === 'SCRAPING' || pipelineStep === 'TRAINING'} 
                scrapeStats={scrapeStats}
                onNavigate={(stage) => setPipelineStep(stage)}
                currentStage={pipelineStep}
              />
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