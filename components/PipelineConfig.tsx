import React, { useState, useEffect } from 'react';
import { ScrapingConfig } from '../types';
import { MASTER_PREDICTOR_EVENTS, MASTER_PREDICTOR_RANKS, MASTER_TARGET_CRIMES, MASTER_ORGS_MAJOR, MASTER_COMBOS_EXTENDED } from '../constants';
import { Check, Search, Calendar, CheckSquare, Square, Fingerprint, Target } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  config: ScrapingConfig;
  setConfig: React.Dispatch<React.SetStateAction<ScrapingConfig>>;
  onStartPipeline: () => void;
}

const SelectionGroup: React.FC<{
  title: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  onSelectAll: (select: boolean) => void;
  colorClass: string;
  searchable?: boolean;
}> = ({ title, items, selected, onToggle, onSelectAll, colorClass, searchable }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = searchable
    ? items.filter(i => i.toLowerCase().includes(searchTerm.toLowerCase()))
    : items;

  const displayItems = searchable && searchTerm === ''
    ? filteredItems.slice(0, 20)
    : filteredItems;

  const allSelected = items.length > 0 && items.every(i => selected.includes(i));

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {title} <span className="ml-2 text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{selected.length} Selected</span>
        </h3>
        <button
          onClick={() => onSelectAll(!allSelected)}
          className="text-[10px] flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
        >
          {allSelected ? <CheckSquare size={12} /> : <Square size={12} />}
          <span className="sr-only">Select All</span>
        </button>
      </div>

      {searchable && (
        <div className="relative mb-2">
          <Search size={12} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={`Search...`}
            className="w-full bg-slate-900 border border-slate-700 rounded py-1.5 pl-7 pr-2 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scrollbar">
        {displayItems.map(item => {
          const isSelected = selected.includes(item);
          return (
            <button
              key={item}
              onClick={() => onToggle(item)}
              className={`text-[10px] px-2 py-1 rounded border transition-all duration-200 flex items-center gap-1 ${isSelected
                ? `${colorClass} text-white font-medium shadow-sm`
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                }`}
            >
              {isSelected && <Check size={8} strokeWidth={4} />}
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const PipelineConfig: React.FC<Props> = ({ config, setConfig, onStartPipeline }) => {
  const [options, setOptions] = useState<{ organizations: string[]; ranks: string[]; combos: string[]; barrios: string[]; comunas: string[] }>({
    organizations: [],
    ranks: [],
    combos: [],
    barrios: [],
    comunas: []
  });
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const data = await api.getOptions();
        // Fallbacks if backend returns empty lists
        setOptions({
          organizations: (data.organizations && data.organizations.length > 0) ? data.organizations : MASTER_ORGS_MAJOR,
          ranks: (data.ranks && data.ranks.length > 0) ? data.ranks : MASTER_PREDICTOR_RANKS,
          combos: (data.combos && data.combos.length > 0) ? data.combos : MASTER_COMBOS_EXTENDED,
          barrios: data.barrios || [],
          comunas: data.comunas || []
        });
      } catch (e) {
        console.error("Failed to load options", e);
        // On error, use local master lists to keep UI usable
        setOptions({
          organizations: MASTER_ORGS_MAJOR,
          ranks: MASTER_PREDICTOR_RANKS,
          combos: MASTER_COMBOS_EXTENDED,
          barrios: [],
          comunas: []
        });
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  // Handlers for Predictors
  const toggleOrg = (item: string) => {
    setConfig(prev => ({ ...prev, target_organizations: prev.target_organizations.includes(item) ? prev.target_organizations.filter(i => i !== item) : [...prev.target_organizations, item] }));
  };
  const toggleCombo = (item: string) => {
    setConfig(prev => ({ ...prev, local_combos: prev.local_combos.includes(item) ? prev.local_combos.filter(i => i !== item) : [...prev.local_combos, item] }));
  };
  const toggleEvent = (item: string) => {
    setConfig(prev => ({ ...prev, predictor_events: prev.predictor_events.includes(item) ? prev.predictor_events.filter(i => i !== item) : [...prev.predictor_events, item] }));
  };
  const toggleRank = (item: string) => {
    setConfig(prev => ({ ...prev, predictor_ranks: prev.predictor_ranks.includes(item) ? prev.predictor_ranks.filter(i => i !== item) : [...prev.predictor_ranks, item] }));
  };

  // Handlers for Targets
  const toggleTarget = (item: string) => {
    setConfig(prev => ({ ...prev, target_crimes: prev.target_crimes.includes(item) ? prev.target_crimes.filter(i => i !== item) : [...prev.target_crimes, item] }));
  };

  // Select All Handlers
  const selectAllOrgs = (s: boolean) => {
    const orgItems = options.organizations.length > 0 ? options.organizations : MASTER_ORGS_MAJOR;
    setConfig(prev => ({ ...prev, target_organizations: s ? orgItems : [] }));
  };
  const selectAllCombos = (s: boolean) => {
    const comboItems = options.combos.length > 0 ? options.combos : MASTER_COMBOS_EXTENDED;
    setConfig(prev => ({ ...prev, local_combos: s ? comboItems : [] }));
  };
  const selectAllEvents = (s: boolean) => setConfig(prev => ({ ...prev, predictor_events: s ? MASTER_PREDICTOR_EVENTS : [] }));
  const selectAllRanks = (s: boolean) => setConfig(prev => ({ ...prev, predictor_ranks: s ? MASTER_PREDICTOR_RANKS : [] }));
  const selectAllTargets = (s: boolean) => setConfig(prev => ({ ...prev, target_crimes: s ? MASTER_TARGET_CRIMES : [] }));

  // Log config changes to verify state updates
  useEffect(() => {
    console.log('[PipelineConfig] Config changed:', {
      orgs: config.target_organizations.length,
      combos: config.local_combos.length,
      events: config.predictor_events,
      ranks: config.predictor_ranks,
      crimes: config.target_crimes
    });
  }, [config]);

  const isValid = config.predictor_events.length > 0 && config.predictor_ranks.length > 0 && config.target_crimes.length > 0;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-2xl h-full flex flex-col">
      <div className="mb-4 border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white mb-1">Model Configuration</h2>
        <p className="text-sm text-slate-400">Define Predictor Variables (Triggers) and Target Variables (Crimes to Forecast).</p>
      </div>

      {/* Date Range - Global */}
      <div className="mb-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-blue-400" />
          <span className="text-xs font-bold text-slate-300">Historical Scope:</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={config.date_range_start}
            onChange={(e) => setConfig(prev => ({ ...prev, date_range_start: e.target.value }))}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-blue-500"
          />
          <span className="text-slate-600 text-xs">to Present</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-2 gap-6">

        {/* LEFT COLUMN: PREDICTORS (X) */}
        <div className="flex flex-col gap-4">
          <div className="bg-blue-900/10 border border-blue-900/30 p-3 rounded-lg">
            <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2 mb-4">
              <Fingerprint size={16} /> 1. PREDICTOR VARIABLES (X)
            </h3>
            <p className="text-[10px] text-blue-400/70 mb-4 leading-tight">
              Select "Trigger Events" that the model uses to forecast violence. E.g., "Capture of a Leader".
            </p>

            <SelectionGroup
              title="Event Type"
              items={MASTER_PREDICTOR_EVENTS}
              selected={config.predictor_events}
              onToggle={toggleEvent}
              onSelectAll={selectAllEvents}
              colorClass="bg-blue-600 border-blue-500"
            />

            <SelectionGroup
              title="Rank Filter (Filters)"
              items={options.ranks.length > 0 ? options.ranks : MASTER_PREDICTOR_RANKS}
              selected={config.predictor_ranks}
              onToggle={toggleRank}
              onSelectAll={selectAllRanks}
              colorClass="bg-indigo-500 border-indigo-400"
            />

            <div className="border-t border-blue-900/30 pt-4 mt-2">
              <p className="text-[10px] text-slate-500 mb-2 font-mono uppercase">Scope (Who)</p>
              <SelectionGroup
                title="Major Structures"
                items={options.organizations.length > 0 ? options.organizations : MASTER_ORGS_MAJOR}
                selected={config.target_organizations}
                onToggle={toggleOrg}
                onSelectAll={selectAllOrgs}
                colorClass="bg-slate-700 border-slate-600"
              />
              <SelectionGroup
                title="Local Combos"
                items={options.combos.length > 0 ? options.combos : MASTER_COMBOS_EXTENDED}
                selected={config.local_combos}
                onToggle={toggleCombo}
                onSelectAll={selectAllCombos}
                colorClass="bg-slate-700 border-slate-600"
                searchable={true}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TARGETS (Y) */}
        <div className="flex flex-col gap-4">
          <div className="bg-red-900/10 border border-red-900/30 p-3 rounded-lg h-full">
            <h3 className="text-sm font-bold text-red-300 flex items-center gap-2 mb-4">
              <Target size={16} /> 2. TARGET VARIABLES (Y)
            </h3>
            <p className="text-[10px] text-red-400/70 mb-4 leading-tight">
              Select the specific crime indicators you want to predict. E.g., "Increase in Homicides".
            </p>

            <SelectionGroup
              title="Crime Indicators"
              items={MASTER_TARGET_CRIMES}
              selected={config.target_crimes}
              onToggle={toggleTarget}
              onSelectAll={selectAllTargets}
              colorClass="bg-red-600 border-red-500"
            />
          </div>
        </div>

      </div>

      <div className="mt-6 pt-4 border-t border-slate-800">
        <button
          onClick={onStartPipeline}
          disabled={!isValid}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 rounded-lg font-bold shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search size={18} />
          START DUAL-STREAM SCRAPING (X & Y)
        </button>
        {!isValid && <p className="text-center text-xs text-red-400 mt-2">Please select at least one Predictor Event, one Rank, and one Target Crime.</p>}
      </div>
    </div>
  );
};

export default PipelineConfig;