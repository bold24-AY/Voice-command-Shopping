'use client';

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Header } from '@/components/Header';
import { VoiceControlCenter } from '@/components/VoiceControlCenter';
import { ShoppingList } from '@/components/ShoppingList';
import { SmartSuggestions } from '@/components/SmartSuggestions';
import { ProductSearchCatalog } from '@/components/ProductSearchCatalog';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { supabase, INITIAL_PRODUCTS, INITIAL_SHOPPING_ITEMS, INITIAL_SUGGESTIONS } from '@/lib/supabase';
import { ShoppingItem, Product, PurchaseHistoryItem, VoiceIntentResult, CategoryType } from '@/types';
import { Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [suggestions, setSuggestions] = useState<PurchaseHistoryItem[]>(INITIAL_SUGGESTIONS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<{ maxPrice?: number; minPrice?: number } | undefined>(undefined);
  const [activeToast, setActiveToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Trigger Toast Notification
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setActiveToast({ message, type });
    setTimeout(() => setActiveToast(null), 3500);
  };

  // LOAD INITIAL DATA FROM SUPABASE OR IN-MEMORY FALLBACK
  useEffect(() => {
    async function loadData() {
      try {
        const { data: dbItems, error: itemsErr } = await supabase.from('shopping_items').select('*').order('created_at', { ascending: false });
        if (!itemsErr && dbItems && dbItems.length > 0) {
          setItems(dbItems as ShoppingItem[]);
        } else {
          setItems(INITIAL_SHOPPING_ITEMS);
        }

        const { data: dbProds, error: prodsErr } = await supabase.from('products').select('*');
        if (!prodsErr && dbProds && dbProds.length > 0) {
          setProducts(dbProds as Product[]);
        }

        const { data: dbSugs, error: sugsErr } = await supabase.from('purchase_history').select('*');
        if (!sugsErr && dbSugs && dbSugs.length > 0) {
          setSuggestions(dbSugs as PurchaseHistoryItem[]);
        }
      } catch (err) {
        console.warn('Supabase fetch fallback to local state:', err);
        setItems(INITIAL_SHOPPING_ITEMS);
      }
    }
    loadData();
  }, []);

  // VOICE INTENT HANDLER
  const handleVoiceIntent = useCallback((result: VoiceIntentResult) => {
    console.log('Voice Intent Received:', result);

    if (result.intent === 'ADD_ITEM' && result.items && result.items.length > 0) {
      setItems(prev => {
        let updated = [...prev];
        result.items?.forEach(extracted => {
          const existingIdx = updated.findIndex(i => i.name.toLowerCase() === extracted.name.toLowerCase());
          if (existingIdx >= 0) {
            updated[existingIdx] = {
              ...updated[existingIdx],
              quantity: updated[existingIdx].quantity + extracted.quantity
            };
          } else {
            updated.unshift({
              id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              name: extracted.name,
              category: extracted.category || 'Pantry',
              quantity: extracted.quantity || 1,
              unit: extracted.unit || 'pack',
              is_completed: false,
              price: extracted.price || 3.50,
              created_at: new Date().toISOString()
            });
          }
        });
        return updated;
      });

      showToast(`Added ${result.items.map(i => `${i.quantity} ${i.name}`).join(', ')} to shopping list!`);
    } 
    else if (result.intent === 'REMOVE_ITEM' && result.items && result.items.length > 0) {
      const itemToRemove = result.items[0].name.toLowerCase();
      setItems(prev => prev.filter(i => !i.name.toLowerCase().includes(itemToRemove)));
      showToast(`Removed "${result.items[0].name}" from your list`, 'info');
    }
    else if (result.intent === 'SEARCH_PRODUCTS') {
      if (result.searchQuery) {
        setSearchQuery(result.searchQuery);
        showToast(`Filtered catalogue for "${result.searchQuery}"`, 'info');
      }
    }
    else if (result.intent === 'FILTER_PRODUCTS') {
      if (result.priceFilter) {
        setPriceFilter(result.priceFilter);
        if (result.searchQuery) setSearchQuery(result.searchQuery);
        showToast(`Filtered items under $${result.priceFilter.maxPrice}`, 'info');
      }
    }
    else if (result.intent === 'CLEAR_LIST') {
      setItems([]);
      showToast('Cleared all items from your shopping list', 'info');
    }
  }, []);

  // INITIALIZE VOICE HOOK
  const voice = useVoiceRecognition(handleVoiceIntent);

  // SHOPPING LIST ACTIONS
  const handleToggleComplete = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextCompleted = !item.is_completed;
        if (nextCompleted) {
          confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
        }
        return { ...item, is_completed: nextCompleted };
      }
      return item;
    }));
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    showToast('Item removed', 'info');
  };

  const handleClearAll = () => {
    setItems([]);
    showToast('Shopping list cleared', 'info');
  };

  // ADD FROM SUGGESTION OR PRODUCT CATALOG
  const handleAddCustom = (name: string, category: CategoryType, quantity: number, unit: string, price: number) => {
    setItems(prev => {
      const existingIdx = prev.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + quantity };
        return updated;
      }
      return [
        {
          id: 'item-' + Date.now(),
          name,
          category,
          quantity,
          unit,
          is_completed: false,
          price,
          created_at: new Date().toISOString()
        },
        ...prev
      ];
    });
    showToast(`Added "${name}" to your list!`);
  };

  // RESET DEMO DATA
  const handleResetDemo = () => {
    setItems(INITIAL_SHOPPING_ITEMS);
    setProducts(INITIAL_PRODUCTS);
    setSuggestions(INITIAL_SUGGESTIONS);
    setSearchQuery('');
    setPriceFilter(undefined);
    showToast('Reset to default demo data', 'info');
  };

  const totalItemsCount = items.length;
  const totalPriceSum = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const seasonalProducts = products.filter(p => p.is_seasonal);

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* HEADER */}
      <Header
        itemCount={totalItemsCount}
        totalPrice={totalPriceSum}
        selectedLanguage={voice.language}
        onLanguageChange={voice.setLanguage}
        onSearchClick={() => {}}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onResetDemo={handleResetDemo}
        onMicClick={voice.isListening ? voice.stopListening : voice.startListening}
      />

      {/* TOAST FEEDBACK FLOATING PILL */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold text-white border ${
            activeToast.type === 'success' ? 'bg-emerald-600 border-emerald-400' : 'bg-[#2874f0] border-blue-300'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
            <span>{activeToast.message}</span>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VOICE HERO CONTROL CENTER */}
        <VoiceControlCenter
          isListening={voice.isListening}
          isProcessing={voice.isProcessing}
          transcript={voice.transcript}
          lastResult={voice.lastResult}
          error={voice.error}
          language={voice.language}
          onStartListening={voice.startListening}
          onStopListening={voice.stopListening}
          onSubmitManualText={voice.submitManualText}
        />

        {/* 2-COLUMN CORE WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: SHOPPING LIST (7 COLS) */}
          <div className="lg:col-span-7 space-y-6">
            <ShoppingList
              items={items}
              onToggleComplete={handleToggleComplete}
              onUpdateQuantity={handleUpdateQuantity}
              onDeleteItem={handleDeleteItem}
              onClearAll={handleClearAll}
            />
          </div>

          {/* RIGHT COLUMN: SMART SUGGESTIONS (5 COLS) */}
          <div className="lg:col-span-5 space-y-6">
            <SmartSuggestions
              suggestions={suggestions}
              seasonalProducts={seasonalProducts}
              onAddSuggestion={handleAddCustom}
            />
          </div>

        </div>

        {/* VOICE-ACTIVATED PRODUCT CATALOG SEARCH SECTION */}
        <ProductSearchCatalog
          products={products}
          searchQuery={searchQuery}
          priceFilter={priceFilter}
          onAddToCart={(prod) => handleAddCustom(prod.name, prod.category, 1, prod.unit, prod.price)}
        />

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-6 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2874f0]" />
            <span>Voice Command Shopping Assistant — Technical Assessment Project</span>
          </div>
          <div className="flex items-center gap-4 text-gray-600">
            <span className="flex items-center gap-1 font-semibold text-gray-800">
              <Zap className="w-3.5 h-3.5 text-[#fb641b]" /> Powered by Gemini AI & Supabase
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
