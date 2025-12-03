import React from 'react';
import { Shield, BookOpen, Activity, AlertTriangle, FileText, Search, Database, Brain, Code, Cpu, GitBranch } from 'lucide-react';

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
            <p className="text-xs">A normalized score (0-100) indicating the probability of a violence outbreak. 0-30: Stable, 31-70: High Risk, 71-100: Critical.</p>
          </div>
          <div className="bg-slate-900 p-4 rounded border border-slate-800">
            <h4 className="text-white font-bold text-xs mb-2">C01 - C16</h4>
            <p className="text-xs">Codes representing the "Comunas" (Communes) of Medellín. See the Glossary below for the full list.</p>
          </div>
        </div>
      </DocSection>

      <DocSection title="Zone Glossary" icon={<BookOpen size={20} />}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-400">
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">C01</span> Popular</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">C02</span> Santa Cruz</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">C03</span> Manrique</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">C04</span> Aranjuez</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">C05</span> Castilla</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">C06</span> Doce de Octubre</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">C07</span> Robledo</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">C08</span> Villa Hermosa</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">C09</span> Buenos Aires</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">C10</span> La Candelaria</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">C11</span> Laureles</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">C12</span> La América</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">C13</span> San Javier</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">C14</span> Poblado</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">C15</span> Guayabal</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">C16</span> Belén</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">BEL</span> Bello</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">ITA</span> Itagüí</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">ENV</span> Envigado</div>
        </div>
      </DocSection>

      <DocSection title="1. Intelligent Scraping & NLP Pipeline" icon={<Database size={20} />}>
        <p>
          The system utilizes a targeted scraping approach combined with Large Language Models (LLMs) to extract structured intelligence from unstructured news sources.
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-2 mb-4 bg-slate-900/50 p-4 rounded border border-slate-800">
          <li><strong>Step 1 (Discovery):</strong> The system queries search engines using specific operators (e.g., `site: minuto30.com "Clan del Golfo"`) to find relevant articles within the user-defined date range.</li>
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
            <li><span className="text-white">OrgFactor (+5 to +30):</span> Determined by the organization's threat tier.
              <ul className="list-disc pl-4 mt-1 text-[10px] text-slate-500">
                <li><strong>Tier 1 (+15):</strong> Transnational/National threat (e.g., Clan del Golfo, Tren de Aragua).</li>
                <li><strong>Tier 2 (+5):</strong> Local/Regional threat (e.g., La Terraza, Los Chatas).</li>
              </ul>
            </li>
            <li><span className="text-white">RankFactor (+5 to +20):</span> Based on the hierarchy of the target.
              <ul className="list-disc pl-4 mt-1 text-[10px] text-slate-500">
                <li><strong>Cabecilla (+15):</strong> Strategic leader. High impact on command and control.</li>
                <li><strong>Coordinador (+10):</strong> Mid-level manager. Tactical impact.</li>
                <li><strong>Sicario/Jíbaro (+5):</strong> Operational level. Low strategic impact.</li>
              </ul>
            </li>
            <li><span className="text-white">VolumeFactor (+0 to +10):</span> Normalized score based on news frequency. 50+ articles = Max score.</li>
          </ul>
        </div>
        <p>
          <strong>Interpretation:</strong>
          <br />
          <span className="text-green-500">0-30 (Low):</span> Routine police activity.
          <br />
          <span className="text-orange-500">31-70 (Elevated):</span> Significant blows to command structures. Expect realignment.
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

      <DocSection title="Dashboard Metrics Explained" icon={<Activity size={20} />}>
        <div className="space-y-4 text-xs text-slate-400">
          <div>
            <h4 className="text-white font-bold mb-1">Violence Risk Index</h4>
            <p>A composite score (0-100) indicating the current stability of the region.
              <br /><strong>0-30 (Low):</strong> Routine police activity.
              <br /><strong>31-70 (Elevated):</strong> Increased gang movement or specific threats detected.
              <br /><strong>71-100 (Critical):</strong> High probability of violent confrontation or major criminal event.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-1">Primary Predicted Crime</h4>
            <p>The specific type of criminal activity most likely to occur based on the analyzed patterns (e.g., "Homicidio", "Extorsión"). This is derived from the frequency of keywords associated with each crime type in the high-risk articles.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-1">Forecast Duration</h4>
            <p>The validity window of the prediction (e.g., 7 days). This is calculated based on the "decay rate" of the news relevance—how quickly the intelligence becomes stale.</p>
          </div>
        </div>
      </DocSection>

      <DocSection title="Training Process Details" icon={<Code size={20} />}>
        <div className="space-y-2 text-xs text-slate-400">
          <p>The model training involves several rigorous steps to ensure accuracy:</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li><strong>Data Ingestion:</strong> Raw articles are scraped from verified sources.</li>
            <li><strong>Cleaning & Filtering:</strong> Articles are scored for relevance. Items with score &lt; 0.15 are <strong>discarded</strong> to prevent noise. Duplicates are removed.</li>
            <li><strong>Feature Extraction:</strong> NLP algorithms extract entities (Orgs, Ranks) and sentiment.</li>
            <li><strong>Vectorization:</strong> Text is converted into numerical vectors for the model.</li>
            <li><strong>Training Split:</strong> Data is split into Training (80%) and Validation (20%) sets.</li>
            <li><strong>Model Fitting:</strong> The XGBoost classifier learns patterns from the Training set.</li>
            <li><strong>Validation:</strong> The model is tested against the Validation set to generate the Confusion Matrix (Accuracy/Precision).</li>
          </ol>
        </div>
      </DocSection>
    </div>
  );
};

export default Documentation;