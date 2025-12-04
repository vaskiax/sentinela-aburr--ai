import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { Activity } from 'lucide-react';

interface TrainingVisualizationProps {
    data: Array<Record<string, any>> | null | undefined;
}

const TrainingVisualization: React.FC<TrainingVisualizationProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return null;
    }

    // Identify feature columns dynamically
    const keys = Object.keys(data[0]);
    const triggerFeature = keys.find(k => k.includes('triggers_last_'));
    const targetFeature = 'target';

    if (!triggerFeature) return null;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Activity size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Historical Correlation Analysis</h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Comparing <span className="text-blue-400">Trigger Events (Rolling Sum)</span> vs <span className="text-orange-400">Crime Volume (Target)</span> over time.
                        Use this to verify if spikes in triggers precede spikes in crime.
                    </p>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorTriggers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            fontSize={10}
                            tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            minTickGap={30}
                        />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                            itemStyle={{ fontSize: '12px' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
                            labelFormatter={(value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />

                        <Area
                            type="monotone"
                            dataKey={triggerFeature}
                            name="Trigger Events (Rolling)"
                            stroke="#60a5fa"
                            fillOpacity={1}
                            fill="url(#colorTriggers)"
                            strokeWidth={2}
                        />
                        <Area
                            type="monotone"
                            dataKey={targetFeature}
                            name="Crime Volume (Target)"
                            stroke="#fb923c"
                            fillOpacity={1}
                            fill="url(#colorTarget)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TrainingVisualization;
