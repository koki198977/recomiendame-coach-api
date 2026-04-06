export interface DetectedIngredient {
  name: string;
  category: string;
  quantity_estimate: string;
}

export interface DishMacros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DishSuggestion {
  name: string;
  prep_time_minutes: number;
  macros: DishMacros;
  compatibility: string;
  ingredients_used: string[];
  steps: string[];
  how_to_cook?: string;
  chapix_note: string;
}

export interface ScanAndSuggestResult {
  ingredients: DetectedIngredient[];
  confidence: 'alta' | 'media' | 'baja';
  notes?: string;
  dishes: DishSuggestion[];
}
