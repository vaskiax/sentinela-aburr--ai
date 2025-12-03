import pandas as pd

try:
    df = pd.read_csv('backend/data/combos_v2.csv', sep=';')
    print("Unique Structures (Organizations):")
    print(df['estructura'].unique())
except Exception as e:
    print(e)
