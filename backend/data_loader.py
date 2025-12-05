import pandas as pd
import os
from typing import List, Dict, Any
from .models import Organization, CriminalRank

class DataLoader:
    def __init__(self, csv_path: str = None):
        # If no path provided, use absolute path relative to this file
        if csv_path is None:
            backend_dir = os.path.dirname(os.path.abspath(__file__))
            csv_path = os.path.join(backend_dir, "data", "combos_v2.csv")
        self.csv_path = csv_path
        self.df = None
        self.load_data()

    def load_data(self):
        if os.path.exists(self.csv_path):
            try:
                self.df = pd.read_csv(self.csv_path, sep=';')
                print(f"[DataLoader] CSV loaded successfully: {len(self.df)} rows", flush=True)
                # Basic cleaning
                self.df['Combo/Banda'] = self.df['Combo/Banda'].astype(str).str.strip()
                self.df['Barrio'] = self.df['Barrio'].astype(str).str.strip()
                self.df['Comuna'] = self.df['Comuna'].astype(str).str.strip()
                self.df['estructura'] = self.df['estructura'].astype(str).str.strip()
                
                # Filter out noise rows if any (e.g. "No puedo identificar...")
                self.df = self.df[~self.df['Combo/Banda'].str.contains("No puedo identificar", na=False)]
            except Exception as e:
                print(f"[DataLoader] Error loading CSV: {e}", flush=True)
                self.df = pd.DataFrame()
        else:
            print(f"[DataLoader] CSV not found at {self.csv_path}", flush=True)
            self.df = pd.DataFrame()

    def get_options(self) -> Dict[str, List[str]]:
        # Return enum values for organizations and ranks from the model
        organizations = [org.value for org in Organization]
        ranks = [rank.value for rank in CriminalRank]
        
        # Get combos, barrios, comunas from CSV if available
        if self.df is None or self.df.empty:
            print(f"[DataLoader] DataFrame is empty, returning empty options", flush=True)
            return {
                "organizations": organizations,
                "ranks": ranks,
                "combos": [],
                "barrios": [],
                "comunas": []
            }
        
        # Extract and clean data, filtering out None/NaN/empty values
        barrios_raw = self.df['Barrio'].astype(str).str.strip().unique().tolist()
        barrios_list = sorted([b for b in barrios_raw if b and b.lower() not in ['none', 'nan', '']])
        
        combos_raw = self.df['Combo/Banda'].astype(str).str.strip().unique().tolist()
        combos_list = sorted([c for c in combos_raw if c and c.lower() not in ['none', 'nan', '']])
        
        comunas_raw = self.df['Comuna'].astype(str).str.strip().unique().tolist()
        comunas_list = sorted([com for com in comunas_raw if com and com.lower() not in ['none', 'nan', '']])
        
        print(f"[DataLoader] get_options() -> {len(barrios_list)} barrios, {len(combos_list)} combos, {len(comunas_list)} comunas", flush=True)
        print(f"[DataLoader] Sample barrios (first 5): {barrios_list[:5]}", flush=True)
        
        return {
            "organizations": organizations,  # Use enum values
            "ranks": ranks,  # Use enum values
            "combos": combos_list,
            "barrios": barrios_list,
            "comunas": comunas_list
        }

    def get_combos_by_org(self, org_name: str) -> List[str]:
        if self.df is None: return []
        return self.df[self.df['estructura'] == org_name]['Combo/Banda'].tolist()

    def get_barrio_index(self) -> List[Dict[str, Any]]:
        """Return list of barrios with their comuna metadata.

        Output schema: [{"barrio": str, "comuna_nombre": str, "comuna_numero": str}]
        """
        if self.df is None or self.df.empty:
            return []

        # Normalize columns
        df = self.df.copy()
        df['Barrio'] = df['Barrio'].astype(str).str.strip()
        df['comuna_nombre'] = df['comuna_nombre'].astype(str).str.strip()
        df['comuna_numero'] = df['comuna_numero'].astype(str).str.strip()

        seen = set()
        barrio_list = []
        for _, row in df.iterrows():
            barrio = row['Barrio']
            comuna_nombre = row['comuna_nombre']
            comuna_numero = row['comuna_numero']
            
            # Skip rows with invalid/None/NaN values
            if not barrio or barrio.lower() in ['none', 'nan', '']:
                continue
            if not comuna_nombre or str(comuna_nombre).lower() in ['none', 'nan', '']:
                continue
            
            key = barrio.lower()
            if key in seen:
                continue
            seen.add(key)
            barrio_list.append({
                "barrio": barrio,
                "comuna_nombre": comuna_nombre,
                "comuna_numero": comuna_numero,
            })
        return barrio_list
