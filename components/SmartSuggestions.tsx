'use client';

import React, { useState } from 'react';
import { PurchaseHistoryItem, Product, CategoryType } from '@/types';
import { Sparkles, Plus, Clock, Sun, RefreshCw, Layers, Check } from 'lucide-react';

interface SmartSuggestionsProps {
  suggestions: PurchaseHistoryItem[];
  seasonalProducts: Product[];
  onAddSuggestion: (name: string, category: CategoryType, quantity: number, unit: string, price: number) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  suggestions,
  seasonalProducts,
  onAddSuggestion
}) => {
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const handleAdd = (id: string, name: string, category: CategoryType, qty: number, unit: string, price: number) => {
    onAddSuggestion(name, category, qty, unit, price);
    setAddedIds(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. PREDICTIVE REORDER SUGGESTIONS */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#ffe500]/20 text-[#fb641b] rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">Smart Reorder Suggestions</h3>
              <p className="text-xs text-gray-500">Based on your past purchase frequency</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {suggestions.map((sug) => {
            const isAdded = addedIds[sug.id];
            return (
              <div
                key={sug.id}
                className="bg-gray-50/70 hover:bg-white p-3.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#2874f0] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {sug.category}
                    </span>
                    <span className="text-xs font-bold text-gray-700">${sug.default_price.toFixed(2)}</span>
                  </div>

                  <h4 className="font-bold text-sm text-gray-900 mt-2">{sug.product_name}</h4>

                  {/* REASONING BADGE */}
                  <div className="mt-2 flex items-start gap-1.5 text-[11px] text-gray-600 bg-amber-50/70 p-2 rounded border border-amber-200/60">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="leading-tight">{sug.suggested_reason}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleAdd(sug.id, sug.product_name, sug.category, 1, sug.default_unit, sug.default_price)}
                  className={`mt-3 w-full py-1.5 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#2874f0] text-white hover:bg-[#1e58c8]'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added to List</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Suggestion</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. SEASONAL HIGHLIGHT BANNER */}
      {seasonalProducts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                <Sun className="w-6 h-6 text-[#ffe500] animate-spin-slow" />
              </div>
              <div>
                <span className="bg-[#ffe500] text-gray-900 font-black text-[10px] uppercase px-2 py-0.5 rounded tracking-wider">
                  {seasonalProducts[0].season_name || 'Fresh Season Pick'}
                </span>
                <h4 className="font-extrabold text-lg text-white mt-1">
                  {seasonalProducts[0].name} ({seasonalProducts[0].brand})
                </h4>
                <p className="text-xs text-amber-100">
                  Peak freshness right now! ${seasonalProducts[0].price.toFixed(2)} / {seasonalProducts[0].unit}
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                handleAdd(
                  seasonalProducts[0].id,
                  seasonalProducts[0].name,
                  seasonalProducts[0].category,
                  1,
                  seasonalProducts[0].unit,
                  seasonalProducts[0].price
                )
              }
              className="bg-white text-[#fb641b] hover:bg-amber-50 font-bold px-4 py-2 rounded-lg text-xs shadow-md transition-all shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Fresh Pick</span>
            </button>

          </div>
        </div>
      )}

      {/* 3. SMART PRODUCT SUBSTITUTES */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">Popular Smart Substitutes</h3>
            <p className="text-xs text-gray-500">Healthier & alternative options</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { original: 'Regular Milk', substitute: 'Organic Almond Milk', category: 'Dairy' as CategoryType, price: 4.99, unit: 'carton' },
            { original: 'Wheat Bread', substitute: 'Gluten Free Multigrain Bread', category: 'Bakery' as CategoryType, price: 3.49, unit: 'loaf' },
            { original: 'Regular Apples', substitute: 'Organic Gala Apples', category: 'Produce' as CategoryType, price: 3.99, unit: 'kg' },
            { original: 'Dairy Yogurt', substitute: 'Epigamia Greek Yogurt', category: 'Dairy' as CategoryType, price: 2.49, unit: 'cup' }
          ].map((sub, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-purple-50/60 hover:bg-purple-100/70 border border-purple-200 px-3 py-1.5 rounded-lg text-xs transition-colors"
            >
              <span className="text-gray-500 line-through">{sub.original}</span>
              <span className="text-purple-700 font-bold">➔ {sub.substitute}</span>
              <button
                onClick={() => handleAdd(`sub-${idx}`, sub.substitute, sub.category, 1, sub.unit, sub.price)}
                className="bg-purple-600 text-white hover:bg-purple-700 p-1 rounded font-semibold text-[10px] ml-1"
                title="Add substitute"
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
