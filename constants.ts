import { Organization, CriminalRank, ProjectFile } from './types';

export const ABURRA_ZONES = [
  { id: 'C01', name: 'Popular', municipality: 'Medellín' },
  { id: 'C02', name: 'Santa Cruz', municipality: 'Medellín' },
  { id: 'C03', name: 'Manrique', municipality: 'Medellín' },
  { id: 'C04', name: 'Aranjuez', municipality: 'Medellín' },
  { id: 'C05', name: 'Castilla', municipality: 'Medellín' },
  { id: 'C06', name: 'Doce de Octubre', municipality: 'Medellín' },
  { id: 'C07', name: 'Robledo', municipality: 'Medellín' },
  { id: 'C08', name: 'Villa Hermosa', municipality: 'Medellín' },
  { id: 'C09', name: 'Buenos Aires', municipality: 'Medellín' },
  { id: 'C10', name: 'La Candelaria', municipality: 'Medellín' },
  { id: 'C11', name: 'Laureles', municipality: 'Medellín' },
  { id: 'C12', name: 'La América', municipality: 'Medellín' },
  { id: 'C13', name: 'San Javier', municipality: 'Medellín' },
  { id: 'C14', name: 'Poblado', municipality: 'Medellín' },
  { id: 'C15', name: 'Guayabal', municipality: 'Medellín' },
  { id: 'C16', name: 'Belén', municipality: 'Medellín' },
  { id: 'BEL', name: 'Bello (General)', municipality: 'Bello' },
  { id: 'ITA', name: 'Itagüí (General)', municipality: 'Itagüí' },
  { id: 'ENV', name: 'Envigado (General)', municipality: 'Envigado' },
];

export const MOCK_LOGS = [
  { id: 1, timestamp: 'System Init', stage: 'IDLE', message: 'System ready. Waiting for user configuration.', status: 'success' },
];

// --- MASTER LISTS FOR CONFIGURATION ---
export const MASTER_ORGS_MAJOR = [
  "La Oficina de Envigado", "Clan del Golfo (AGC)", "Los Chatas", "Los Pachelly", 
  "La Terraza", "Los Triana", "Los del 12", "Los Mesa", "El Mesa", "Niquía Camacol"
];

