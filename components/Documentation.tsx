import React, { useState } from 'react';
import { Shield, BookOpen, Activity, AlertTriangle, Database, Cpu, Layers, History, ChevronDown, Lightbulb, TrendingUp, Users, Settings, HelpCircle, Code } from 'lucide-react';

const DocSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="mb-6 border border-slate-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-950 rounded border border-slate-700 text-blue-400">
            {icon}
          </div>
          <h2 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">{title}</h2>
        </div>
        <ChevronDown size={16} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-slate-950 text-slate-400 text-sm leading-relaxed space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

const Documentation = () => {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 shadow-2xl h-full overflow-y-auto custom-scrollbar">
      <div className="mb-10 pb-6 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-white mb-2">Documentación Sentinela Aburrá</h1>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">v3.1 · Predicción de Riesgo Criminal · Auto-Calibrada</p>
        <p className="text-xs text-slate-400 mt-3">Sistema inteligente que predice riesgo basado en patrones de actividad precursora, no predicción determinística de crímenes.</p>
      </div>

      {/* 1. FILOSOFÍA CORE */}
      <DocSection title="1. Filosofía Core del Sistema" icon={<Lightbulb size={20} />} defaultOpen={true}>
        <div className="space-y-4">
          <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
            <h4 className="text-blue-300 font-bold text-sm mb-2">Premisa Fundamental</h4>
            <p className="text-xs text-blue-200">
              <strong>No predecimos crímenes específicos.</strong> Predecimos <strong>riesgo relativo</strong> basado en indicadores de actividad precursora (movimiento de bandas, menciones en medios, captura de líderes, etc). El riesgo es una probabilidad comparativa, no una profecía.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900 rounded border border-slate-800">
              <h4 className="text-emerald-400 font-bold text-xs mb-2 uppercase">✓ Lo que SÍ hacemos</h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• Detectar cambios en patrones históricos</li>
                <li>• Cuantificar "qué tan anómalo es hoy"</li>
                <li>• Comparar contra el peor escenario conocido</li>
                <li>• Alimentar tomas de decisión operacional</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-900 rounded border border-slate-800">
              <h4 className="text-red-400 font-bold text-xs mb-2 uppercase">✗ Lo que NO hacemos</h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• Predecir crímenes específicos</li>
                <li>• Garantizar que ocurrirá violencia</li>
                <li>• Usar umbrales fijos (siempre "100%")</li>
                <li>• Funcionar sin datos históricos</li>
              </ul>
            </div>
          </div>

          <div className="p-3 bg-slate-800/50 rounded text-center border border-slate-700">
            <span className="text-white font-bold text-sm">Riesgo 100% = Peor Escenario Histórico Conocido</span>
          </div>
        </div>
      </DocSection>

      {/* 2. PIPELINE DE ANÁLISIS */}
      <DocSection title="2. Pipeline de Análisis (4 Fases)" icon={<Layers size={20} />} defaultOpen={true}>
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-blue-300 font-bold text-xs mb-2 flex items-center gap-2">📥 FASE 1: INGESTA DE DATOS</h4>
            <p className="text-xs text-slate-400 mb-2">Usuario sube CSV con histórico de eventos (TRIGGER_EVENT, CRIME_STAT). Sistema valida formato y almacena en memoria.</p>
            <code className="block bg-slate-950 p-2 rounded text-[9px] font-mono text-slate-300 mb-1 overflow-x-auto">
              Date | Source | Type | Headline | Relevance | URL
            </code>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-purple-300 font-bold text-xs mb-2 flex items-center gap-2">🔍 FASE 2: NLP & EXTRACCIÓN DE ENTIDADES</h4>
            <p className="text-xs text-slate-400 mb-2">Motor DeepSeek/Perplexity extrae organizaciones criminales (combos/bandas), barrios, y contexto. Normaliza nombres contra CSV de referencia (combos_v2.csv).</p>
            <div className="text-[9px] text-slate-300 space-y-1 ml-2">
              <p><strong>Input:</strong> "Captura de Los Urabeños en Manrique por control de ruta"</p>
              <p><strong>Output:</strong> Banda=Urabeños, Barrio=Manrique, Tipo=Leadership_Disruption</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-yellow-300 font-bold text-xs mb-2 flex items-center gap-2">⚙️ FASE 3: FEATURE ENGINEERING & VENTANAS TEMPORALES</h4>
            <p className="text-xs text-slate-400 mb-2">Construye características usando ventanas móviles (últimos X días). Calcula máximos históricos para calibración.</p>
            <div className="text-[9px] text-slate-300 ml-2 space-y-1">
              <p><strong>Características:</strong> volumen_7d, actividad_zona_14d, recency, frequency, max_relevance_30d</p>
              <p><strong>Calibración:</strong> max_volumen_histórico, max_actividad_zona, fecha_baseline</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-green-300 font-bold text-xs mb-2 flex items-center gap-2">🎯 FASE 4: ML TRAINING & PREDICCIÓN</h4>
            <p className="text-xs text-slate-400 mb-2">Entrena 3 modelos (RandomForest, XGBoost, LightGBM) en ventanas de 7/14/30 días. Ensambla predicciones. Genera métricas (RMSE, R², MAE).</p>
            <div className="text-[9px] text-slate-300 ml-2">
              <strong>Output:</strong> Predicción de volumen agregado + desglose por zona + intervalo de confianza
            </div>
          </div>
        </div>
      </DocSection>

      {/* 3. SEMÁFORO / CÁLCULO DE RIESGO */}
      <DocSection title="3. Semáforo & Cálculo de Riesgo" icon={<Activity size={20} />} defaultOpen={true}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900 rounded border border-slate-800">
              <h4 className="text-blue-400 font-bold text-xs mb-2 uppercase">📊 Riesgo del Modelo (Volumen)</h4>
              <code className="block bg-slate-950 p-2 rounded text-[9px] font-mono text-slate-300 mb-2">
                (Predicción_Volumen / Max_Volumen) * 100
              </code>
              <p className="text-xs text-slate-400">
                Compara predicción contra el volumen más alto jamás registrado. Si máximo histórico=100 eventos y predicción=50, entonces Riesgo=50%.
              </p>
            </div>

            <div className="p-4 bg-slate-900 rounded border border-slate-800">
              <h4 className="text-purple-400 font-bold text-xs mb-2 uppercase">🌍 Riesgo de Zona (Actividad)</h4>
              <code className="block bg-slate-950 p-2 rounded text-[9px] font-mono text-slate-300 mb-2">
                (Menciones_Actuales / Max_Actividad_Zona) * 100
              </code>
              <p className="text-xs text-slate-400">
                Captura actividad actual en barrios. Si en Manrique la máxima fue 30 menciones semanales y ahora hay 15, Riesgo=50%.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-800/50 rounded border border-slate-700">
            <h4 className="text-white font-bold text-sm mb-2">Fórmula de Riesgo Global</h4>
            <code className="block bg-slate-950 p-3 rounded text-xs font-mono text-slate-300 text-center">
              Riesgo = (0.70 × Riesgo_Modelo) + (0.30 × Riesgo_Zona)
            </code>
            <p className="text-xs text-slate-400 mt-2">70% peso en volumen agregado, 30% en hotspots locales. Ajustable según política operacional.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div className="p-3 bg-emerald-900/30 rounded border border-emerald-700 text-center">
              <p className="font-bold text-emerald-300">0-20%</p>
              <p className="text-emerald-200 text-xs">VERDE</p>
            </div>
            <div className="p-3 bg-cyan-900/30 rounded border border-cyan-700 text-center">
              <p className="font-bold text-cyan-300">21-40%</p>
              <p className="text-cyan-200 text-xs">AZUL</p>
            </div>
            <div className="p-3 bg-yellow-900/30 rounded border border-yellow-700 text-center">
              <p className="font-bold text-yellow-300">41-60%</p>
              <p className="text-yellow-200 text-xs">AMARILLO</p>
            </div>
            <div className="p-3 bg-orange-900/30 rounded border border-orange-700 text-center">
              <p className="font-bold text-orange-300">61-80%</p>
              <p className="text-orange-200 text-xs">NARANJA</p>
            </div>
            <div className="p-3 bg-red-900/30 rounded border border-red-700 text-center">
              <p className="font-bold text-red-300">81-100%</p>
              <p className="text-red-200 text-xs">ROJO</p>
            </div>
          </div>
        </div>
      </DocSection>

      {/* 4. GUÍA DE USO OPERACIONAL */}
      <DocSection title="4. Guía de Uso Operacional" icon={<Users size={20} />} defaultOpen={true}>
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-white font-bold text-xs mb-3 flex items-center gap-2"><Settings size={14}/> CONFIGURACIÓN INICIAL</h4>
            <div className="text-xs text-slate-300 space-y-2">
              <p><strong>1. Forecast Horizon:</strong> ¿Cuántos días adelante predecir? (7/14/30/90). Recomendado: 7 días para operacional, 30+ para estratégico.</p>
              <p><strong>2. Granularidad:</strong> Diaria (D), Semanal (W), Mensual (M). Afecta sensibilidad y volatilidad.</p>
              <p><strong>3. Historical Scope:</strong> Cuánto pasado usar (90/180/365 días). Más data = mejor calibración, pero requiere histórico limpio.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-white font-bold text-xs mb-3 flex items-center gap-2"><Database size={14}/> PREPARAR DATOS</h4>
            <div className="text-xs text-slate-300 space-y-2">
              <p><strong>Formato CSV (obligatorio):</strong></p>
              <code className="block bg-slate-950 p-2 rounded text-[8px] font-mono text-slate-200 overflow-x-auto">
                Date,Source,Type,Headline,Relevance,URL<br/>
                2025-01-15,Perplexity,TRIGGER_EVENT,Captura Urabeños en Manrique,0.9,https://...<br/>
                2025-01-16,News,CRIME_STAT,Homicidios barrio Obrero,0.85,https://...
              </code>
              <p><strong>Columnas requeridas:</strong></p>
              <ul className="ml-2 space-y-1 text-xs">
                <li>• <strong>Date:</strong> ISO format (YYYY-MM-DD)</li>
                <li>• <strong>Type:</strong> TRIGGER_EVENT (captura, incautación) o CRIME_STAT (homicidios, hurtos)</li>
                <li>• <strong>Relevance:</strong> 0.0-1.0 (qué tan importante es el evento)</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-white font-bold text-xs mb-3 flex items-center gap-2"><TrendingUp size={14}/> INTERPRETAR RESULTADOS</h4>
            <div className="text-xs text-slate-300 space-y-2">
              <p><strong>PRONÓSTICO (Panel Rojo):</strong> Predicción en vivo basada en datos subidos. Si riesgo=75%, significa 75% del peor escenario histórico.</p>
              <p><strong>AUDIT TRAIL:</strong> Desglose transparente de cálculos internos - muestra exactamente cómo el sistema llegó al riesgo final.</p>
              <p><strong>VALIDACIÓN (en Training):</strong> Métricas históricas del modelo en datos de entrenamiento (RMSE, R², dataset size). Muestra "qué tan preciso fue en el pasado". Acceso en sección Training, no en Dashboard.</p>
              <p><strong>Desglose por Zona:</strong> Ve cuáles barrios contribuyen más al riesgo total. Útil para asignación de recursos.</p>
            </div>
          </div>

          <div className="p-4 bg-amber-900/20 border border-amber-800/50 rounded-lg">
            <h4 className="text-amber-300 font-bold text-xs mb-2 flex items-center gap-2"><AlertTriangle size={14}/> ADVERTENCIAS OPERACIONALES</h4>
            <ul className="text-xs text-amber-200 space-y-1">
              <li><strong>⚠️ Data Scarcity:</strong> Si subes histórico muy corto (horizonte insuficiente), predicción será débil. Sistema mostrará banner de precaución.</li>
              <li><strong>⚠️ No Alignment:</strong> Si datos nuevos no alinean con calibración histórica, usa fallback (entrenamientos anteriores). Banner naranja indica este mode.</li>
              <li><strong>⚠️ Outliers:</strong> Cambios abruptos (ej. 0→100%) sugieren datos anómalos o evento real importante. Revisar manualmente.</li>
            </ul>
          </div>
        </div>
      </DocSection>

      {/* 5. FAQ & TROUBLESHOOTING */}
      <DocSection title="5. FAQ & Troubleshooting" icon={<HelpCircle size={20} />} defaultOpen={false}>
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-blue-300 font-bold text-xs mb-2">❓ ¿Por qué el riesgo cambió de 30% a 75% de un día para otro?</h4>
            <p className="text-xs text-slate-300">
              Es posible. Si el sistema detectó un pico en menciones/eventos o un evento de alto impacto. Revisa el desglose por zona y timeline. Si es genuino, es una alerta válida. Si es error, revisa datos de entrada (duplicados, timestamps mal, relevance inflada).
            </p>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-blue-300 font-bold text-xs mb-2">❓ ¿Qué significa un riesgo de 150%?</h4>
            <p className="text-xs text-slate-300">
              En teoría debería estar 0-100%, pero si la predicción supera el máximo histórico, puede reportar por encima del 100%. Esto significa: "Escenario más severo que cualquier cosa en el histórico". Requiere investigación inmediata—puede ser error de datos o evento realmente excepcional.
            </p>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-blue-300 font-bold text-xs mb-2">❓ ¿Cómo interpretar RMSE?</h4>
            <p className="text-xs text-slate-300">
              RMSE (Root Mean Squared Error) es el error promedio del modelo en unidades de "eventos" o "menciones". RMSE=2.5 significa predicciones ~±2-3 eventos de diferencia. Más bajo=mejor. Complementa con R² (% de varianza explicada).
            </p>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-blue-300 font-bold text-xs mb-2">❓ El Dashboard dice "data_source: training_fallback". ¿Qué pasó?</h4>
            <p className="text-xs text-slate-300">
              Los datos nuevos no alinearon con benchmarks históricos (máximos, escala). Sistema activó fallback: usa último modelo entrenado exitosamente. Ver banner naranja. Recarga con datos más limpios o horizonte mayor.
            </p>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-blue-300 font-bold text-xs mb-2">❓ ¿Puedo usar datos de 10 años atrás?</h4>
            <p className="text-xs text-slate-300">
              Técnicamente sí, pero considera: bandas que no existen, metodología antigua, cambios políticos. Recomendado: últimos 12-18 meses de datos limpios. Más data ≠ mejor si contiene eventos no-relevantes o obsoletos.
            </p>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-blue-300 font-bold text-xs mb-2">❓ ¿Por qué el modelo no predice crímenes específicos?</h4>
            <p className="text-xs text-slate-300">
              Crímenes son eventos discretos impredecibles. Predecir "habrá homicidio el 3 de marzo en X calle" es imposible. Predecir "riesgo elevado basado en patrones de actividad precursora" es válido. Usamos este riesgo para optimizar recursos operacionales.
            </p>
          </div>
        </div>
      </DocSection>

      {/* 6. ARQUITECTURA TÉCNICA */}
      <DocSection title="6. Arquitectura Técnica" icon={<Code size={20} />} defaultOpen={false}>
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-green-300 font-bold text-xs mb-3">📚 Stack Tecnológico</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
              <div>
                <p className="font-bold text-blue-400">Frontend</p>
                <ul className="ml-2 space-y-1">
                  <li>• React 18 + TypeScript</li>
                  <li>• Vite (build tool)</li>
                  <li>• TailwindCSS (styling)</li>
                  <li>• Lucide Icons</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-blue-400">Backend</p>
                <ul className="ml-2 space-y-1">
                  <li>• FastAPI (Python)</li>
                  <li>• Scikit-learn, XGBoost, LightGBM</li>
                  <li>• Google Generative AI (Gemini 2.5)</li>
                  <li>• Pandas, NumPy</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-green-300 font-bold text-xs mb-3">🔄 Flujo de Datos E2E</h4>
            <div className="text-xs text-slate-300 space-y-2">
              <p>1. <strong>Upload CSV</strong> → Frontend valida formato</p>
              <p>2. <strong>POST /config</strong> → Backend almacena config (horizonte, granularidad)</p>
              <p>3. <strong>POST /scrape</strong> → Simulado (en prod: scraper real) → etapa DATA_PREVIEW</p>
              <p>4. <strong>POST /train</strong> → Fase 2-3: NLP (Gemini) + Feature Eng → ML models → etapa TRAINING</p>
              <p>5. <strong>GET /result</strong> → Retorna predicción + riesgo + métricas → etapa DASHBOARD</p>
              <p>6. <strong>GET /options</strong> → Enumeraciones + CSV de combos para UI dropdowns</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-green-300 font-bold text-xs mb-3">📂 Estructura de Carpetas Clave</h4>
            <div className="text-xs text-slate-300 space-y-1 font-mono">
              <p><strong className="text-blue-400">backend/</strong></p>
              <p className="ml-4">├─ main.py → rutas FastAPI</p>
              <p className="ml-4">├─ models.py → Pydantic schemas</p>
              <p className="ml-4">├─ nlp.py → Gemini NER + LLM</p>
              <p className="ml-4">├─ predictor.py → ML training/inference</p>
              <p className="ml-4">├─ data_loader.py → CSV combos_v2</p>
              <p className="ml-4">└─ data/ → combos_v2.csv, modelos persistidos</p>
              <p><strong className="text-blue-400">src/</strong></p>
              <p className="ml-4">├─ App.tsx → orquestación principal</p>
              <p className="ml-4">├─ services/api.ts → cliente HTTP</p>
              <p className="ml-4">├─ services/geminiService.ts → Gemini frontend (NER only)</p>
              <p className="ml-4">└─ components/ → PipelineConfig, DataPreview, Dashboard, etc.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-green-300 font-bold text-xs mb-3">🔐 Variables de Entorno</h4>
            <div className="text-xs text-slate-300">
              <p><strong>Backend:</strong> <code className="bg-slate-950 px-2 py-1 rounded">GEMINI_API_KEY</code> → Activa NLP real; sin esta, usa mock.</p>
              <p><strong>Frontend:</strong> <code className="bg-slate-950 px-2 py-1 rounded">VITE_GEMINI_API_KEY</code> → Inyectado por Vite en <code className="bg-slate-950 px-2 py-1 rounded">process.env</code> para geminiService.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded border border-slate-800">
            <h4 className="text-green-300 font-bold text-xs mb-3">🚀 Deployment Quick Start (Windows)</h4>
            <code className="block bg-slate-950 p-3 rounded text-[8px] font-mono text-slate-300 overflow-x-auto">
              # Backend (PowerShell)<br/>
              python -m venv venv; .\venv\Scripts\Activate.ps1<br/>
              pip install -r backend/requirements.txt<br/>
              $env:GEMINI_API_KEY="your_key"<br/>
              uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000<br/>
              <br/>
              # Frontend (otra terminal)<br/>
              npm install; $env:VITE_GEMINI_API_KEY="your_key"<br/>
              npm run dev
            </code>
          </div>
        </div>
      </DocSection>

      <div className="mt-10 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>Sentinela Aburrá © 2025 | Documentación v3.1 | Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
      </div>
    </div>
  );
};

export default Documentation;
