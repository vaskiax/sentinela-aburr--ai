import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// AuditTrail - Shows calculation breakdown for transparency
interface AuditTrailProps {
    breakdown?: {
        [key: string]: any;
    };
}

const AuditTrail: React.FC<AuditTrailProps> = ({ breakdown }) => {
    const [expanded, setExpanded] = React.useState(false);

    if (!breakdown) {
        return null;
    }

    // Debug: Log breakdown to console
    console.log('[AuditTrail] Received breakdown:', breakdown);

    // Format number with appropriate precision
    const formatValue = (value: any): string => {
        if (typeof value === 'number') {
            if (value > 100) return value.toFixed(0);
            if (value > 1) return value.toFixed(2);
            return value.toFixed(4);
        }
        return String(value);
    };

    // Group breakdown into logical sections
    const sections = [
        {
            title: 'Model Risk Calculation',
            items: [
                { label: 'Raw Predicted Volume', key: 'raw_predicted_volume' },
                { label: 'Historical Max Volume', key: 'historical_max_volume' },
                { label: 'Formula', key: 'model_risk_formula' },
                { label: 'Model Risk Score', key: 'model_risk_score', highlight: true }
            ]
        },
        {
            title: 'Zone Risk Calculation',
            items: [
                { label: 'Historical Max Zone Mentions', key: 'historical_max_zone_mentions' },
                { label: 'Current Zone Mentions', key: 'zone_risk_current_mentions' },
                { label: 'Formula', key: 'zone_risk_formula' },
                { label: 'Zone Risk Score', key: 'zone_risk_score', highlight: true }
            ]
        },
        {
            title: 'Final Risk Score',
            items: [
                { label: 'Risk Calculation', key: 'risk_calculation' },
                { label: 'Final Score', key: 'final_risk_score', highlight: true }
            ]
        }
    ];

    return (
        <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                        🔍 Audit Trail - Calculation Breakdown
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp size={20} className="text-slate-500" />
                ) : (
                    <ChevronDown size={20} className="text-slate-500" />
                )}
            </button>

            {expanded && (
                <div className="border-t border-slate-800 px-6 py-4 space-y-6">
                    {sections.map((section, idx) => (
                        <div key={idx}>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                {section.title}
                            </h4>
                            <div className="space-y-2 ml-2">
                                {section.items.map((item) => {
                                    const value = breakdown[item.key];
                                    if (value === undefined || value === null) {
                                        console.warn(`[AuditTrail] Missing key: ${item.key}`);
                                    }

                                    return (
                                        <div
                                            key={item.key}
                                            className={`flex justify-between items-center py-2 px-3 rounded text-xs font-mono ${
                                                item.highlight
                                                    ? 'bg-blue-900/20 border border-blue-700/40'
                                                    : 'bg-slate-950/50'
                                            }`}
                                        >
                                            <span className="text-slate-400">{item.label}</span>
                                            <span className={item.highlight ? 'text-blue-300 font-bold' : 'text-slate-300'}>
                                                {value !== undefined && value !== null ? formatValue(value) : 'N/A'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Additional metadata if present */}
                    {breakdown.manual_parameters_used && (
                        <div className="pt-3 border-t border-slate-800">
                            <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-900/10 p-3 rounded border border-amber-700/30">
                                <span>⚙️ Manual Parameters Used</span>
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 space-y-1">
                        <p>📊 All calculations use historical benchmarks for normalization</p>
                        <p>✓ Risk scores are capped at 99.0% to allow room for escalation</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditTrail;