export const MASTER_COMBOS_EXTENDED = [
    "Combo/Banda La Silla", "El Hoyo de San Pablo", "La 29", "La Avanzada", "La 38", "Los Terranovas", "El Filo", "Los Chicos Malos", 
    "La Torre (La 107)", "La Galera", "Carpinelo", "Los Triana", "Barrios Unidos", "El Pomar", "El Hoyo", "Balcones de Jardín", 
    "Oficina de Trasmayo", "Versalles", "La Terraza", "Los Terribles", "San Blas", "La Salle", "El Combo de Motor", "La Guyana (El combo de la Yegua)", 
    "El Combo de La Vaca", "Cuatro Esquinas (Combo de Luisito)", "La Viña", "La Marina", "La Batea", "La 43", "La Cruz (La Honda)", 
    "La Arboleda", "El Cristo", "Palermo", "El Pueblo (Pueblito)", "Los Calvos", "La Oficina de Campo Valdés", "Moravia", "Los Gomelos", 
    "Plan de la Virgen (Miranda)", "Los del Alto", "Los Mondongueros", "Los Bananeros", "Los Lecheros", "Belalcázar", "Alfonso López", 
    "Franzea", "El Ventiadero", "La Prefa", "Los Matecañas", "Pico Pico", "El Hueco de La María", "El Hueco de La Candelaria", "La 40", 
    "La 70", "La Oficina de Córdoba", "Los Edificios", "La 26", "La Paralela", "La Fe", "Florencia", "Pájaro Azul", "La Oficina del Doce", 
    "El Chispero", "El Polvorín", "Los Machacos", "La Imperial", "Los Ototos", "Los Rieles", "El Baratón", "París (La 402)", "La Conejera", 
    "La Calle del Silencio", "La Calle del Pecado", "Los Negritos", "Los Tatos", "El Plan (Jardín)", "San Martín de Porres", "Los Chichos", 
    "Picacho", "Los Ranchos", "La 78", "La Invasión", "El Pino", "Kennedy", "El Bulevar", "La Pradera", "Santander", "La Torre Cruz Roja", 
    "Los Broster", "Los Buchepájaros", "Cotranal", "Los Cachorros", "La Platanera", "El Acopio", "Los Montunos", "El Morro", "Bello Horizonte", 
    "Villa Flora", "Curazao", "La Huerta", "Aures", "Villa Sofía (El Diamante)", "La Campiña", "Nuevo México", "La Roja", "La Libertad", 
    "La Mansión", "Los Conejos", "Los Praga", "Villa Hermosa", "13 de Noviembre", "San Antonio", "La Sierra", "Villatina", "Caicedo", 
    "La Cañada (Tres Esquinas)", "Las Granjas", "La Bombonera", "La Arenera", "Morro Chispas", "Barrios de Jesús (Los BJ)", "Ocho de Marzo", 
    "La Milagrosa", "Las Palmas", "Convivir El Raudal (Rojas Pinilla)", "Convivir La Bastilla", "Convivir La Bayadera", "Convivir Niquitao", 
    "Convivir San Antonio", "Convivir El Hueco", "Convivir Alhambra", "Convivir La Veracruz", "Convivir Juan del Corral", "Convivir El Chagualo", 
    "Convivir Bolívar (Barbacoas)", "Convivir El Incendio", "Convivir Samaritano", "Convivir San Benito", "Convivir Cisneros", "Convivir Cundinamarca", 
    "La Iguaná", "Combo de Niza (Los Tobón)", "El Coco", "Barrio Cristóbal", "El Pesebre (Los Pesebreros)", "Peñitas", "La Loma", "San Pedro", 
    "La Agonía", "Los Paracos del Morro", "Reversadero del Dos", "La Sexta", "Los del Seis (Los del Hoyo)", "La Quiebra (Juan XXIII)", "La Divisa", 
    "Plan del Che", "Curvitas", "Combo de La Boa (La 115)", "La Luz del Mundo", "Altos de San Juan", "Altos de la Virgen", "La Gabriela", 
    "Santa Rosa de Lima", "Metropolitano", "Eduardo Santos", "Los Picúas", "El Salado", "Los del Uno", "El Chispero del 20", "Betania", 
    "Guadarrama", "Plan de Foronda", "Los Pirusos", "La Raya", "El Bolo", "La Baranda", "La Colinita", "Cristo Rey", "La 24", "Alexpin", 
    "Planeco", "La Pesebrera", "La 68", "San Rafael", "La Licorera", "Zafra (El Tanque)", "Barrio Bolsa", "El Ñeque", "San Bernardo (Las Playas)", 
    "Las Violetas (Los Violeteros)", "Las Mulas", "Los Joaquinillos", "Aguas Frías", "La Capilla", "Sucre", "Fátima", "El Amarillo", 
    "Belén Rincón (La Sintética)", "Los Motorratones", "Los Alpinitos (Los Alpes)", "Las Brisas", "Los Chivos", "Los Pájaros (Buenavista)", 
    "La Perla (Los Chemines)", "Los de La 14", "La Lágrima", "La Mano de Dios (Los Negritos)", "Manzanares", "Nuevo Amanecer", "La Aurora", 
    "El Llano", "Las Flores", "La Montaña", "Bellavista", "Los Nenos", "Los Chicorios", "Las Bifas", "La Oculta", "Santa Rita", 
    "Los de Mi Casita", "Naranjitos", "Los Salinas", "Aragón", "Barichara", "Eduardo Escobar", "Cantarrana", "La 13", "Los Halcones", 
    "Pallavecini", "Desconocido"
];

// PREDICTOR VARIABLES (Triggers - X)
export const MASTER_PREDICTOR_EVENTS = [
  "Captura (Captured)", "Abatido (Neutralized)"
];

export const MASTER_PREDICTOR_RANKS = [
  "Cabecilla (Kingpin)", "Lugarteniente (Lieutenant)", "Coordinador (Manager)", "Supervisor", "Jíbaro (Dealer)"
];

// TARGET VARIABLES (To Predict - Y)
export const MASTER_TARGET_CRIMES = [
  "Homicidio (Homicide)", "Fleteo (Theft)", "Extorsión (Extortion)", "Microtráfico (Drug Trafficking)", 
  "Porte Ilegal de Armas", "Terrorismo", "Desplazamiento Forzado", "Secuestro"
];

// --- UPDATED PYTHON SCRIPTS (DYNAMIC) ---

const SCRIPT_ENV_SETUP = `
# .env configuration
API_KEY=your_gemini_api_key_here
DB_HOST=localhost
# Pipeline Config
SCRAPING_DEPTH=deep
USER_AGENT_ROTATION=True
HISTORICAL_START_DATE=2010-01-01
`;

