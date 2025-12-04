import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, TrendingDown, Activity, GitBranch } from 'lucide-react';

interface ModelMetric {
    model: string;
    rmse: number;
}

interface Props {
    comparison: ModelMetric[];
}

const ModelComparison: React.FC<Props> = ({ comparison }) => {
    if (!comparison || comparison.length === 0) return null;

    // Find winner based on lowest RMSE
    const winner = [...comparison].sort((a, b) => a.rmse - b.rmse)[0];

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg mb-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <GitBranch size={16} className="text-purple-500" />
                        TEMPORAL MODEL BATTLEGROUND
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Comparing Regression Models (Lower RMSE is better)
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-purple-900/20 border border-purple-500/30 px-3 py-1.5 rounded-lg">
                    <Trophy size={14} className="text-yellow-400" />
                    <div className="text-right">
                        <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">WINNER</div>
                        <div className="text-xs font-bold text-white">{winner.model}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2 h-64 bg-slate-950/50 rounded-lg p-2 border border-slate-800/50">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparison} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="model" type="category" width={120} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                                itemStyle={{ color: '#e2e8f0', fontSize: '12px' }}
                                formatter={(value: number) => [value.toFixed(2), 'RMSE']}
                            />
                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                            <Bar dataKey="rmse" name="Root Mean Squared Error (Lower is Better)" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={15} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Metrics Cards */}
                <div className="flex flex-col gap-3">
                    {comparison.map((model) => (
                        <div
                            key={model.model}
                            className={`p-3 rounded-lg border flex justify-between items-center transition-all ${model.model === winner.model
                                    ? 'bg-purple-900/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                                    : 'bg-slate-950 border-slate-800/60 opacity-80 hover:opacity-100'
                                }`}
                        >
                            <div>
                                <div className="text-xs font-bold text-slate-300 mb-1">{model.model}</div>
                                <div className="flex gap-3 text-[10px] text-slate-500">
                                    <span className="flex items-center gap-1"><TrendingDown size={10} /> RMSE: {model.rmse.toFixed(2)}</span>
                                </div>
                            </div>
                            {model.model === winner.model && (
                                <Trophy size={16} className="text-yellow-500" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ModelComparison;
