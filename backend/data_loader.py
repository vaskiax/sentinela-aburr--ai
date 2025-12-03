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
