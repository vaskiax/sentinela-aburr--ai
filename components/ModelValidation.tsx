import React from 'react';
import { CheckCircle, AlertTriangle, Activity } from 'lucide-react';

interface ModelValidationProps {
    testEvaluation?: {
        test_risk_score: number;
        test_predicted_volume: number;
        test_actual_volume?: number | null;
        test_risk_level: string;
        test_model_risk: number;
        test_zone_risk: number;
        rmse: number;
        note: string;
    };
    trainingMetrics?: {
        f1_score: number;
        dataset_size: number;
        test_set_size: number;
    };
}

const ModelValidation: React.FC<ModelValidationProps> = ({ testEvaluation, trainingMetrics }) => {
    if (!testEvaluation) {
        return null;
    }

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'CRITICAL': return 'text-red-400';
            case 'HIGH': return 'text-orange-400';
            case 'ELEVATED': return 'text-yellow-400';
            case 'MODERATE': return 'text-blue-400';
            default: return 'text-green-400';
        }
    };

    const accuracy = testEvaluation.test_actual_volume
        ? Math.abs(testEvaluation.test_predicted_volume - testEvaluation.test_actual_volume) / testEvaluation.test_actual_volume * 100
        : null;

    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center">
                    <Activity size={20} className="text-blue-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Model Validation (Test Set)
                    </h3>
                    <p className="text-[10px] text-slate-500">
                        {testEvaluation.note}
                    </p>
                </div>
            </div>

            {/* Validation Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Test Risk Score */}
                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase mb-1">Test Risk Score</div>
                    <div className={`text-2xl font-bold ${getRiskColor(testEvaluation.test_risk_level)}`}>
                        {testEvaluation.test_risk_score}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{testEvaluation.test_risk_level}</div>
                </div>

                {/* Predicted vs Actual */}
                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase mb-1">Predicted Volume</div>
                    <div className="text-2xl font-bold text-blue-300">
                        {testEvaluation.test_predicted_volume.toFixed(2)}
                    </div>
                    {testEvaluation.test_actual_volume !== null && testEvaluation.test_actual_volume !== undefined && (
                        <div className="text-xs text-slate-400 mt-1">
                            Actual: {testEvaluation.test_actual_volume.toFixed(2)}
                        </div>
                    )}
                </div>

                {/* RMSE */}
                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase mb-1">RMSE</div>
                    <div className="text-2xl font-bold text-purple-300">
                        {testEvaluation.rmse.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Root Mean Sq Error</div>
                </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="flex justify-between items-center text-xs bg-slate-950/30 p-2 rounded">
                    <span className="text-slate-400">Model Risk (Test):</span>
                    <span className="text-blue-300 font-mono">{testEvaluation.test_model_risk}%</span>
                </div>
                <div className="flex justify-between items-center text-xs bg-slate-950/30 p-2 rounded">
                    <span className="text-slate-400">Zone Risk (Test):</span>
                    <span className="text-purple-300 font-mono">{testEvaluation.test_zone_risk}%</span>
                </div>
            </div>

            {/* Accuracy Indicator */}
            {accuracy !== null && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${accuracy < 20 ? 'bg-green-900/20 border border-green-700/30' : 'bg-amber-900/20 border border-amber-700/30'}`}>
                    {accuracy < 20 ? (
                        <CheckCircle size={16} className="text-green-400" />
                    ) : (
                        <AlertTriangle size={16} className="text-amber-400" />
                    )}
                    <span className={`text-xs ${accuracy < 20 ? 'text-green-300' : 'text-amber-300'}`}>
                        {accuracy < 20 ? '✓ Good Accuracy' : '⚠ Moderate Deviation'}: {accuracy.toFixed(1)}% error
                    </span>
                </div>
            )}

            {/* Dataset Info */}
            {trainingMetrics && (
                <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500">
                    <p>Training Set: {trainingMetrics.dataset_size} samples | Test Set: {trainingMetrics.test_set_size} samples</p>
                </div>
            )}
        </div>
    );
};

export default ModelValidation;
