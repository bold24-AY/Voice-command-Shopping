'use client';

import React, { useState, useMemo } from 'react';
import { Product, CategoryType } from '@/types';
import { Search, Filter, Plus, Check, Leaf, Tag } from 'lucide-react';

interface ProductSearchCatalogProps {
  products: Product[];
  searchQuery: string;
  priceFilter?: { maxPrice?: number; minPrice?: number };
  onAddToCart: (product: Product) => void;
}

export const ProductSearchCatalog: React.FC<ProductSearchCatalogProps> = ({
  products,
  searchQuery,
  priceFilter,
  onAddToCart
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [priceCap, setPriceCap] = useState<number | null>(priceFilter?.maxPrice || null);
  const [addedProductIds, setAddedProductIds] = useState<Record<string, boolean>>({});

  const categories = ['All', 'Produce', 'Dairy', 'Bakery', 'Beverages', 'Snacks', 'Pantry', 'Personal Care'];

  // Filter products based on search query, price cap, and category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category filter
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }
      // Price filter from voice or manual slider
      const maxPriceToApply = priceCap || priceFilter?.maxPrice;
      if (maxPriceToApply && p.price > maxPriceToApply) {
        return false;
      }
      // Text search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        const matchesSubstitutes = p.substitutes.some(s => s.toLowerCase().includes(q));
        return matchesName || matchesBrand || matchesCategory || matchesSubstitutes;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery, priceCap, priceFilter]);

  const handleAdd = (product: Product) => {
    onAddToCart(product);
    setAddedProductIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedProductIds(prev => ({ ...prev, [product.id]: false }));
    }, 1800);
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 mt-8">
      
      {/* SECTION TITLE & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-[#2874f0]" />
            <h3 className="font-bold text-lg text-gray-900">Voice-Activated Product Catalog</h3>
          </div>
          <p className="text-xs text-gray-500">
            {searchQuery
              ? `Showing results for "${searchQuery}"`
              : priceFilter?.maxPrice
              ? `Filtered under $${priceFilter.maxPrice}`
              : 'Browse items or search using voice filter ("toothpaste under $5")'}
          </p>
        </div>

        {/* PRICE FILTER PILLS */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-gray-400" /> Max Price:
          </span>
          {[null, 3, 5, 10, 15].map((price) => (
            <button
              key={price ?? 'all'}
              onClick={() => setPriceCap(price)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                priceCap === price
                  ? 'bg-[#2874f0] text-white font-bold border-[#2874f0]'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
              }`}
            >
              {price ? `Under $${price}` : 'All Prices'}
            </button>
          ))}
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex overflow-x-auto gap-2 pb-3 mb-4 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-[#2874f0] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PRODUCT CARDS GRID */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
          No products found matching your search or voice filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const isAdded = addedProductIds[product.id];
            return (
              <div
                key={product.id}
                className="bg-white hover:bg-blue-50/20 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  
                  {/* BADGES */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-extrabold uppercase text-[#2874f0] bg-blue-50 px-2 py-0.5 rounded">
                      {product.brand}
                    </span>

                    {product.is_organic && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        <Leaf className="w-3 h-3 text-emerald-600" /> Organic
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{product.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-extrabold text-base text-gray-900">${product.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-400">/ {product.unit}</span>
                  </div>

                  {/* SUBSTITUTES CHIP PREVIEW */}
                  {product.substitutes.length > 0 && (
                    <div className="mt-2 text-[10px] text-gray-500 truncate">
                      <span className="font-semibold text-purple-600">Alt:</span> {product.substitutes.join(', ')}
                    </div>
                  )}

                </div>

                {/* ADD TO CART BUTTON */}
                <button
                  onClick={() => handleAdd(product)}
                  className={`mt-4 w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#ffe500] text-[#2874f0] hover:bg-[#ffbe00] shadow-sm'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add to List</span>
                    </>
                  )}
                </button>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
