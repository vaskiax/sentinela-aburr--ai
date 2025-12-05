#!/usr/bin/env python3
import pandas as pd

# Load CSV
df = pd.read_csv('backend/data/combos_v2.csv', sep=';')

# Get unique barrios
barrios = sorted(df['Barrio'].dropna().unique())

print(f"\n{'='*50}")
print(f"Total unique barrios: {len(barrios)}")
print(f"{'='*50}")
for i, b in enumerate(barrios, 1):
    print(f"{i:2}. {b}")
