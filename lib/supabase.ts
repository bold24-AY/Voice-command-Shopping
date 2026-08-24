import { createClient } from '@supabase/supabase-js';
import { ShoppingItem, Product, PurchaseHistoryItem } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://exelycxmwlzefkdepnnn.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_FHlNdAzZ7PJhzbS4k9P6eQ_v-ibG6AN';

export const supabase = createClient(supabaseUrl, supabaseKey);

// INITIAL IN-MEMORY FALLBACK SEED DATA (Guarantees app works 100% out-of-the-box even if DB tables are fresh)
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Fresh Whole Milk',
    category: 'Dairy',
    brand: 'Amul',
    price: 3.50,
    unit: 'bottle',
    is_in_stock: true,
    is_organic: false,
    is_seasonal: false,
    substitutes: ['Almond Milk', 'Soy Milk', 'Oat Milk']
  },
  {
    id: 'prod-2',
    name: 'Organic Almond Milk',
    category: 'Dairy',
    brand: 'Silk',
    price: 4.99,
    unit: 'carton',
    is_in_stock: true,
    is_organic: true,
    is_seasonal: false,
    substitutes: ['Soy Milk', 'Oat Milk']
  },
  {
    id: 'prod-3',
    name: 'Farm Fresh Eggs',
    category: 'Produce',
    brand: 'Country Farms',
    price: 4.25,
    unit: 'dozen',
    is_in_stock: true,
    is_organic: true,
    is_seasonal: false,
    substitutes: ['Egg Substitutes', 'Tofu']
  },
  {
    id: 'prod-4',
    name: 'Brown Whole Wheat Bread',
    category: 'Bakery',
    brand: 'Britannia',
    price: 2.99,
    unit: 'loaf',
    is_in_stock: true,
    is_organic: false,
    is_seasonal: false,
    substitutes: ['Multigrain Bread', 'Gluten Free Bread']
  },
  {
    id: 'prod-5',
    name: 'Fresh Alphonso Mangoes',
    category: 'Produce',
    brand: 'Ratnagiri',
    price: 6.50,
    unit: 'kg',
    is_in_stock: true,
    is_organic: true,
    is_seasonal: true,
    season_name: 'Summer Special',
    substitutes: ['Papaya', 'Peaches']
  },
  {
    id: 'prod-6',
    name: 'Organic Apples (Gala)',
    category: 'Produce',
    brand: 'Washington',
    price: 3.99,
    unit: 'kg',
    is_in_stock: true,
    is_organic: true,
    is_seasonal: false,
    substitutes: ['Pears', 'Green Apples']
  },
  {
    id: 'prod-7',
    name: 'Organic Bananas',
    category: 'Produce',
    brand: 'Organic Valley',
    price: 1.80,
    unit: 'bunch',
    is_in_stock: true,
    is_organic: true,
    is_seasonal: false,
    substitutes: ['Plantains']
  },
  {
    id: 'prod-8',
    name: 'Colgate Total Toothpaste',
    category: 'Personal Care',
    brand: 'Colgate',
    price: 4.50,
    unit: 'tube',
    is_in_stock: true,
    is_organic: false,
    is_seasonal: false,
    substitutes: ['Sensodyne Toothpaste', 'Pepsodent']
  },
  {
    id: 'prod-9',
    name: 'Sensodyne Herbal Toothpaste',
    category: 'Personal Care',
    brand: 'Sensodyne',
    price: 4.99,
    unit: 'tube',
    is_in_stock: true,
    is_organic: false,
    is_seasonal: false,
    substitutes: ['Colgate Toothpaste']
  },
  {
    id: 'prod-10',
    name: 'Basmati Rice Premium 5kg',
    category: 'Pantry',
    brand: 'India Gate',
    price: 14.99,
    unit: 'pack',
    is_in_stock: true,
    is_organic: false,
    is_seasonal: false,
    substitutes: ['Jasmine Rice', 'Brown Rice']
  },
  {
    id: 'prod-11',
    name: 'Greek Yogurt Vanilla',
    category: 'Dairy',
    brand: 'Epigamia',
    price: 2.49,
    unit: 'cup',
    is_in_stock: true,
    is_organic: false,
    is_seasonal: false,
    substitutes: ['Plain Yogurt', 'Coconut Milk Yogurt']
  },
  {
    id: 'prod-12',
    name: 'Natural Organic Honey',
    category: 'Pantry',
    brand: 'Dabur Organic',
    price: 7.99,
    unit: 'jar',
    is_in_stock: true,
    is_organic: true,
    is_seasonal: false,
    substitutes: ['Maple Syrup', 'Agave Nectar']
  }
];

export const INITIAL_SUGGESTIONS: PurchaseHistoryItem[] = [
  {
    id: 'sug-1',
    product_name: 'Brown Whole Wheat Bread',
    category: 'Bakery',
    buy_count: 8,
    days_interval: 5,
    last_purchased_days_ago: 6,
    suggested_reason: 'Bought 8 times recently. You are likely running low on bread.',
    default_unit: 'loaf',
    default_price: 2.99
  },
  {
    id: 'sug-2',
    product_name: 'Fresh Whole Milk',
    category: 'Dairy',
    buy_count: 12,
    days_interval: 4,
    last_purchased_days_ago: 4,
    suggested_reason: 'Bought 12 times recently. Reorder frequency target hit.',
    default_unit: 'bottle',
    default_price: 3.50
  },
  {
    id: 'sug-3',
    product_name: 'Farm Fresh Eggs',
    category: 'Produce',
    buy_count: 6,
    days_interval: 7,
    last_purchased_days_ago: 7,
    suggested_reason: 'Weekly staple. Last purchased 7 days ago.',
    default_unit: 'dozen',
    default_price: 4.25
  }
];

export const INITIAL_SHOPPING_ITEMS: ShoppingItem[] = [
  {
    id: 'item-1',
    name: 'Fresh Whole Milk',
    category: 'Dairy',
    quantity: 2,
    unit: 'bottle',
    is_completed: false,
    price: 3.50,
    created_at: new Date().toISOString()
  },
  {
    id: 'item-2',
    name: 'Organic Apples (Gala)',
    category: 'Produce',
    quantity: 1.5,
    unit: 'kg',
    is_completed: false,
    price: 3.99,
    created_at: new Date().toISOString()
  },
  {
    id: 'item-3',
    name: 'Brown Whole Wheat Bread',
    category: 'Bakery',
    quantity: 1,
    unit: 'loaf',
    is_completed: true,
    price: 2.99,
    created_at: new Date().toISOString()
  }
];
