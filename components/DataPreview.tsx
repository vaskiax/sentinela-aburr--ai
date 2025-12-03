import React from 'react';
import { ScrapedItem } from '../types';
import { Database, ArrowRight, Download, ExternalLink } from 'lucide-react';

interface Props {
  data: ScrapedItem[];
  onProceed: () => void;
}

const DataPreview: React.FC<Props> = ({ data, onProceed }) => {
  
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

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-2xl h-full flex flex-col">
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
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 text-blue-400">{item.source}</td>
                  <td className="p-3">{item.date}</td>
                  <td className="p-3 font-sans text-slate-300 font-medium">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded mr-2 border ${item.type === 'TRIGGER_EVENT' ? 'bg-red-900/30 border-red-800 text-red-300' : 'bg-blue-900/30 border-blue-800 text-blue-300'}`}>
                        {item.type === 'TRIGGER_EVENT' ? 'CAPTURE' : 'CRIME'}
                    </span>
                    {item.headline}
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

      <div className="mt-6 flex justify-between">
        <button
          onClick={handleDownload}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 px-4 py-3 rounded-lg font-bold flex items-center gap-2 transition-all text-xs"
        >
          <Download size={16} /> DOWNLOAD DATASET (CSV)
        </button>

        <button
          onClick={onProceed}
          className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-green-900/20 flex items-center gap-2 transition-all"
        >
          APPROVE & TRAIN MODEL <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default DataPreview;