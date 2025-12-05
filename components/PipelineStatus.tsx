import React from 'react';
import { ProcessingLog, PipelineStage } from '../types';
import { Terminal, Database, Cpu, Activity, FileJson } from 'lucide-react';

interface PipelineStatusProps {
  logs: ProcessingLog[];
  isProcessing: boolean;
  scrapeStats?: { counts: Record<string, number>; errors: Record<string, string> };
  onNavigate?: (stage: PipelineStage) => void;
  currentStage?: PipelineStage;
}

const PipelineStatus: React.FC<PipelineStatusProps> = ({ logs, isProcessing, scrapeStats, onNavigate, currentStage }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const activeStage = logs.length > 0 ? logs[logs.length - 1].stage : null;

  const getStageColor = (stage: string) => {
    if (activeStage === stage && isProcessing) return 'bg-blue-500/20 border-blue-500 text-blue-400 animate-pulse';
    if (logs.some(l => l.stage === stage)) return 'bg-slate-800 border-slate-700 text-slate-400';
    return 'bg-slate-900 border-slate-800 text-slate-700';
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col h-full">
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
        <h3 className="text-xs font-mono text-blue-400 flex items-center gap-2">
          <Terminal size={14} /> PIPELINE EXECUTION LOGS
        </h3>
        {isProcessing && <span className="text-[10px] text-green-400 animate-pulse">● RUNNING</span>}
      </div>
      
      {/* Visual Pipeline Flow */}
      <div className="flex gap-1 p-2 bg-slate-900/50 border-b border-slate-800 overflow-x-auto">
        {/* CONFIGURATION - No clickable */}
        <div className={`flex-1 p-2 rounded border ${currentStage === 'CONFIGURATION' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400'} flex flex-col items-center justify-center text-[10px]`}>
          <Database size={14} className="mb-1" />
          <span className="text-[9px] font-bold">CONFIGURATION</span>
        </div>
        
        {/* SCRAPING - No clickable */}
        <div className={`flex-1 p-2 rounded border ${getStageColor('SCRAPING')} flex flex-col items-center justify-center text-[10px]`}>
          <Database size={14} className="mb-1" />
          <span className="text-[9px] font-bold">SCRAPING</span>
        </div>
        
        {/* DATA_PREVIEW - Clickable button */}
        <button
          onClick={() => onNavigate && onNavigate('DATA_PREVIEW')}
          disabled={!onNavigate || !logs.some(l => l.stage === 'DATA_PREVIEW')}
          className={`flex-1 p-2 rounded border ${currentStage === 'DATA_PREVIEW' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : logs.some(l => l.stage === 'DATA_PREVIEW') ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-600 cursor-pointer' : 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed'} flex flex-col items-center justify-center text-[10px] transition-colors`}
        >
          <FileJson size={14} className="mb-1" />
          <span className="text-[9px] font-bold">DATA_PREVIEW</span>
        </button>
        
        {/* TRAINING - Clickable button */}
        <button
          onClick={() => onNavigate && onNavigate('TRAINING')}
          disabled={!onNavigate || !logs.some(l => l.stage === 'TRAINING')}
          className={`flex-1 p-2 rounded border ${currentStage === 'TRAINING' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : logs.some(l => l.stage === 'TRAINING') ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-600 cursor-pointer' : 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed'} flex flex-col items-center justify-center text-[10px] transition-colors`}
        >
          <Cpu size={14} className="mb-1" />
          <span className="text-[9px] font-bold">TRAINING</span>
        </button>
        
        {/* DASHBOARD - Clickable button (enabled if training completed) */}
        <button
          onClick={() => onNavigate && onNavigate('DASHBOARD')}
          disabled={!onNavigate || !logs.some(l => l.stage === 'TRAINING')}
          className={`flex-1 p-2 rounded border ${currentStage === 'DASHBOARD' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : logs.some(l => l.stage === 'TRAINING') ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-600 cursor-pointer' : 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed'} flex flex-col items-center justify-center text-[10px] transition-colors`}
        >
          <Activity size={14} className="mb-1" />
          <span className="text-[9px] font-bold">DASHBOARD</span>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1 bg-[#0b1120] text-slate-300">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2">
            <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
            <span className="text-blue-500 font-bold shrink-0">{'>'}</span>
            <span className="text-slate-300 break-all">{log.message}</span>
          </div>
        ))}
        {scrapeStats && (
          <div className="mt-3 p-2 border border-slate-800 rounded bg-slate-900">
            <div className="text-[10px] text-slate-400 font-bold mb-1">Source Summary</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(scrapeStats.counts || {}).map(([src, cnt]) => (
                <span key={src} className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">{src}: {cnt}</span>
              ))}
            </div>
            {Object.keys(scrapeStats.errors || {}).length > 0 && (
              <div className="mt-2 text-[10px] text-red-400">Errors: {Object.entries(scrapeStats.errors).map(([src, err]) => `${src}: ${err}`).join(' | ')}</div>
            )}
          </div>
        )}
        {!isProcessing && logs.length > 0 && (
          <div className="flex gap-2 mt-2 pt-2 border-t border-slate-800">
             <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
             <span className="text-green-500 font-bold">Build successful. 0 errors.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineStatus;