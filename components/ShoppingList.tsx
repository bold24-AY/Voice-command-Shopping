'use client';

import React from 'react';
import { ShoppingItem, CategoryType } from '@/types';
import { Trash2, Plus, Minus, CheckCircle, Circle, ShoppingCart, Trash, ChevronDown, ChevronUp } from 'lucide-react';

interface ShoppingListProps {
  items: ShoppingItem[];
  onToggleComplete: (id: string) => void;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

const CATEGORY_ICONS: Record<CategoryType, string> = {
  Produce: '🥬',
  Dairy: '🥛',
  Bakery: '🍞',
  Beverages: '🧃',
  Snacks: '🍿',
  Pantry: '🌾',
  Household: '🧹',
  'Personal Care': '🪥'
};

export const ShoppingList: React.FC<ShoppingListProps> = ({
  items,
  onToggleComplete,
  onUpdateQuantity,
  onDeleteItem,
  onClearAll
}) => {
  // Group items by category
  const categories: CategoryType[] = [
    'Produce',
    'Dairy',
    'Bakery',
    'Beverages',
    'Snacks',
    'Pantry',
    'Household',
    'Personal Care'
  ];

  const groupedItems = categories.reduce((acc, cat) => {
    const catItems = items.filter(item => item.category === cat);
    if (catItems.length > 0) {
      acc[cat] = catItems;
    }
    return acc;
  }, {} as Record<CategoryType, ShoppingItem[]>);

  const totalItems = items.length;
  const completedItemsCount = items.filter(i => i.is_completed).length;
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const progressPercent = totalItems > 0 ? Math.round((completedItemsCount / totalItems) * 100) : 0;

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 bg-blue-50 text-[#2874f0] rounded-full flex items-center justify-center mb-3">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Your Shopping List is Empty</h3>
        <p className="text-sm text-gray-500 max-w-sm mt-1">
          Use the voice button above to say something like &ldquo;Add 2 bottles of milk&rdquo; or click any suggestion below!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
      
      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50/40 p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-gray-900">Your Shopping List</h3>
            <span className="bg-[#2874f0] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Auto-organized by category</p>
        </div>

        {/* PROGRESS & CLEAR ALL */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-xs text-gray-500 font-medium">Purchased ({completedItemsCount}/{totalItems})</span>
            <div className="w-28 bg-gray-200 h-2 rounded-full mt-1 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            onClick={onClearAll}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded border border-rose-200 flex items-center gap-1 transition-colors font-medium"
          >
            <Trash className="w-3.5 h-3.5" />
            <span>Clear List</span>
          </button>
        </div>
      </div>

      {/* CATEGORIES LIST */}
      <div className="divide-y divide-gray-100">
        {Object.entries(groupedItems).map(([category, catItems]) => {
          const cat = category as CategoryType;
          return (
            <div key={cat} className="p-4">
              
              {/* CATEGORY HEADER */}
              <div className="flex items-center gap-2 mb-3 pb-1 border-b border-gray-100">
                <span className="text-lg">{CATEGORY_ICONS[cat] || '🛒'}</span>
                <h4 className="font-bold text-sm text-gray-800">{cat}</h4>
                <span className="text-xs font-semibold text-gray-400">({catItems.length})</span>
              </div>

              {/* ITEM CARDS */}
              <div className="space-y-2">
                {catItems.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      item.is_completed
                        ? 'bg-gray-50/80 border-gray-200 text-gray-400 opacity-75'
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm text-gray-900'
                    }`}
                  >
                    
                    {/* LEFT CHECK & NAME */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => onToggleComplete(item.id)}
                        className="text-gray-400 hover:text-[#2874f0] transition-colors shrink-0"
                      >
                        {item.is_completed ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="truncate">
                        <span className={`font-semibold text-sm ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>${item.price.toFixed(2)} / {item.unit}</span>
                        </div>
                      </div>
                    </div>

                    {/* QUANTITY & ACTIONS */}
                    <div className="flex items-center gap-3 shrink-0">
                      
                      {/* QUANTITY STEPPER */}
                      <div className="flex items-center bg-gray-100 rounded-md border border-gray-200 p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.id, Math.max(0.5, item.quantity - 1))}
                          className="p-1 hover:bg-white rounded text-gray-600 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        
                        <span className="px-2 font-bold text-xs text-gray-800 min-w-[28px] text-center">
                          {item.quantity} <span className="text-[10px] font-normal text-gray-500">{item.unit}</span>
                        </span>

                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-white rounded text-gray-600 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* ITEM TOTAL PRICE */}
                      <span className="font-bold text-xs text-gray-900 w-16 text-right">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>

                      {/* DELETE ITEM */}
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="text-gray-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition-colors"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                ))}
              </div>

            </div>
          );
        })}
      </div>

      {/* FOOTER TOTAL PRICE SUMMARY */}
      <div className="bg-blue-50/50 p-4 border-t border-gray-200 flex items-center justify-between">
        <span className="font-semibold text-sm text-gray-700">Estimated Total Cost</span>
        <span className="font-extrabold text-lg text-[#2874f0]">${totalPrice.toFixed(2)}</span>
      </div>

    </div>
  );
};
