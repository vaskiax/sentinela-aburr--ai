import React from 'react';
import { Brain, Target, ArrowRight, List, Activity } from 'lucide-react';
import { ModelMetadata, TrainingMetrics } from '../types';

interface TrainingInsightsProps {
    metadata?: ModelMetadata;
    metrics?: TrainingMetrics;
}

const TrainingInsights: React.FC<TrainingInsightsProps> = ({ metadata, metrics }) => {
    if (!metadata) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Regressors (X) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Activity size={14} /> Predictor Variables (X)
                </h3>
                <ul className="space-y-2 mb-3">
                    {metadata.regressors.map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 flex items-start gap-2">
                            <span className="text-blue-500 font-mono">{idx + 1}.</span>
                            {item}
                        </li>
                    ))}
                </ul>
                <div className="mt-auto pt-3 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                        <strong className="text-slate-400">How they are built:</strong> Features use <strong>rolling windows</strong> of {metadata.forecast_horizon || 7} days, summing trigger events and relevance scores in the last {metadata.forecast_horizon || 7} days at each point in time.
                    </p>
                </div>
            </div>

            {/* Targets (Y) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Target size={14} /> Target Variables (Y)
                </h3>
                <ul className="space-y-2 mb-3">
                    {metadata.targets.map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 flex items-start gap-2">
                            <span className="text-red-500 font-mono">{idx + 1}.</span>
                            {item}
                        </li>
                    ))}
                </ul>
                <div className="mt-auto pt-3 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                        <strong className="text-slate-400">What it predicts:</strong> The volume of criminal reports in the <strong>next {metadata.forecast_horizon || 7} days</strong>, based on trigger activity in the preceding period to anticipate crime surges.
                    </p>
                </div>
            </div>

            {/* Training Steps */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Brain size={14} /> Training Process
                </h3>
                <div className="flex-1 overflow-y-auto max-h-[150px] custom-scrollbar mb-3">
                    <ul className="space-y-2">
                        {metadata.training_steps.map((step, idx) => (
                            <li key={idx} className="text-[10px] text-slate-400 font-mono border-l-2 border-slate-700 pl-2 py-1">
                                {step}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Data Composition Stats */}
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Data Period</span>
                        <span className="text-[10px] text-blue-300 font-mono">
                            {metadata.data_period_start} <ArrowRight size={10} className="inline mx-1" /> {metadata.data_period_end}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-900 p-2 rounded text-center">
                            <div className="text-[10px] text-slate-500">Training Set (80%)</div>
                            <div className="text-sm font-bold text-white">{metrics?.dataset_size || '-'}</div>
                        </div>
                        <div className="bg-slate-900 p-2 rounded text-center">
                            <div className="text-[10px] text-slate-500">Test Set (20%)</div>
                            <div className="text-sm font-bold text-white">{metrics?.test_set_size || '-'}</div>
                        </div>
                    </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Model Architecture</div>
                    <div className="text-xs font-bold text-white">{metadata.model_type}</div>
                </div>
            </div>
        </div>
    );
};

export default TrainingInsights;
