import { ScanAndSuggestResult } from '../dto/dish-suggestion.dto';

export const INGREDIENT_SCANNER_AGENT = 'INGREDIENT_SCANNER_AGENT';

export interface UserContext {
  goal: string;
  caloriesTarget: number;
  todayConsumed: number;
  allergies?: string;
}

export interface IngredientScannerAgentPort {
  scanAndSuggest(params: {
    imagesBase64: string[];
    userContext: UserContext;
  }): Promise<ScanAndSuggestResult>;
}
