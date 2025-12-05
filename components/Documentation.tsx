import React from 'react';
import { Shield, BookOpen, Activity, AlertTriangle, Database, Cpu, Layers, History } from 'lucide-react';

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
        <h1 className="text-3xl font-bold text-white mb-2">Documentación Técnica</h1>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Sentinela Aburrá v3.1 - Arquitectura Auto-Calibrada</p>
      </div>

      <DocSection title="1. Lógica de Riesgo Auto-Calibrada" icon={<Activity size={20} />}>
        <p>
          El sistema ha evolucionado de umbrales fijos a una <strong>calibración dinámica basada en la historia</strong>. Esto asegura que el "Riesgo 100%" siempre represente el "Peor Escenario Conocido" en los datos de entrenamiento.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
          <div className="bg-slate-900 p-4 rounded border border-slate-800">
            <h4 className="text-blue-400 font-bold text-xs mb-2 uppercase">Riesgo del Modelo (Volumen)</h4>
            <code className="block bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-300 mb-2">
              (Volumen_Predicho / Max_Volumen_Histórico) * 100
            </code>
            <p className="text-[10px] text-slate-500">
              Compara la predicción actual contra el volumen de crímenes más alto jamás registrado en el dataset.
            </p>
          </div>

          <div className="bg-slate-900 p-4 rounded border border-slate-800">
            <h4 className="text-purple-400 font-bold text-xs mb-2 uppercase">Riesgo de Zona (Actividad)</h4>
            <code className="block bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-300 mb-2">
              (Menciones_Actuales / Max_Actividad_Zona_Histórica) * 100
            </code>
            <p className="text-[10px] text-slate-500">
              En lugar de usar un número fijo (ej. 10), el sistema busca en el pasado: "¿Cuál fue la semana más violenta de cualquier barrio?". Si ese récord fue 50 menciones, entonces 50 menciones hoy equivalen al 100% de riesgo.
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-800/50 rounded text-center border border-slate-700">
          <span className="text-white font-bold text-sm">Riesgo Global = MAX( Riesgo_Modelo, Riesgo_Zona )</span>
        </div>
      </DocSection>

      <DocSection title="2. Motor de Inferencia & Data Scarcity" icon={<Cpu size={20} />}>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-bold text-xs flex items-center gap-2"><History size={14}/> Reconstrucción de Ventanas</h4>
            <p className="text-xs text-slate-400">
              El modelo de Series Temporales requiere mirar hacia atrás X días (Horizonte). En inferencia, el sistema reconstruye esta "mirada al pasado" usando los datos nuevos subidos por el usuario.
            </p>
          </div>
          <div className="bg-amber-900/10 border border-amber-900/30 p-3 rounded">
            <h4 className="text-amber-200 font-bold text-xs flex items-center gap-2"><AlertTriangle size={14}/> Advertencia de Datos Insuficientes</h4>
            <p className="text-xs text-amber-500/80 mt-1">
              Si subes un dataset con una historia muy corta (ej. 3 días) para un modelo que requiere 7 días de horizonte, la predicción matemática será técnicamente posible pero estadísticamente débil (subestimada). El sistema detectará esto y mostrará una alerta de precaución en el dashboard.
            </p>
          </div>
        </div>
      </DocSection>

      <DocSection title="3. Datos de Entrada" icon={<Database size={20} />}>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-bold text-xs mb-2">Formato CSV Requerido</h4>
            <code className="block bg-slate-950 p-3 rounded text-[9px] font-mono text-slate-300 mb-2 overflow-x-auto">
              Date,Source,Type,Headline,Snippet,Relevance<br/>
              2025-12-01,Perplexity,TRIGGER_EVENT,Captura en Manrique,Leader arrested...,0.85<br/>
              2025-12-02,News,CRIME_STAT,Homicidios Barrio Obrero,3 victims...,0.92
            </code>
            <p className="text-[10px] text-slate-500">
              Requiere: Date (ISO), Source, Type (TRIGGER_EVENT|CRIME_STAT), Headline, Snippet, Relevance (0-1).
            </p>
          </div>
          <div className="bg-slate-900 p-3 rounded border border-slate-800">
            <h4 className="text-white font-bold text-xs mb-1">Parámetros de Configuración</h4>
            <ul className="text-[9px] text-slate-400 space-y-1">
              <li><strong>Forecast Horizon (días):</strong> Cuán lejos en el futuro predecir (7, 14, 30, 90, etc.)</li>
              <li><strong>Granularidad:</strong> Escala temporal de agregación (D=Diaria, W=Semanal, M=Mensual)</li>
              <li><strong>Historical Scope (días):</strong> Cuánto pasado usar para entrenar el modelo</li>
            </ul>
          </div>
        </div>
      </DocSection>

      <DocSection title="4. Arquitectura del Pipeline" icon={<Layers size={20} />}>
        <div className="space-y-3 text-[10px]">
          <div className="bg-slate-900 p-3 rounded border border-slate-800">
            <p className="text-blue-300 font-bold mb-1">📥 ENTRENAMIENTO</p>
            <ol className="text-slate-400 space-y-1 ml-3">
              <li>1. Análisis histórico: busca el máximo volumen y máxima actividad de zona</li>
              <li>2. Feature engineering temporal con ventanas móviles</li>
              <li>3. Entrenamiento multi-modelo (RF + XGBoost)</li>
              <li>4. Persistencia de benchmarks para inferencia</li>
            </ol>
          </div>
          <div className="bg-slate-900 p-3 rounded border border-slate-800">
            <p className="text-purple-300 font-bold mb-1">🔮 INFERENCIA</p>
            <ol className="text-slate-400 space-y-1 ml-3">
              <li>1. Carga de modelo y metadata de calibración</li>
              <li>2. Detección de data scarcity (alerta si datos insuficientes)</li>
              <li>3. Normalización dinámica contra benchmarks históricos</li>
              <li>4. Retorno de riesgo desglosado (modelo + zona)</li>
            </ol>
          </div>
        </div>
      </DocSection>

      <DocSection title="5. Zona Glossary" icon={<BookOpen size={20} />}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-400">
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">1</span> Manrique</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">2</span> Aranjuez</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">3</span> Bello</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">4</span> Robledo</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">5</span> San Javier</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">6</span> Villa Hermosa</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">7</span> Belén</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">8</span> La Candelaria</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">9</span> La América</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">10</span> Castilla</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">11</span> Doce de Octubre</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">12</span> Buenos Aires</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">13</span> Poblado</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">14</span> Guayabal</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">15</span> Itagüí</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800"><span className="text-blue-400 font-bold">16</span> Envigado</div>
        </div>
      </DocSection>
    </div>
  );
};

export default Documentation;
