// Utilitaires pour les catégories d'appareils
export const categoryDiminutives: Record<string, string> = {
  'Informatique': 'INF',
  'Lumière': 'LUM',
  'Vidéo-Photo': 'VID',
  'Appareils-Numériques': 'NUM',
  'Son': 'SON',
  'Electro Ménager': 'ELE',
  'Serveur-Stockage': 'SRV',
  'périphérique': 'PRH',
  'imprimante': 'IMP'
};

export const getCategoryAbbreviation = (category: string): string => {
  return categoryDiminutives[category] || category;
};

export const getProductCode = (category: string, code: string): string => {
  return `${getCategoryAbbreviation(category)}-${code}`;
};

export const searchInCategoryAbbreviations = (searchTerm: string): string[] => {
  const term = searchTerm.toLowerCase();
  return Object.entries(categoryDiminutives)
    .filter(([category, diminutive]) => 
      category.toLowerCase().includes(term) || 
      diminutive.toLowerCase().includes(term)
    )
    .map(([category]) => category);
};