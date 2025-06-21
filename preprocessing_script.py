import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import re

df = pd.read_csv('data/recipes.csv')
df_reviews = pd.read_csv('data/reviews.csv')


df_reviews_grouped = df_reviews.groupby('RecipeId')['Review'].apply(list).reset_index()
df = pd.merge(df, df_reviews_grouped, left_on='RecipeId', right_on='RecipeId', how='outer')


def parse_r_c_list(value):
    if isinstance(value, str) and value.strip().startswith('c('):
        # Remove o "c(" no início e ")" no final
        value = value.strip()[2:-1]
        # Usa regex para extrair os itens entre aspas
        items = re.findall(r'"(.*?)"', value, re.DOTALL)
        return items
    return value  # se já for lista ou nulo

# Aplica a função para ajustar as colunas desejadas
cols_to_convert = ['Images','Keywords','RecipeIngredientQuantities','RecipeIngredientParts', 'RecipeInstructions']
for col in cols_to_convert:
    df[col] = df[col].apply(parse_r_c_list)

# Cria a coluna com o número de ingredientes
df['NumIngredients'] = df['RecipeIngredientParts'].apply(lambda x: len(x) if isinstance(x, list) else 0)

# Visualização rápida de como ficou
print(df[['RecipeIngredientParts', 'NumIngredients']].head())


def parse_duration(duration):
    if pd.isna(duration):
        return 0
    match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?', duration)
    if not match:
        return 0
    hours = int(match.group(1)) if match.group(1) else 0
    minutes = int(match.group(2)) if match.group(2) else 0
    return hours + minutes / 60

for col in ['CookTime', 'PrepTime', 'TotalTime']:
    df[col + '_hours'] = df[col].apply(parse_duration)

df[['CookTime', 'PrepTime', 'TotalTime', 'CookTime_hours', 'PrepTime_hours', 'TotalTime_hours']].head()
df['CookTime'].fillna(0, inplace = True)
df['ReviewCount'].fillna(0, inplace = True)



# Lista das colunas nutricionais/numericas a analisar
nutritional_cols = [
    'CookTime_hours', 'PrepTime_hours', 'TotalTime_hours',
    'Calories', 'FatContent', 'SaturatedFatContent', 'CholesterolContent',
    'SodiumContent', 'CarbohydrateContent', 'FiberContent', 'SugarContent', 'ProteinContent'
]

# Garante que as colunas estão em formato numérico (caso venham como strings)
for col in nutritional_cols:
    df[col] = pd.to_numeric(df[col], errors='coerce')

# Cria uma máscara booleana com True para valores *não* outliers
mask = pd.Series(True, index=df.index)

# Para cada coluna, calcula os limites de outlier e atualiza a máscara
for col in nutritional_cols:
    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    
    # Identifica outliers nessa coluna
    non_outliers = (df[col] >= lower_bound) & (df[col] <= upper_bound)
    
    # Atualiza a máscara com lógica AND inversa para remover qualquer outlier em qualquer coluna
    mask &= non_outliers

# Aplica o filtro
df_filtered = df[mask].reset_index(drop=True)

# Mostra quantos foram removidos
print(f"Total de receitas antes: {len(df)}")
print(f"Total de receitas após remoção de outliers: {len(df_filtered)}")

# Opcional: mostrar o describe novamente após filtragem
print(df_filtered[nutritional_cols].describe())


df = df_filtered




df.to_csv('data/recipes_cleaned.csv', index=False)