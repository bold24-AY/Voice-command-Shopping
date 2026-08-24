export type CategoryType = 
  | 'Produce'
  | 'Dairy'
  | 'Bakery'
  | 'Beverages'
  | 'Snacks'
  | 'Pantry'
  | 'Household'
  | 'Personal Care';

export interface ShoppingItem {
  id: string;
  name: string;
  category: CategoryType;
  quantity: number;
  unit: string;
  is_completed: boolean;
  price: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: CategoryType;
  brand: string;
  price: number;
  unit: string;
  is_in_stock: boolean;
  is_organic: boolean;
  is_seasonal: boolean;
  season_name?: string;
  substitutes: string[];
}

export interface PurchaseHistoryItem {
  id: string;
  product_name: string;
  category: CategoryType;
  buy_count: number;
  days_interval: number;
  last_purchased_days_ago: number;
  suggested_reason: string;
  default_unit: string;
  default_price: number;
}

export type VoiceIntentType = 
  | 'ADD_ITEM'
  | 'REMOVE_ITEM'
  | 'UPDATE_QUANTITY'
  | 'SEARCH_PRODUCTS'
  | 'FILTER_PRODUCTS'
  | 'SHOW_SUGGESTIONS'
  | 'CLEAR_LIST'
  | 'UNKNOWN';

export interface ExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  category?: CategoryType;
  price?: number;
  matchedProduct?: Product;
}

export interface VoiceIntentResult {
  intent: VoiceIntentType;
  items?: ExtractedItem[];
  searchQuery?: string;
  priceFilter?: {
    maxPrice?: number;
    minPrice?: number;
  };
  brand?: string;
  category?: CategoryType;
  language?: string;
  originalTranscript: string;
  spokenResponse: string;
  unmatchedItem?: string;
  errorMessage?: string;
}

export interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  lastResult?: VoiceIntentResult | null;
  error?: string | null;
  language: string;
}
