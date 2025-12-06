import React, { useState } from 'react';
import { ScrapedItem } from '../types';
import { Database, ArrowRight, Download, ExternalLink, ChevronLeft, ChevronRight, Loader } from 'lucide-react';

interface Props {
  data: ScrapedItem[];
  onProceed: () => void;
  isTrainingInProgress?: boolean;
  onViewTraining?: () => void;
}

const DataPreview: React.FC<Props> = ({ data, onProceed, isTrainingInProgress = false, onViewTraining }) => {
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, data.length);
  const displayedData = data.slice(startIndex, endIndex);

  const handleDownload = () => {
    // CSV Header
    const headers = ['ID', 'Date', 'Source', 'Type', 'Headline', 'Relevance Score', 'URL'];

    // Convert data to CSV row strings
    const rows = data.map(item => {
      // Escape quotes in headline/snippet for CSV validity
      const safeHeadline = `"${item.headline.replace(/"/g, '""')}"`;
      return [
        item.id,
        item.date,
        item.source,
        item.type,
        safeHeadline,
        item.relevance_score.toFixed(3),
        item.url
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sentinela_scraped_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handleRowsPerPageChange = (value: number) => {
    setRowsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-2xl h-full flex flex-col">
      {/* Training Progress Banner */}
      {isTrainingInProgress && onViewTraining && (
        <div className="mb-4 bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Loader className="text-blue-400 animate-spin" size={20} />
            <div>
              <p className="text-sm font-bold text-blue-300">Training in Progress</p>
              <p className="text-xs text-blue-200/70">Model is being trained on this dataset. You can continue reviewing or view progress.</p>
            </div>
          </div>
          <button
            onClick={onViewTraining}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded transition-colors flex items-center gap-2"
          >
            View Training <ArrowRight size={16} />
          </button>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <Database className="text-green-500" size={20} /> Data Quality Check
          </h2>
          <p className="text-sm text-slate-400">Review scraped intelligence before training the model.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{data.length}</div>
            <div className="text-[10px] text-slate-500 font-mono uppercase">Records Found</div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Moved to top */}
      <div className="mb-4 flex justify-between">
        <button
          onClick={handleDownload}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 px-4 py-3 rounded-lg font-bold flex items-center gap-2 transition-all text-xs"
        >
          <Download size={16} /> DOWNLOAD DATASET (CSV)
        </button>

        <button
          onClick={onProceed}
          disabled={isTrainingInProgress}
          className="bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-green-900/20 flex items-center gap-2 transition-all"
        >
          {isTrainingInProgress ? (
            <><Loader className="animate-spin" size={18} /> TRAINING...</>
          ) : (
            <>APPROVE & TRAIN MODEL <ArrowRight size={18} /></>
          )}
        </button>
      </div>

      {/* Rows per page slider */}
      <div className="mb-4 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-mono text-slate-400 uppercase">Rows per page</label>
          <span className="text-sm font-bold text-white">{rowsPerPage}</span>
        </div>
        <input
          type="range"
          min="10"
          max="200"
          step="10"
          value={rowsPerPage}
          onChange={(e) => handleRowsPerPageChange(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>10</span>
          <span>200</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-slate-900 border border-slate-800 rounded-lg">
        <div className="overflow-x-auto h-full custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800 text-slate-300 text-xs uppercase font-mono sticky top-0 z-10 shadow-md">
              <tr>
                <th className="p-3 border-b border-slate-700">Source</th>
                <th className="p-3 border-b border-slate-700">Date</th>
                <th className="p-3 border-b border-slate-700 w-1/3">Headline</th>
                <th className="p-3 border-b border-slate-700 text-center">Link</th>
                <th className="p-3 border-b border-slate-700">Relevance</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-400 font-mono divide-y divide-slate-800">
              {displayedData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 text-blue-400">{item.source}</td>
                  <td className="p-3">{item.date}</td>
                  <td className="p-3 font-sans text-slate-300 font-medium">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded mr-2 border ${item.type === 'TRIGGER_EVENT' ? 'bg-red-900/30 border-red-800 text-red-300' : 'bg-blue-900/30 border-blue-800 text-blue-300'}`}>
                      {item.type === 'TRIGGER_EVENT' ? 'CAPTURE' : 'CRIME'}
                    </span>
                    {item.headline || <span className="text-slate-600 italic">(empty)</span>}
                  </td>
                  <td className="p-3 text-center">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400 transition-colors">
                      <ExternalLink size={14} />
                    </a>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${item.relevance_score * 100}%` }}
                        ></div>
                      </div>
                      <span>{(item.relevance_score * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination controls */}
      <div className="mt-4 flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-3">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-xs font-mono transition-colors"
        >
          <ChevronLeft size={14} /> PREV
        </button>

        <div className="text-xs font-mono text-slate-400">
          Showing <span className="text-white font-bold">{startIndex + 1}</span> to <span className="text-white font-bold">{endIndex}</span> of <span className="text-white font-bold">{data.length}</span> records
          <span className="mx-2">•</span>
          Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
        </div>

        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-xs font-mono transition-colors"
        >
          NEXT <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default DataPreview;