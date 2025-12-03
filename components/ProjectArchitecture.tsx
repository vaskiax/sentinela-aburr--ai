import React, { useState } from 'react';
import { ProjectFile } from '../types';
import { Folder, FileCode, ChevronRight, ChevronDown, Copy, FileText, Database, Terminal, Settings } from 'lucide-react';

interface Props {
  files: ProjectFile[];
}

const FileIcon = ({ name, type }: { name: string; type: 'file' | 'folder' }) => {
  if (type === 'folder') return <Folder size={14} className="text-blue-400" />;
  if (name.endsWith('.py')) return <FileCode size={14} className="text-yellow-400" />;
  if (name.endsWith('.json') || name.endsWith('.jsonl')) return <FileText size={14} className="text-green-400" />;
  if (name.endsWith('.csv') || name.endsWith('.parquet')) return <Database size={14} className="text-purple-400" />;
  if (name.endsWith('.md') || name.endsWith('.txt')) return <FileText size={14} className="text-slate-400" />;
  if (name.startsWith('.env')) return <Settings size={14} className="text-red-400" />;
  return <FileText size={14} className="text-slate-500" />;
};

const FileTreeItem: React.FC<{ file: ProjectFile; depth: number; onSelect: (f: ProjectFile) => void; selected: ProjectFile | null }> = ({ file, depth, onSelect, selected }) => {
  const [isOpen, setIsOpen] = useState(true); // Default open for better visibility
  
  const isSelected = selected === file;

  if (file.type === 'folder') {
    return (
      <div>
        <div 
          className="flex items-center gap-1 py-1 hover:bg-slate-800/50 cursor-pointer text-slate-400 select-none transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <FileIcon name={file.name} type="folder" />
          <span className="text-[11px] font-mono tracking-tight">{file.name}</span>
        </div>
        {isOpen && file.children?.map((child, idx) => (
          <FileTreeItem key={idx} file={child} depth={depth + 1} onSelect={onSelect} selected={selected} />
        ))}
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center gap-2 py-1 cursor-pointer select-none transition-colors border-l-2 ${isSelected ? 'bg-blue-900/20 text-blue-300 border-blue-500' : 'hover:bg-slate-800/50 text-slate-500 border-transparent'}`}
      style={{ paddingLeft: `${depth * 12 + 16}px` }}
      onClick={() => onSelect(file)}
    >
      <FileIcon name={file.name} type="file" />
      <span className="text-[11px] font-mono tracking-tight">{file.name}</span>
    </div>
  );
};

const ProjectArchitecture: React.FC<Props> = ({ files }) => {
  // Default to opening the main spider script
  const findDefaultFile = (files: ProjectFile[]): ProjectFile | null => {
    // Try to find medellin_news_spider.py deep in the tree
    return files[0]?.children?.find(f => f.name === 'src')?.children?.find(f => f.name === 'spiders')?.children?.find(f => f.name.includes('medellin')) || files[0];
  };

  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(findDefaultFile(files));

  const handleCopy = () => {
    if (selectedFile?.content) {
      navigator.clipboard.writeText(selectedFile.content);
    }
  };

  return (
    <div className="grid grid-cols-12 h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Sidebar File Tree */}
      <div className="col-span-3 border-r border-slate-800 bg-[#0b1120] flex flex-col min-w-[200px]">
        <div className="p-3 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/30">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Explorer</span>
          <Terminal size={12} className="text-slate-600" />
        </div>
        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          {files.map((f, i) => (
            <FileTreeItem key={i} file={f} depth={0} onSelect={setSelectedFile} selected={selectedFile} />
          ))}
        </div>
      </div>

      {/* Code Viewer */}
      <div className="col-span-9 flex flex-col bg-[#0f172a]">
        {selectedFile ? (
          <>
            <div className="h-9 border-b border-slate-800 flex items-center justify-between px-4 bg-[#1e293b]/50">
              <div className="flex items-center gap-2">
                <FileIcon name={selectedFile.name} type="file" />
                <span className="text-xs text-slate-200 font-mono">{selectedFile.name}</span>
              </div>
              {selectedFile.content && (
                <button 
                  onClick={handleCopy}
                  className="text-slate-500 hover:text-white transition-colors flex items-center gap-1 text-[10px] uppercase"
                  title="Copy Code"
                >
                  <Copy size={12} /> Copy
                </button>
              )}
            </div>
            <div className="flex-1 overflow-auto p-0 custom-scrollbar relative">
              {/* Line Numbers Simulation */}
              <div className="absolute top-0 left-0 bottom-0 w-8 bg-[#0f172a] border-r border-slate-800/50 text-right pr-2 pt-4 text-slate-700 text-[10px] font-mono select-none">
                {selectedFile.content?.split('\n').map((_, i) => (
                  <div key={i} className="leading-5">{i + 1}</div>
                ))}
              </div>
              
              <pre className="text-[11px] font-mono text-slate-300 leading-5 pt-4 pl-10 pb-4 tab-4">
                <code dangerouslySetInnerHTML={{ 
                  __html: (selectedFile.content || "# Binary file or empty")
                    .replace(/import/g, '<span class="text-purple-400">import</span>')
                    .replace(/from/g, '<span class="text-purple-400">from</span>')
                    .replace(/class /g, '<span class="text-blue-400">class </span>')
                    .replace(/def /g, '<span class="text-blue-400">def </span>')
                    .replace(/return/g, '<span class="text-purple-400">return</span>')
                    .replace(/print/g, '<span class="text-yellow-300">print</span>')
                    .replace(/#.*/g, '<span class="text-green-600">$&</span>')
                    .replace(/"(.*?)"/g, '<span class="text-orange-300">"$&"</span>')
                }} />
              </pre>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600 bg-[#0f172a]">
            <div className="text-center">
              <FileCode size={48} className="mx-auto mb-2 opacity-20" />
              <p className="text-xs">Select a file to view source</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectArchitecture;