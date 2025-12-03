import React from 'react';
import { FileText, Database, Cpu, Activity, GitBranch, BookOpen } from 'lucide-react';

const DocSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="mb-10 border-b border-slate-800 pb-8 last:border-0">
    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
      <div className="p-2 bg-slate-900 rounded-lg border border-slate-700 text-blue-400">
        {icon}
      </div>
      {title}
    </h2>
    <div className="text-slate-400 text-sm leading-relaxed space-y-4 text-justify">
      {children}
    </div>
  </div>
);

const Documentation = () => {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 shadow-2xl h-full overflow-y-auto custom-scrollbar">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Technical Documentation</h1>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Sentinela Aburrá System Architecture v2.5</p>
      </div>

      <DocSection title="Dashboard Glossary" icon={<BookOpen size={20} />}>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded border border-slate-800">
            <h4 className="text-white font-bold text-xs mb-2">Predictor Variables (X)</h4>
            <p className="text-xs">Also known as "Trigger Events". These are the input signals defined in configuration (e.g., "Capture of a Leader"). The scraping module searches specifically for these events.</p>
          </div>
          <div className="bg-slate-900 p-4 rounded border border-slate-800">
            <h4 className="text-white font-bold text-xs mb-2">Target Variables (Y)</h4>
            <p className="text-xs">The outcome we are trying to predict. These are scraped from crime reports (e.g., "Homicide Increase"). The model learns the time-lag between X and Y.</p>
          </div>
          <div className="bg-slate-900 p-4 rounded border border-slate-800">
            <h4 className="text-white font-bold text-xs mb-2">Risk Index</h4>
            <p className="text-xs">A normalized score (0-100) indicating the probability of a violence outbreak. 0-40: Stable, 41-70: High Risk, 71-100: Critical.</p>
          </div>
          <div className="bg-slate-900 p-4 rounded border border-slate-800">
            <h4 className="text-white font-bold text-xs mb-2">C01 - C16</h4>
            <p className="text-xs">Codes representing the "Comunas" (Communes) of Medellín. Refer to the map sidebar for the full name list (e.g., C13 = San Javier).</p>
          </div>
        </div>
      </DocSection>

      <DocSection title="1. Intelligent Scraping & NLP Pipeline" icon={<Database size={20} />}>
        <p>
          The system utilizes a targeted scraping approach combined with Large Language Models (LLMs) to extract structured intelligence from unstructured news sources.
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-2 mb-4 bg-slate-900/50 p-4 rounded border border-slate-800">
          <li><strong>Step 1 (Discovery):</strong> The system queries search engines using specific operators (e.g., `site:minuto30.com "Clan del Golfo"`) to find relevant articles within the user-defined date range.</li>
          <li><strong>Step 2 (Extraction):</strong> Content is extracted from the HTML, focusing on the article body where key details reside.</li>
          <li><strong>Step 3 (NLP Analysis):</strong> A Gemini 2.5 Flash model analyzes the text to identify:
            <ul className="list-disc pl-5 mt-1 text-slate-500">
              <li><strong>Entities:</strong> Specific criminal organizations and aliases.</li>
              <li><strong>Ranks:</strong> Hierarchical roles (e.g., "Cabecilla", "Sicario").</li>
              <li><strong>Context:</strong> The nature of the event (Capture, Death, Confrontation).</li>
            </ul>
          </li>
        </ul>
      </DocSection>

      <DocSection title="2. Violence Risk Index Calculation" icon={<Activity size={20} />}>
        <p>
          The <strong>Violence Risk Index (0-100)</strong> is a heuristic score that quantifies the potential for instability based on the gathered intelligence. It is NOT a simple count of news articles.
        </p>
        <div className="my-4 bg-slate-900 p-4 rounded border border-slate-800">
          <h4 className="text-white font-bold text-xs mb-2">Calculation Formula</h4>
          <code className="block font-mono text-[10px] text-blue-400 mb-2">
            Risk = Base(40) + OrgFactor + RankFactor + VolumeFactor
          </code>
          <ul className="space-y-2 text-xs text-slate-400">
            <li><span className="text-white">Base Risk (40):</span> The baseline instability of the region.</li>
            <li><span className="text-white">OrgFactor (+5 to +30):</span> Presence of high-threat organizations (e.g., Clan del Golfo adds more risk than a local gang).</li>
            <li><span className="text-white">RankFactor (+5 to +20):</span> High-profile targets (Cabecillas) trigger higher risk scores than low-level arrests.</li>
            <li><span className="text-white">VolumeFactor (+0 to +10):</span> Higher frequency of recent news reports increases confidence in the risk assessment.</li>
          </ul>
        </div>
        <p>
          <strong>Interpretation:</strong>
          <br />
          <span className="text-green-500">0-40 (Low):</span> Routine police activity.
          <br />
          <span className="text-orange-500">41-70 (Elevated):</span> Significant blows to command structures. Expect realignment.
          <br />
          <span className="text-red-500">71-100 (Critical):</span> Power vacuums detected. High probability of retaliatory violence or turf wars.
        </p>
      </DocSection>

      <DocSection title="3. Predictive Modeling" icon={<Cpu size={20} />}>
        <p>
          The system uses a hybrid approach. While the Risk Index is heuristic, the <strong>Predictive Engine</strong> uses the structured data to forecast:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2 font-mono text-xs">
          <li><span className="text-blue-400">Expected Crime Type:</span> The most likely form of reaction (e.g., Homicide vs. Displacement).</li>
          <li><span className="text-blue-400">Affected Zones:</span> Neighborhoods historically controlled by the disrupted organization.</li>
          <li><span className="text-blue-400">Duration:</span> Estimated time until stability returns.</li>
        </ul>
      </DocSection>

      <DocSection title="4. Data Integrity" icon={<GitBranch size={20} />}>
        <p>
          To ensure accuracy, the system filters out:
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2 text-xs text-slate-400">
          <li>Articles with low relevance scores ({'<'} 0.15).</li>
          <li>Duplicate reports of the same event.</li>
          <li>Content outside the specified date range.</li>
        </ul>
        <p className="mt-2">
          The "Cleaning Report" in the Data Preview stage provides full transparency on how many records were processed and how many were discarded.
        </p>
      </DocSection>
    </div>
  );
};

export default Documentation;