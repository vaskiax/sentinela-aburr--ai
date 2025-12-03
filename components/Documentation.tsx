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

      <DocSection title="1. Deep Web Scraping Architecture" icon={<Database size={20} />}>
        <p>
          The data acquisition layer is designed to use a custom <strong>Scrapy</strong> spider (`MedellinOmniSpider`) for deep content extraction. Unlike simple RSS readers that only analyze headlines, this architecture is specified to perform a <strong>Level 2 Depth Crawl</strong>.
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-2 mb-4 bg-slate-900/50 p-4 rounded border border-slate-800">
          <li><strong>Step 1 (Discovery):</strong> The spider utilizes Google Search Operators (Dorking) specifically targeting local domains (e.g., `site:minuto30.com "La Terraza"`) to bypass poor internal search engines of news sites.</li>
          <li><strong>Step 2 (Traversal):</strong> It does not stop at the search result page. The spider follows the `href` of every relevant article to access the full DOM tree of the news story.</li>
          <li><strong>Step 3 (Extraction):</strong> Inside the article, XPaths are used to extract the `article-body` or `entry-content`. This full text is critical because criminal ranks (e.g., "Cabecilla", "Coordinador") are rarely in the headline but often mentioned in the third or fourth paragraph of the report.</li>
          <li><strong>Step 4 (Temporal Filtering):</strong> A strict filter rejects articles outside the user-defined range (e.g., 2010-Present) using metadata analysis (`meta[property='article:published_time']`).</li>
        </ul>
      </DocSection>

      <DocSection title="2. NLP & Entity Characterization" icon={<Cpu size={20} />}>
        <p>
          Once raw text is acquired, it is passed to the <strong>Gemini 2.5 Flash</strong> model via the API. We do not perform simple keyword matching. Instead, we use a <strong>Named Entity Recognition (NER)</strong> pipeline with a strict schema.
        </p>
        <div className="grid grid-cols-2 gap-4 my-4">
          <div className="bg-slate-900 p-3 rounded border border-slate-800">
            <h4 className="text-white font-bold text-xs mb-2">Input (Raw Text)</h4>
            <p className="font-mono text-[10px] text-slate-500">"...alias 'El Gomelo', quien fungía como coordinador de sicarios para La Terraza, fue neutralizado ayer..."</p>
          </div>
          <div className="bg-blue-900/10 p-3 rounded border border-blue-900/50">
            <h4 className="text-blue-300 font-bold text-xs mb-2">Output (Structured JSON)</h4>
            <pre className="font-mono text-[10px] text-blue-400">
              {`{
  "alias": "El Gomelo",
  "rank": "COORDINADOR",
  "role": "Jefe de Sicarios",
  "org": "La Terraza",
  "status": "NEUTRALIZED"
}`}
            </pre>
          </div>
        </div>
        <p>
          This categorization allows the model to differentiate between the capture of a low-level dealer ("Jíbaro") and a high-value target ("Cabecilla"). The impact on the <strong>Violence Risk Score</strong> is weighted differently based on this specific field extraction.
        </p>
      </DocSection>

      <DocSection title="3. Predictive Modeling (XGBoost)" icon={<Activity size={20} />}>
        <p>
          The core prediction engine is an <strong>XGBoost Classifier</strong> trained on historical correlations between "Trigger Events" (Captures/Deaths) and "Response Events" (Homicides/Displacement).
        </p>
        <p>
          <strong>Target Variable (Y):</strong> defined as a binary flag `violence_surge` (1 or 0). A "1" is labeled if the homicide rate in a specific Comuna increases by {'>'}15% in the 14 days following a Trigger Event.
        </p>
        <p className="mt-2 font-semibold text-slate-300">Feature Vector (X) Components:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2 font-mono text-xs">
          <li><span className="text-blue-400">rank_weight (Float):</span> 1.0 for Cabecilla, 0.7 for Coordinador, 0.3 for Sicario.</li>
          <li><span className="text-blue-400">org_influence (Float):</span> Historical power index of the organization (e.g., Clan del Golfo = 0.95).</li>
          <li><span className="text-blue-400">territory_volatility (Float):</span> Calculated variance of homicide rates in the specific zone (C01, C02, etc.) over the last 365 days.</li>
          <li><span className="text-blue-400">status_impact (Float):</span> Weight modifier (Death {'>'} Capture).</li>
        </ul>
      </DocSection>

      <DocSection title="4. Source Traceability & Validation" icon={<GitBranch size={20} />}>
        <p>
          To prevent hallucination, every data point in the system is linked to a <strong>Source Hash</strong>.
        </p>
        <p>
          During the scraping phase, the URL, Title, and Date are hashed. If the system cannot resolve a 200 OK status from the URL, the record is flagged as `UNVERIFIED` and excluded from the training set. The URLs provided in the Data Preview are constructed from real domain patterns (e.g., {`minuto30.com/judicial/{YYYY}/{MM}/{slug}`}) to ensure they correspond to valid site structures, though actual availability depends on the publisher's archives.
        </p>
      </DocSection>
    </div>
  );
};

export default Documentation;