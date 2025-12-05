import pandas as pd
import os
from typing import List, Dict, Any
from .models import Organization, CriminalRank

class DataLoader:
    def __init__(self, csv_path: str = "backend/data/combos_v2.csv"):
        self.csv_path = csv_path
        self.df = None
        self.load_data()

    def load_data(self):
        if os.path.exists(self.csv_path):
            try:
                self.df = pd.read_csv(self.csv_path, sep=';')
                # Basic cleaning
                self.df['Combo/Banda'] = self.df['Combo/Banda'].astype(str).str.strip()
                self.df['Barrio'] = self.df['Barrio'].astype(str).str.strip()
                self.df['Comuna'] = self.df['Comuna'].astype(str).str.strip()
                self.df['estructura'] = self.df['estructura'].astype(str).str.strip()
                
                # Filter out noise rows if any (e.g. "No puedo identificar...")
                self.df = self.df[~self.df['Combo/Banda'].str.contains("No puedo identificar", na=False)]
            except Exception as e:
                print(f"Error loading CSV: {e}")
                self.df = pd.DataFrame()
        else:
            print(f"CSV not found at {self.csv_path}")
            self.df = pd.DataFrame()

    def get_options(self) -> Dict[str, List[str]]:
        # Return enum values for organizations and ranks from the model
        organizations = [org.value for org in Organization]
        ranks = [rank.value for rank in CriminalRank]
        
        # Get combos, barrios, comunas from CSV if available
        if self.df is None or self.df.empty:
            return {
                "organizations": organizations,
                "ranks": ranks,
                "combos": [],
                "barrios": [],
                "comunas": []
            }
            
        return {
            "organizations": organizations,  # Use enum values
            "ranks": ranks,  # Use enum values
            "combos": sorted(self.df['Combo/Banda'].unique().tolist()),
            "barrios": sorted(self.df['Barrio'].unique().tolist()),
            "comunas": sorted(self.df['Comuna'].unique().tolist())
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
