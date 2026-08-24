'use client';

import React from 'react';
import { ShoppingBag, Mic, Globe, RefreshCw, Sparkles, Search } from 'lucide-react';

interface HeaderProps {
  itemCount: number;
  totalPrice: number;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  onSearchClick: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onResetDemo: () => void;
  onMicClick: () => void;
  onCartClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  itemCount,
  totalPrice,
  selectedLanguage,
  onLanguageChange,
  onSearchClick,
  searchQuery,
  setSearchQuery,
  onResetDemo,
  onMicClick,
  onCartClick
}) => {
  const languages = [
    { code: 'en-IN', label: 'English (IN)' },
    { code: 'hi-IN', label: 'हिंदी (Hindi)' },
    { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)' },
    { code: 'es-ES', label: 'Español' },
    { code: 'fr-FR', label: 'Français' }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchClick();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#2874f0] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* BRAND LOGO */}
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-[#ffe500]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xl tracking-wide italic">
                <span>SmartCart</span>
                <span className="text-[#ffe500] text-xs uppercase font-extrabold not-italic bg-[#fb641b] px-1.5 py-0.5 rounded shadow-sm">
                  Plus AI
                </span>
              </div>
              <p className="text-[11px] text-blue-100 font-medium">Voice Command Grocery Assistant</p>
            </div>
          </div>

          {/* SEARCH & VOICE INPUT BAR */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xl relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products (e.g. 'organic apples under $5', 'milk')..."
              className="w-full pl-4 pr-20 py-2 rounded-sm text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffe500] bg-white shadow-inner"
            />
            <div className="absolute right-1 top-1 bottom-1 flex items-center gap-1">
              <button
                type="button"
                onClick={onMicClick}
                title="Tap to speak"
                className="bg-[#2874f0]/10 hover:bg-[#2874f0]/20 text-[#2874f0] p-1.5 rounded transition-all"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                type="submit"
                className="bg-[#ffe500] text-[#2874f0] hover:bg-[#ffbe00] font-semibold px-3 py-1.5 rounded text-xs flex items-center gap-1 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* LANGUAGE SELECTOR */}
            <div className="relative flex items-center bg-white/10 hover:bg-white/20 rounded px-2.5 py-1.5 transition-colors border border-white/20 text-xs">
              <Globe className="w-3.5 h-3.5 mr-1.5 text-[#ffe500]" />
              <select
                value={selectedLanguage}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="bg-transparent text-white text-xs focus:outline-none cursor-pointer pr-1"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code} className="text-gray-900 bg-white">
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* RESET / DEMO DATA BUTTON */}
            <button
              onClick={onResetDemo}
              title="Reset Demo Data"
              className="hidden sm:flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded border border-white/20 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {/* CART COUNT & TOTAL BADGE */}
            <button
              onClick={onCartClick}
              className="flex items-center bg-[#ffe500] text-[#2874f0] hover:bg-[#ffbe00] px-3.5 py-1.5 rounded-sm font-bold text-xs shadow-md gap-2 transition-all transform hover:scale-105"
            >
              <ShoppingBag className="w-4 h-4 text-[#2874f0]" />
              <div className="flex flex-col text-left leading-tight">
                <span>{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</span>
                <span className="text-[10px] text-[#fb641b] font-extrabold">${totalPrice.toFixed(2)}</span>
              </div>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
