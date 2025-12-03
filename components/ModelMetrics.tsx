import React from 'react';
import { TrainingMetrics } from '../types';
import { Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  metrics: TrainingMetrics;
}

const ModelMetrics: React.FC<Props> = ({ metrics }) => {
  const { accuracy, precision, recall, f1_score, confusion_matrix, dataset_size } = metrics;
  
  // Destructure matrix: Assuming [[TP, FP], [FN, TN]] structure for this visualization
  // Row = Actual, Col = Predicted
  const [[tp, fp], [fn, tn]] = confusion_matrix;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Activity size={16} className="text-blue-500" />
            MODEL TRAINING PERFORMANCE
          </h3>
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            XGBoost Classifier Evaluation (Test Set N={dataset_size.toLocaleString()})
          </p>
        </div>
        <div className="text-right">
            <div className="text-2xl font-bold text-white">{(accuracy * 100).toFixed(1)}%</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Overall Accuracy</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 flex flex-col justify-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Precision</span>
                <div className="flex items-end gap-2">
                    <span className="text-xl font-bold text-blue-400">{(precision * 100).toFixed(1)}%</span>
                    <span className="text-[9px] text-slate-600 mb-1 pb-0.5">Reliability</span>
                </div>
                <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: `${precision * 100}%` }}></div>
                </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 flex flex-col justify-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Recall</span>
                <div className="flex items-end gap-2">
                    <span className="text-xl font-bold text-purple-400">{(recall * 100).toFixed(1)}%</span>
                    <span className="text-[9px] text-slate-600 mb-1 pb-0.5">Sensitivity</span>
                </div>
                <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full" style={{ width: `${recall * 100}%` }}></div>
                </div>
            </div>

            <div className="col-span-2 bg-slate-950 p-3 rounded-lg border border-slate-800/60 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">F1-Score (Harmonic Mean)</span>
                    <span className="text-sm font-bold text-emerald-400">{(f1_score * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${f1_score * 100}%` }}></div>
                </div>
            </div>
        </div>

        {/* Right: Confusion Matrix */}
        <div className="bg-slate-950 rounded-lg p-4 border border-slate-800/60">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 text-center">Confusion Matrix</h4>
            
            <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
                {/* Headers */}
                <div className="row-start-2 -rotate-90 text-[9px] text-slate-600 text-center flex items-center justify-center font-bold">ACTUAL</div>
                <div className="col-start-2 text-[9px] text-slate-600 text-center font-bold">PRED POSITIVE</div>
                <div className="col-start-3 text-[9px] text-slate-600 text-center font-bold">PRED NEGATIVE</div>

                {/* Row 1: True Positive & False Negative */}
                <div className="row-start-2 col-start-2 bg-green-900/20 border border-green-900/50 p-2 rounded flex flex-col items-center justify-center relative group">
                    <span className="text-xs font-bold text-green-400">{tp}</span>
                    <span className="text-[8px] text-green-600/70">True Positive</span>
                    <CheckCircle size={12} className="absolute top-1 right-1 text-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="row-start-2 col-start-3 bg-red-900/10 border border-red-900/30 p-2 rounded flex flex-col items-center justify-center relative group">
                    <span className="text-xs font-bold text-red-400">{fn}</span>
                    <span className="text-[8px] text-red-600/70">False Negative</span>
                    <AlertTriangle size={12} className="absolute top-1 right-1 text-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Row 2: False Positive & True Negative */}
                <div className="row-start-3 col-start-2 bg-orange-900/10 border border-orange-900/30 p-2 rounded flex flex-col items-center justify-center relative group">
                    <span className="text-xs font-bold text-orange-400">{fp}</span>
                    <span className="text-[8px] text-orange-600/70">False Positive</span>
                    <XCircle size={12} className="absolute top-1 right-1 text-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="row-start-3 col-start-3 bg-blue-900/10 border border-blue-900/30 p-2 rounded flex flex-col items-center justify-center relative group">
                    <span className="text-xs font-bold text-blue-400">{tn}</span>
                    <span className="text-[8px] text-blue-600/70">True Negative</span>
                    <CheckCircle size={12} className="absolute top-1 right-1 text-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ModelMetrics;