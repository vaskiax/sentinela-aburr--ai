import React, { useState } from 'react';
import { ModelMetadata } from '../types';
import { Settings, Calendar, Clock, Zap, ChevronDown, ChevronUp } from 'lucide-react';

interface ModelConfigMetadataProps {
  metadata?: ModelMetadata;
}

const ModelConfigMetadata: React.FC<ModelConfigMetadataProps> = ({ metadata }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!metadata) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Settings size={16} />
          <span className="text-xs font-mono">No model trained yet</span>
        </div>
      </div>
    );
  }

  const granularityLabel = metadata.granularity === 'M' ? 'Monthly' :
    metadata.granularity === 'W' ? 'Weekly' : 'Daily';

  // Convert horizon_days to same units as horizon_suffix
  const convertLookbackToUnits = () => {
    const days = metadata.horizon_days ?? 0;
    const suffix = metadata.horizon_suffix || 'd';
    
    if (suffix === 'm') {
      return Math.round(days / 30);
    } else if (suffix === 'w') {
      return Math.round(days / 7);
    }
    return days;
  };

  const getUnitLabel = () => {
    const suffix = metadata.horizon_suffix || 'd';
    return suffix === 'm' ? 'mo' : suffix === 'w' ? 'wk' : 'd';
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center">
            <Settings size={16} className="text-blue-400" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-bold text-blue-300 uppercase tracking-wider">
              Recent Model Configuration
            </h4>
            {metadata.model_name && (
              <p className="text-xs text-slate-500 font-mono mt-1">Model: {metadata.model_name}</p>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={18} className="text-slate-400" />
        ) : (
          <ChevronDown size={18} className="text-slate-400" />
        )}
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700">
          {/* Configuration Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
            {/* Granularity */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 font-mono uppercase mb-1">Granularity</p>
              <p className="text-sm font-bold text-blue-300">{granularityLabel}</p>
            </div>

            {/* Lookback - in same units as Forecast */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 font-mono uppercase mb-1">Lookback</p>
              <div className="flex items-center gap-1">
                <Clock size={12} className="text-yellow-400" />
                <p className="text-sm font-bold text-yellow-300">
                  {convertLookbackToUnits()} {getUnitLabel()}
                </p>
              </div>
            </div>

            {/* Forecast - in same units as Lookback */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 font-mono uppercase mb-1">Forecast</p>
              <p className="text-sm font-bold text-purple-300">
                {metadata.horizon_units ?? '--'} {getUnitLabel()}
              </p>
            </div>

            {/* Model Type */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 font-mono uppercase mb-1">Model</p>
              <p className="text-sm font-bold text-green-300 truncate">
                {metadata.model_type?.includes('Random Forest') ? 'RF' :
                  metadata.model_type?.includes('XGBoost') ? 'XGB' :
                    metadata.model_type?.includes('LightGBM') ? 'LGBM' : 'Temporal'}
              </p>
            </div>

            {/* Data Period */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 font-mono uppercase mb-1">Period</p>
              <p className="text-sm font-bold text-cyan-300">
                {metadata.data_period_start ? 
                  new Date(metadata.data_period_start).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Training Steps (if available) */}
          {metadata.training_steps && metadata.training_steps.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-[10px] text-slate-400 font-mono uppercase mb-2 flex items-center gap-1">
                <Zap size={12} className="text-blue-400" />
                Training Pipeline
              </p>
              <div className="space-y-1">
                {metadata.training_steps.map((step, idx) => (
                  <p key={idx} className="text-[9px] text-slate-300">
                    • {step}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelConfigMetadata;
