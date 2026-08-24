-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SHOPPING ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.shopping_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Pantry',
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit VARCHAR(50) NOT NULL DEFAULT 'pack',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PRODUCTS CATALOG TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL DEFAULT 'Generic',
    price NUMERIC(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL DEFAULT 'pack',
    is_in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    is_organic BOOLEAN NOT NULL DEFAULT FALSE,
    is_seasonal BOOLEAN NOT NULL DEFAULT FALSE,
    season_name VARCHAR(100),
    substitutes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PURCHASE HISTORY / SMART RECOMMENDATION TABLE
CREATE TABLE IF NOT EXISTS public.purchase_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    buy_count INT NOT NULL DEFAULT 1,
    days_interval INT NOT NULL DEFAULT 7,
    last_purchased_days_ago INT NOT NULL DEFAULT 5,
    suggested_reason TEXT NOT NULL,
    default_unit VARCHAR(50) NOT NULL DEFAULT 'pack',
    default_price NUMERIC(10,2) NOT NULL DEFAULT 0.00
);

-- ENABLE ROW LEVEL SECURITY (RLS) & ALLOW ALL ANONYMOUS / AUTH ACCESS FOR DEMO
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write shopping_items" ON public.shopping_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read purchase_history" ON public.purchase_history FOR ALL USING (true) WITH CHECK (true);

-- SEED DATA FOR PRODUCTS
INSERT INTO public.products (name, category, brand, price, unit, is_in_stock, is_organic, is_seasonal, season_name, substitutes) VALUES
('Fresh Whole Milk', 'Dairy', 'Amul', 3.50, 'bottle', true, false, false, NULL, '["Almond Milk", "Soy Milk", "Oat Milk"]'),
('Organic Almond Milk', 'Dairy', 'Silk', 4.99, 'carton', true, true, false, NULL, ['Soy Milk', 'Oat Milk']),
('Farm Fresh Eggs', 'Produce', 'Country Farms', 4.25, 'dozen', true, true, false, NULL, '["Egg Substitutes", "Tofu"]'),
('Brown Whole Wheat Bread', 'Bakery', 'Britannia', 2.99, 'loaf', true, false, false, NULL, '["Multigrain Bread", "Gluten Free Bread"]'),
('Fresh Alphonso Mangoes', 'Produce', 'Ratnagiri', 6.50, 'kg', true, true, true, 'Summer Special', '["Papaya", "Peaches"]'),
('Organic Apples (Gala)', 'Produce', 'Washington', 3.99, 'kg', true, true, false, NULL, '["Pears", "Green Apples"]'),
('Organic Bananas', 'Produce', 'Organic Valley', 1.80, 'bunch', true, true, false, NULL, '["Plantains"]'),
('Colgate Total Toothpaste', 'Personal Care', 'Colgate', 4.50, 'tube', true, false, false, NULL, '["Sensodyne Toothpaste", "Pepsodent"]'),
('Sensodyne Herbal Toothpaste', 'Personal Care', 'Sensodyne', 4.99, 'tube', true, false, false, NULL, '["Colgate Toothpaste"]'),
('Basmati Rice Premium 5kg', 'Pantry', 'India Gate', 14.99, 'pack', true, false, false, NULL, '["Jasmine Rice", "Brown Rice"]'),
('Greek Yogurt Vanilla', 'Dairy', 'Epigamia', 2.49, 'cup', true, false, false, NULL, '["Plain Yogurt", "Coconut Milk Yogurt"]'),
('Natural Organic Honey', 'Pantry', 'Dabur Organic', 7.99, 'jar', true, true, false, NULL, '["Maple Syrup", "Agave Nectar"]'),
('Green Tea Mint & Lemon', 'Beverages', 'Lipton', 5.20, 'box', true, true, false, NULL, '["Chamomile Tea", "Matcha Tea"]'),
('Sparkling Water 6-Pack', 'Beverages', 'Perrier', 6.99, 'pack', true, false, false, NULL, '["Soda Water", "Flavored Water"]'),
('Dark Chocolate 70%', 'Snacks', 'Lindt', 3.80, 'bar', true, false, false, NULL, '["Cocoa Nibs", "Milk Chocolate"]')
ON CONFLICT DO NOTHING;

-- SEED DATA FOR REORDER SUGGESTIONS
INSERT INTO public.purchase_history (product_name, category, buy_count, days_interval, last_purchased_days_ago, suggested_reason, default_unit, default_price) VALUES
('Brown Whole Wheat Bread', 'Bakery', 8, 5, 6, 'Bought 8 times recently. Usually reordered every 5 days.', 'loaf', 2.99),
('Fresh Whole Milk', 'Dairy', 12, 4, 4, 'Bought 12 times recently. You are likely running low on milk.', 'bottle', 3.50),
('Farm Fresh Eggs', 'Produce', 6, 7, 7, 'Weekly essential. Last bought 7 days ago.', 'dozen', 4.25),
('Organic Bananas', 'Produce', 5, 6, 5, 'High frequency purchase. Great for daily nutrition.', 'bunch', 1.80)
ON CONFLICT DO NOTHING;

-- SEED DEFAULT SHOPPING LIST ITEMS
INSERT INTO public.shopping_items (name, category, quantity, unit, is_completed, price) VALUES
('Fresh Whole Milk', 'Dairy', 2, 'bottle', false, 3.50),
('Organic Apples (Gala)', 'Produce', 1.5, 'kg', false, 3.99),
('Brown Whole Wheat Bread', 'Bakery', 1, 'loaf', true, 2.99)
ON CONFLICT DO NOTHING;
