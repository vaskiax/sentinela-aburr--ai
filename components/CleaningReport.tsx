import React from 'react';
import { Filter, Trash2, CheckCircle, Database } from 'lucide-react';
import { CleaningStats } from '../types';

interface CleaningReportProps {
    stats?: CleaningStats;
}

const CleaningReport: React.FC<CleaningReportProps> = ({ stats }) => {
    if (!stats) return null;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Filter size={16} /> Data Cleaning Pipeline
            </h3>

            <div className="grid grid-cols-5 gap-4">
                {/* Step 1: Total Scraped */}
                <div className="flex flex-col items-center p-4 bg-slate-950 rounded-lg border border-slate-800 relative">
                    <div className="absolute top-1/2 -right-3 w-6 h-0.5 bg-slate-800 z-0 hidden md:block"></div>
                    <Database className="text-blue-500 mb-2" size={24} />
                    <span className="text-2xl font-bold text-white">{stats.total_scraped}</span>
                    <span className="text-[10px] text-slate-500 uppercase mt-1">Raw Articles</span>
                </div>

                {/* Step 2: Relevance Filter */}
                <div className="flex flex-col items-center p-4 bg-slate-950 rounded-lg border border-slate-800 relative">
                    <div className="absolute top-1/2 -right-3 w-6 h-0.5 bg-slate-800 z-0 hidden md:block"></div>
                    <Filter className="text-orange-500 mb-2" size={24} />
                    <span className="text-2xl font-bold text-orange-400">-{stats.filtered_relevance}</span>
                    <span className="text-[10px] text-slate-500 uppercase mt-1">Low Relevance</span>
                </div>

                {/* Step 3: Date Filter */}
                <div className="flex flex-col items-center p-4 bg-slate-950 rounded-lg border border-slate-800 relative">
                    <div className="absolute top-1/2 -right-3 w-6 h-0.5 bg-slate-800 z-0 hidden md:block"></div>
                    <Filter className="text-yellow-500 mb-2" size={24} />
                    <span className="text-2xl font-bold text-yellow-400">-{stats.filtered_date}</span>
                    <span className="text-[10px] text-slate-500 uppercase mt-1">Out of Date</span>
                </div>

                {/* Step 4: Deduplication */}
                <div className="flex flex-col items-center p-4 bg-slate-950 rounded-lg border border-slate-800 relative">
                    <div className="absolute top-1/2 -right-3 w-6 h-0.5 bg-slate-800 z-0 hidden md:block"></div>
                    <Trash2 className="text-red-500 mb-2" size={24} />
                    <span className="text-2xl font-bold text-red-400">-{stats.duplicates_removed}</span>
                    <span className="text-[10px] text-slate-500 uppercase mt-1">Duplicates</span>
                </div>

                {/* Step 5: Final Dataset */}
                <div className="flex flex-col items-center p-4 bg-blue-900/20 rounded-lg border border-blue-500/50">
                    <CheckCircle className="text-green-500 mb-2" size={24} />
                    <span className="text-2xl font-bold text-white">{stats.final_count}</span>
                    <span className="text-[10px] text-blue-300 uppercase mt-1">Clean Dataset</span>
                </div>
            </div>
        </div>
    );
};

export default CleaningReport;