const SCRIPT_SCRAPER_MAIN = `import scrapy
import json
from datetime import datetime
from scrapy.crawler import CrawlerProcess
from scrapy.spiders import CrawlSpider, Rule
from scrapy.linkextractors import LinkExtractor

# Load User Configuration
with open('config/scraping_config.json', 'r') as f:
    CONFIG = json.load(f)

# PREDICTORS (Trigger Events)
TARGET_ORGS = CONFIG.get('target_organizations', []) + CONFIG.get('local_combos', [])
EVENT_TYPES = CONFIG.get('predictor_events', []) # e.g. ["Captura", "Abatido"]
RANK_FILTERS = CONFIG.get('predictor_ranks', []) # e.g. ["Cabecilla", "Coordinador"]

# TARGETS (Predicted Variables)
CRIME_TARGETS = CONFIG.get('target_crimes', []) # e.g. ["Homicidio", "Extorsión"]

START_DATE = CONFIG.get('date_range_start', '2010-01-01')

class MedellinPredictiveSpider(CrawlSpider):
    name = "medellin_predictive_spider"
    allowed_domains = ["minuto30.com", "elcolombiano.com", "qhubomedellin.com"]
    
    def start_requests(self):
        # 1. SCRAPE PREDICTORS (Triggers: Captures of specific Ranks in specific Orgs)
        print("--- STARTING PREDICTOR VARIABLE SCRAPING ---")
        for org in TARGET_ORGS:
            for event in EVENT_TYPES:
                for rank in RANK_FILTERS:
                    # Search Query: Org + Event + Rank (e.g. "La Terraza Captura Cabecilla")
                    query = f'site:minuto30.com "{org}" AND "{event}" AND "{rank}" after:{START_DATE}'
                    yield scrapy.Request(
                        f"https://www.google.com/search?q={query}",
                        callback=self.parse_predictor_event,
                        meta={'event_type': event, 'rank': rank, 'org': org}
                    )

        # 2. SCRAPE TARGET VARIABLES (Response: Crime Statistics)
        print("--- STARTING TARGET VARIABLE SCRAPING ---")
        for crime in CRIME_TARGETS:
             # Search Query: Crime + Increase + Location
             query = f'site:elcolombiano.com "Aumento" AND "{crime}" AND "Valle de Aburrá" after:{START_DATE}'
             yield scrapy.Request(
                f"https://www.google.com/search?q={query}",
                callback=self.parse_crime_stat,
                meta={'crime_type': crime}
            )

    def parse_predictor_event(self, response):
        """Extracts X Variables (Triggers)"""
        headline = response.css('h1::text').get()
        full_text = " ".join(response.css('p::text').getall())
        
        yield {
            'variable_type': 'PREDICTOR_X',
            'event': response.meta['event_type'],
            'rank': response.meta['rank'],
            'org': response.meta['org'],
            'headline': headline,
            'body': full_text,
            'scraped_at': datetime.now().isoformat()
        }

    def parse_crime_stat(self, response):
        """Extracts Y Variables (Targets)"""
        headline = response.css('h1::text').get()
        full_text = " ".join(response.css('p::text').getall())
        
        yield {
            'variable_type': 'TARGET_Y',
            'crime': response.meta['crime_type'],
            'headline': headline,
            'body': full_text,
            'scraped_at': datetime.now().isoformat()
        }

if __name__ == "__main__":
    process = CrawlerProcess()
    process.crawl(MedellinPredictiveSpider)
    process.start()
`;

const SCRIPT_MODEL_TRAIN = `import pandas as pd
import xgboost as xgb
import json

def train_predictor():
    # Load separated datasets
    df_x = pd.read_csv('../../data/raw/predictors.csv') # Captures/Deaths
    df_y = pd.read_csv('../../data/raw/targets.csv')    # Homicides/Theft Stats
    
    print("Aligning Trigger Events (X) with subsequent Crime Waves (Y)...")
    
    # Logic to correlate: Did Crime Y increase 2 weeks after Capture X?
    training_data = align_time_series(df_x, df_y, lag_days=14)
    
    X = training_data[['rank_weight', 'org_power', 'event_type_weight']]
    y = training_data['crime_increase_flag'] 
    
    print(f"Training Model to predict '{df_y.crime_type.unique()}'...")
    
    model = xgb.XGBClassifier()
    model.fit(X, y)
    
    # ... save model artifact ...
`;

const SCRIPT_NLP_ENGINE = `import os
from google import genai
# ... 
# NLP now strictly verifies if the 'Rank' in the text matches the User Configuration
`;

// --- FILE SYSTEM STRUCTURE ---

export const PROJECT_STRUCTURE: ProjectFile[] = [
  {
    name: 'sentinela-aburra',
    type: 'folder',
    children: [
      {
        name: 'config',
        type: 'folder',
        children: [
          { name: 'scraping_config.json', type: 'file', content: '{\n  "predictors": {"events": ["Capture"], "ranks": ["Cabecilla"]},\n  "targets": ["Homicidio"]\n}', language: 'json' }
        ]
      },
      { name: '.env', type: 'file', content: SCRIPT_ENV_SETUP, language: 'bash' },
      {
        name: 'data',
        type: 'folder',
        children: [
          { name: 'raw', type: 'folder', children: [
              {name: 'predictors_x.jsonl', type: 'file', content: "{...}"},
              {name: 'targets_y.jsonl', type: 'file', content: "{...}"}
          ]},
        ]
      },
      {
        name: 'src',
        type: 'folder',
        children: [
          {
            name: 'spiders',
            type: 'folder',
            children: [
              { name: 'medellin_predictive_spider.py', type: 'file', content: SCRIPT_SCRAPER_MAIN, language: 'python' }
            ]
          },
          {
            name: 'models',
            type: 'folder',
            children: [
              { name: 'train_model.py', type: 'file', content: SCRIPT_MODEL_TRAIN, language: 'python' }
            ]
          }
        ]
      }
    ]
  }
];