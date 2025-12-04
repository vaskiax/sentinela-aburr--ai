import React from 'react';
import { Table, Download } from 'lucide-react';

interface DataFrameViewerProps {
    data: Array<Record<string, any>> | null | undefined;
    fullData?: Array<Record<string, any>> | null | undefined; // Complete DataFrame for download
    title: string;
    description?: string;
    highlightTarget?: boolean;
}

const DataFrameViewer: React.FC<DataFrameViewerProps> = ({ data, fullData, title, description, highlightTarget = false }) => {
    if (!data || data.length === 0) {
        return null;
    }

    // Get column names from first row
    const columns = Object.keys(data[0]);

    // Format number to 2 decimals if it's a number
    const formatValue = (value: any) => {
        if (typeof value === 'number') {
            return value.toFixed(2);
        }
        return value;
    };

    // Download DataFrame as CSV
    const downloadCSV = () => {
        // Use full data if available, otherwise use displayed sample
        const dataToDownload = fullData || data;
        if (!dataToDownload || dataToDownload.length === 0) return;

        // Create CSV content
        const headers = columns.join(',');
        const rows = dataToDownload.map(row =>
            columns.map(col => {
                const value = row[col];
                // Escape commas and quotes in string values
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        );
        const csvContent = [headers, ...rows].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${title.replace(/\s+/g, '_').toLowerCase()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Table size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
                    {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <div className="text-xs text-slate-500 font-mono">
                        {data.length} rows × {columns.length} columns
                    </div>
                    <button
                        onClick={downloadCSV}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-colors"
                    >
                        <Download size={14} /> Download CSV
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto bg-slate-950 rounded-lg border border-slate-800">
                <table className="w-full text-xs font-mono">
                    <thead className="bg-slate-800 text-slate-300 sticky top-0">
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={`px-4 py-3 text-left font-bold uppercase tracking-wider border-b border-slate-700 ${col === 'target' && highlightTarget ? 'text-orange-400 bg-orange-900/20' : ''
                                        } ${col.includes('triggers') || col.includes('relevance') ? 'text-blue-400' : ''
                                        }`}
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {data.map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-slate-800/50 transition-colors">
                                {columns.map((col, colIdx) => (
                                    <td
                                        key={colIdx}
                                        className={`px-4 py-2 ${col === 'date' ? 'text-slate-400' : 'text-slate-300'
                                            } ${col === 'target' && highlightTarget ? 'text-orange-300 font-bold' : ''
                                            }`}
                                    >
                                        {formatValue(row[col])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-3 text-[10px] text-slate-500 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span>Features (X)</span>
                </div>
                {highlightTarget && (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <span>Target (y)</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                    <span>Date Index</span>
                </div>
            </div>
        </div>
    );
};

export default DataFrameViewer;
