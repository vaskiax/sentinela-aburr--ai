import React from 'react';
import { Brain, Target, ArrowRight, List, Activity } from 'lucide-react';
import { ModelMetadata } from '../types';

interface TrainingInsightsProps {
    metadata?: ModelMetadata;
}

const TrainingInsights: React.FC<TrainingInsightsProps> = ({ metadata }) => {
    if (!metadata) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Regressors (X) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Activity size={14} /> Predictor Variables (X)
                </h3>
                <ul className="space-y-2 flex-1">
                    {metadata.regressors.map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 flex items-start gap-2">
                            <span className="text-blue-500 font-mono">{idx + 1}.</span>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Targets (Y) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Target size={14} /> Target Variables (Y)
                </h3>
                <ul className="space-y-2 flex-1">
                    {metadata.targets.map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 flex items-start gap-2">
                            <span className="text-red-500 font-mono">{idx + 1}.</span>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Training Steps */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Brain size={14} /> Training Process
                </h3>
                <div className="flex-1 overflow-y-auto max-h-[200px] custom-scrollbar">
                    <ul className="space-y-2">
                        {metadata.training_steps.map((step, idx) => (
                            <li key={idx} className="text-[10px] text-slate-400 font-mono border-l-2 border-slate-700 pl-2 py-1">
                                {step}
                            </li>
                        ))}
                    </ul>
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
