import React, { useState } from 'react';
import { api } from '../services/api';
import { ScrapedItem } from '../types';
import { Play, Download, Upload, FileText, AlertTriangle, CheckCircle, Activity, BarChart3 } from 'lucide-react';
import DataFrameViewer from './DataFrameViewer';

interface InferenceViewProps {
    onViewDashboard?: () => void;
}

const InferenceView: React.FC<InferenceViewProps> = ({ onViewDashboard }) => {
    const [inputData, setInputData] = useState<ScrapedItem[]>([]);
    const [prediction, setPrediction] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [inputStats, setInputStats] = useState<{
        dateRange: { start: string; end: string } | null;
        triggerCount: number;
        forecastHorizon: number;
    }>({
        dateRange: null,
        triggerCount: 0,
        forecastHorizon: 7
    });

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setError(null);
        setPrediction(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split('\n');
                const headers = lines[0].split(',');

                // Simple CSV parser (assumes Date, Type, Headline columns exist)
                const items: ScrapedItem[] = [];
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    const cols = lines[i].split(',');
                    // Basic mapping - in production use a real CSV parser
                    // Assuming order: Date, Source, Type, Headline, Snippet, Relevance, URL
                    // Or just mapping by index if headers match expected

                    // Flexible mapping based on header index could be better, but for MVP:
                    // We'll assume the same format as the export or the upload template

                    // Fallback: Create items with minimal required fields
                    items.push({
                        id: `inf_${i}`,
                        date: cols[0] || new Date().toISOString(),
                        source: 'Inference Upload',
                        type: cols[2] || 'TRIGGER_EVENT', // index 2 usually Type
                        headline: cols[3] || 'Unknown Event',
                        snippet: '',
                        relevance_score: 1.0,
                        url: 'upload://inference'
                    } as any);
                }

                // Better approach: Use the same backend upload endpoint but for parsing? 
                // No, let's just parse simply here. 
                // Actually, let's try to be safer.

                const parsedItems = lines.slice(1).filter(l => l.trim()).map((line, idx) => {
                    const cols = line.split(',');
                    return {
                        id: `inf_${idx}`,
                        date: cols[1]?.trim(), // Date is column 1
                        source: cols[2]?.trim() || 'Inference', // Source is column 2
                        type: cols[3]?.trim() || 'TRIGGER_EVENT', // Type is column 3 (NOT 2!)
                        headline: cols[4]?.trim() || 'Event', // Headline is column 4
                        snippet: '',
                        relevance_score: parseFloat(cols[5]?.trim()) || 1.0, // Relevance is column 5
                        url: cols[6]?.trim() || 'upload://inference' // URL is column 6
                    } as ScrapedItem;
                });

                // Sort by date to ensure chronological order
                parsedItems.sort((a, b) => {
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    return dateA - dateB;
                });

                setInputData(parsedItems);

                // Calculate statistics for display
                const triggerEvents = parsedItems.filter(item => item.type === 'TRIGGER_EVENT');
                const dates = parsedItems.map(item => new Date(item.date)).filter(d => !isNaN(d.getTime()));

                if (dates.length > 0) {
                    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
                    setInputStats({
                        dateRange: {
                            start: sortedDates[0].toISOString().split('T')[0],
                            end: sortedDates[sortedDates.length - 1].toISOString().split('T')[0]
                        },
                        triggerCount: triggerEvents.length,
                        forecastHorizon: 7
                    });
                } else {
                    setInputStats({
                        dateRange: null,
                        triggerCount: triggerEvents.length,
                        forecastHorizon: 7
                    });
                }
            } catch (err) {
                setError("Failed to parse CSV. Ensure format: Date,Source,Type,Headline,...");
            }
        };
        reader.readAsText(file);
    };

    const handleRunInference = async () => {
        if (inputData.length === 0) {
            setError("No data loaded.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await api.runPrediction(inputData);
            setPrediction(result);
        } catch (error) {
            console.error("Inference failed:", error);
            setError("Inference failed. Check console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadModel = () => {
        window.open(api.getDownloadModelUrl(), '_blank');
    };

    return (
        <div className="h-full flex flex-col p-6 bg-slate-950 overflow-y-auto custom-scrollbar">
            <div className="mb-8 border-b border-slate-800 pb-6">
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <Play size={18} />
                    </div>
                    Inference & Deployment
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                    Test your trained model with new data or download it for production deployment.
                </p>

                {/* Model Info Badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                    <div className="px-3 py-1 bg-emerald-900/20 border border-emerald-700/30 rounded-full text-xs font-bold text-emerald-400 flex items-center gap-2">
                        <CheckCircle size={12} />
                        Model Trained & Ready
                    </div>
                    <div className="px-3 py-1 bg-blue-900/20 border border-blue-700/30 rounded-full text-xs text-blue-400">
                        Random Forest + XGBoost
                    </div>
                    <div className="px-3 py-1 bg-purple-900/20 border border-purple-700/30 rounded-full text-xs text-purple-400">
                        7-Day Forecast Horizon
                    </div>
                </div>
            </div>

            {/* Instructions Panel */}
            <div className="mb-6 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText size={14} className="text-blue-400" /> Required CSV Format
                </h3>
                <div className="space-y-3">
                    <p className="text-xs text-slate-400">
                        Upload a CSV file with <strong className="text-slate-300">recent trigger events</strong> (last 7-14 days) to predict crime volume for the next 7 days.
                    </p>

                    <div className="bg-slate-950 border border-slate-800 rounded p-3">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Required Columns:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <code className="text-blue-400">Date</code>
                                <span className="text-slate-600">-</span>
                                <span className="text-slate-500">YYYY-MM-DD</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <code className="text-green-400">Type</code>
                                <span className="text-slate-600">-</span>
                                <span className="text-slate-500">TRIGGER_EVENT</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                <code className="text-yellow-400">Headline</code>
                                <span className="text-slate-600">-</span>
                                <span className="text-slate-500">Event description</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                <code className="text-purple-400">Source</code>
                                <span className="text-slate-600">-</span>
                                <span className="text-slate-500">Optional</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded p-3">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Example Row:</div>
                        <code className="text-[10px] text-slate-400 block overflow-x-auto">
                            2024-12-01,El Tiempo,TRIGGER_EVENT,"Operativo policial en Bello",0.95,https://...
                        </code>
                    </div>
                </div>
            </div>

            {/* Input Data Summary Panel */}
            {inputData.length > 0 && (
                <div className="mb-6 bg-blue-900/10 border border-blue-800/30 rounded-xl p-6">
                    <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BarChart3 size={14} className="text-blue-400" /> Input Data Summary
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-950 p-4 rounded border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Analysis Window</div>
                            <div className="text-sm font-mono text-blue-300">
                                {inputStats.dateRange ? (
                                    <>{inputStats.dateRange.start} → {inputStats.dateRange.end}</>
                                ) : (
                                    'N/A'
                                )}
                            </div>
                        </div>
                        <div className="bg-slate-950 p-4 rounded border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Triggers Detected</div>
                            <div className="text-2xl font-bold text-green-400">{inputStats.triggerCount}</div>
                            <div className="text-[10px] text-slate-500 mt-1">TRIGGER_EVENT items</div>
                        </div>
                        <div className="bg-slate-950 p-4 rounded border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Forecast Horizon</div>
                            <div className="text-2xl font-bold text-purple-400">{inputStats.forecastHorizon}</div>
                            <div className="text-[10px] text-slate-500 mt-1">days ahead</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Input & Actions */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Upload size={16} className="text-blue-400" /> 1. Load New Data
                        </h3>

                        <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-blue-500/50 transition-colors bg-slate-900/30">
                            <input
                                type="file"
                                id="inference-upload"
                                className="hidden"
                                accept=".csv"
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="inference-upload" className="cursor-pointer flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                    <FileText size={24} />
                                </div>
                                <span className="text-sm font-medium text-slate-300">
                                    {fileName ? fileName : "Click to upload CSV"}
                                </span>
                                <span className="text-xs text-slate-500">
                                    Format: Date, Source, Type, Headline...
                                </span>
                            </label>
                        </div>

                        {inputData.length > 0 && (
                            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/10 p-2 rounded border border-emerald-900/30">
                                <CheckCircle size={14} />
                                Loaded {inputData.length} records ready for prediction.
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 flex items-center gap-2 text-xs text-red-400 bg-red-900/10 p-2 rounded border border-red-900/30">
                                <AlertTriangle size={14} />
                                {error}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleRunInference}
                        disabled={isLoading || inputData.length === 0}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-900/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="animate-pulse">Running Model...</span>
                        ) : (
                            <>
                                <Play size={20} fill="currentColor" /> RUN PREDICTION
                            </>
                        )}
                    </button>
                </div>

                {/* Right: Results & Download */}
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full flex flex-col">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FileText size={16} className="text-emerald-400" /> 2. Results
                        </h3>

                        {prediction ? (
                            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 animate-in fade-in zoom-in duration-300">

                                {/* ALERTA DE DATOS INSUFICIENTES */}
                                {prediction.warning_message && (
                                    <div className="w-full bg-amber-900/20 border border-amber-500/50 p-3 rounded-lg flex items-start gap-3 text-left animate-pulse">
                                        <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={16} />
                                        <div>
                                            <p className="text-xs font-bold text-amber-200">Precaución: Ventana de Datos Incompleta</p>
                                            <p className="text-[10px] text-amber-300/80">{prediction.warning_message}</p>
                                        </div>
                                    </div>
                                )}

                                {/* SCORE PRINCIPAL */}
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Índice de Riesgo Global</div>
                                    <div className={`text-6xl font-black tracking-tight ${prediction.risk_score > 70 ? 'text-red-500' :
                                        prediction.risk_score > 30 ? 'text-orange-500' : 'text-emerald-500'
                                        }`}>
                                        {prediction.risk_score}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-2">Escala Normalizada 0-100</div>
                                </div>

                                {/* DESGLOSE COMPARATIVO (PERAS CON PERAS) */}
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    {/* Riesgo del Modelo */}
                                    <div className="bg-slate-950 p-3 rounded border border-slate-800 relative overflow-hidden text-left">
                                        <div className="flex justify-between items-end z-10 relative mb-1">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold">Model Risk</span>
                                            <span className="text-xl font-bold text-blue-400">{prediction.model_risk_score}</span>
                                        </div>
                                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden z-10 relative">
                                            <div className="h-full bg-blue-500" style={{ width: `${prediction.model_risk_score}%` }}></div>
                                        </div>
                                        <p className="text-[9px] text-slate-600 mt-2 z-10 relative leading-tight">
                                            Proyección vs. Máx. Histórico
                                        </p>
                                    </div>

                                    {/* Riesgo de Zonas */}
                                    <div className="bg-slate-950 p-3 rounded border border-slate-800 relative overflow-hidden text-left">
                                        <div className="flex justify-between items-end z-10 relative mb-1">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold">Zonas (Act.)</span>
                                            <span className="text-xl font-bold text-purple-400">{prediction.zone_risk_score}</span>
                                        </div>
                                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden z-10 relative">
                                            <div className="h-full bg-purple-500" style={{ width: `${prediction.zone_risk_score}%` }}></div>
                                        </div>
                                        <p className="text-[9px] text-slate-600 mt-2 z-10 relative leading-tight">
                                            Mención actual vs. Pico Histórico
                                        </p>
                                    </div>
                                </div>

                                {/* Crime Volume Display */}
                                <div className="text-center pt-2 border-t border-slate-800">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Volumen Proyectado</div>
                                    <div className="text-3xl font-black text-white">{prediction.predicted_crime_volume}</div>
                                    <div className="text-xs text-slate-400">incidentes</div>
                                </div>

                                <div>
                                    {/* Dynamic Explanation */}
                                    <div className="mt-4 p-3 bg-slate-950 rounded border border-slate-800 text-xs text-slate-300 leading-relaxed">
                                        {(() => {
                                            const volume = prediction.predicted_crime_volume;
                                            const forecastDays = inputStats.forecastHorizon;
                                            const granularity = prediction.model_metadata?.granularity || 'W';

                                            // Get ACTUAL values from model metadata (what was used during training/feature engineering)
                                            const horizonUnits = prediction.model_metadata?.horizon_units ?? 1;
                                            const horizonDays = prediction.model_metadata?.horizon_days ?? forecastDays;
                                            const horizonSuffix = prediction.model_metadata?.horizon_suffix ?? 'w';

                                            // Get actual feature values used for prediction (last row of inference data)
                                            const lastRow = prediction.inference_data_sample?.[prediction.inference_data_sample.length - 1];

                                            // Use ONLY the values from the last row (what the model actually used for prediction)
                                            // Column name must match exactly what the backend generated
                                            const triggersUsed = lastRow?.[`triggers_last_${horizonUnits}${horizonSuffix}`] ?? 0;
                                            const relevanceUsed = lastRow?.[`relevance_last_${horizonUnits}${horizonSuffix}`] ?? 0;

                                            // Calculate the actual date range used for the prediction
                                            let analysisWindow = null;
                                            if (lastRow?.date) {
                                                const lastDate = new Date(lastRow.date);
                                                const startDate = new Date(lastDate);
                                                startDate.setDate(startDate.getDate() - horizonDays);
                                                analysisWindow = {
                                                    start: startDate.toISOString().split('T')[0],
                                                    end: lastDate.toISOString().split('T')[0]
                                                };
                                            }

                                            let trend = 'low';
                                            let trendColor = 'text-green-400';

                                            if (volume > 20) {
                                                trend = 'high';
                                                trendColor = 'text-red-400';
                                            } else if (volume > 10) {
                                                trend = 'medium';
                                                trendColor = 'text-orange-400';
                                            }

                                            return (
                                                <>
                                                    Based on <strong className="text-blue-400">{triggersUsed.toFixed(0)} trigger events</strong> in the last <strong className="text-blue-400">{horizonDays} days</strong> (weighted relevance: <strong className="text-blue-400">{relevanceUsed.toFixed(2)}</strong>)
                                                    {analysisWindow && (
                                                        <> from <strong className="text-blue-400">{analysisWindow.start}</strong> to <strong className="text-blue-400">{analysisWindow.end}</strong></>
                                                    )}, the model projects a <strong className={trendColor}>{trend} trend</strong> of criminality
                                                    over the next <strong className="text-purple-400">
                                                        {horizonUnits} {
                                                            horizonSuffix === 'm' ? 'months' :
                                                                horizonSuffix === 'w' ? 'weeks' : 'days'
                                                        }
                                                    </strong>.
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>                                <div className="w-full h-px bg-slate-800"></div>

                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                        <div className="text-[10px] text-slate-500 uppercase">Horizon</div>
                                        <div className="text-lg font-bold text-blue-400">
                                            {prediction.model_metadata?.horizon_units} {
                                                prediction.model_metadata?.horizon_suffix === 'm' ? 'Months' :
                                                    prediction.model_metadata?.horizon_suffix === 'w' ? 'Weeks' : 'Days'
                                            }
                                        </div>
                                    </div>
                                    <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                        <div className="text-[10px] text-slate-500 uppercase">Status</div>
                                        <div className="text-lg font-bold text-emerald-400">Success</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                                <Activity size={48} className="mb-4 opacity-20" />
                                <p className="text-sm">Run prediction to see results here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* DataFrame Sample */}
            {prediction && prediction.inference_data_sample && (
                <div className="mt-8">
                    <DataFrameViewer
                        data={prediction.inference_data_sample}
                        fullData={prediction.inference_data_full}
                        title="Inference Data"
                        description="Showing last 10 rows | Download button exports complete dataset"
                        highlightTarget={false}
                    />
                </div>
            )}

            {/* Footer: Download & Dashboard */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                    <strong className="text-slate-300">Model Artifact:</strong> sentinela_model.joblib (Random Forest / XGBoost)
                </div>
                <div className="flex gap-3">
                    {onViewDashboard && (
                        <button
                            onClick={onViewDashboard}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                        >
                            <BarChart3 size={14} /> VIEW DASHBOARD
                        </button>
                    )}
                    <button
                        onClick={handleDownloadModel}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors border border-slate-700"
                    >
                        <Download size={14} /> DOWNLOAD MODEL
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InferenceView;
