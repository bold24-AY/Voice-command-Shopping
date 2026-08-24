'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Sparkles, Send, Volume2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { VoiceIntentResult } from '@/types';

interface VoiceControlCenterProps {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  lastResult?: VoiceIntentResult | null;
  error?: string | null;
  language: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onSubmitManualText: (text: string) => void;
}

export const VoiceControlCenter: React.FC<VoiceControlCenterProps> = ({
  isListening,
  isProcessing,
  transcript,
  lastResult,
  error,
  language,
  onStartListening,
  onStopListening,
  onSubmitManualText,
}) => {
  const [manualInput, setManualInput] = useState('');

  const samplePrompts = [
    { label: '🥛 Add 2 bottles milk', text: 'Add 2 bottles of milk to my list' },
    { label: '🍎 2 kg Organic Apples', text: 'Buy 2 kg of organic gala apples' },
    { label: '🇮🇳 दूध और सेब (Hindi)', text: 'दूध और दो किलो सेब जोड़ो' },
    { label: '🇮🇳 સફરજન (Gujarati)', text: 'બે કિલો સફરજન ઉમેરો' },
    { label: '🔍 Toothpaste under $5', text: 'Find toothpaste under $5' },
    { label: '🍞 Remove Bread', text: 'Remove bread from my list' }
  ];

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onSubmitManualText(manualInput);
      setManualInput('');
    }
  };

  const handlePromptClick = (text: string) => {
    onSubmitManualText(text);
  };

  return (
    <div className="bg-gradient-to-r from-[#1752b0] via-[#2874f0] to-[#1e58c8] text-white rounded-2xl p-6 shadow-xl mb-8 border border-white/10 relative overflow-hidden">
      
      {/* BACKGROUND DECORATIVE GLOW */}
      <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-[#ffe500]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -top-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* LEFT VOICE HERO INSTRUCTION & MIC BUTTON */}
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto text-center sm:text-left">
          
          {/* MIC PULSE BUTTON */}
          <div className="relative flex items-center justify-center">
            {isListening && (
              <>
                <div className="absolute w-24 h-24 bg-[#ffe500]/30 rounded-full animate-ping" />
                <div className="absolute w-28 h-28 bg-[#ffe500]/20 rounded-full animate-pulse" />
              </>
            )}
            
            <button
              onClick={isListening ? onStopListening : onStartListening}
              disabled={isProcessing}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl z-10 ${
                isListening
                  ? 'bg-[#fb641b] text-white ring-4 ring-[#ffe500] scale-110'
                  : isProcessing
                  ? 'bg-amber-500 text-white animate-spin'
                  : 'bg-[#ffe500] text-[#2874f0] hover:scale-105 hover:shadow-[#ffe500]/50'
              }`}
            >
              {isListening ? (
                <MicOff className="w-10 h-10 animate-bounce" />
              ) : isProcessing ? (
                <Sparkles className="w-10 h-10" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="bg-[#ffe500]/20 text-[#ffe500] text-[11px] font-extrabold uppercase px-2 py-0.5 rounded border border-[#ffe500]/30 tracking-wider">
                Voice Assistant
              </span>
              <span className="text-xs text-blue-200">Lang: {language}</span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
              {isListening
                ? 'Listening to your voice...'
                : isProcessing
                ? 'Processing with Gemini AI...'
                : 'Tap Mic to Speak Commands'}
            </h2>

            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-md">
              Try: &ldquo;Add 2 bottles of milk&rdquo;, &ldquo;Find organic apples under $5&rdquo;, or &ldquo;Remove bread&rdquo;.
            </p>
          </div>
        </div>

        {/* RIGHT MANUAL INPUT FALLBACK & QUICK CHIPS */}
        <div className="w-full md:w-96 flex flex-col gap-3">
          
          {/* MANUAL TEXT SUBMISSION */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Or type voice command here..."
              disabled={isListening || isProcessing}
              className="flex-1 px-3 py-2 rounded-lg text-sm text-gray-900 bg-white/95 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffe500] placeholder-gray-500 shadow-inner"
            />
            <button
              type="submit"
              disabled={!manualInput.trim() || isProcessing}
              className="bg-[#ffe500] text-[#2874f0] font-bold px-3.5 py-2 rounded-lg hover:bg-[#ffbe00] disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* QUICK PROMPT CHIPS */}
          <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handlePromptClick(prompt.text)}
                disabled={isListening || isProcessing}
                className="bg-white/10 hover:bg-white/20 text-white text-[11px] px-2.5 py-1 rounded-full border border-white/15 transition-all truncate max-w-[180px]"
              >
                {prompt.label}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* LIVE TRANSCRIPT OR AI RESPONSE FEEDBACK BAR */}
      {(transcript || lastResult || error) && (
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          
          {error ? (
            <div className="flex items-center gap-2 text-rose-300 bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-500/30">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          ) : transcript && isListening ? (
            <div className="flex items-center gap-2 text-amber-200 animate-pulse bg-black/20 px-3 py-1.5 rounded-lg w-full">
              <Volume2 className="w-4 h-4 shrink-0 text-[#ffe500]" />
              <span className="font-medium italic">Hearing: &ldquo;{transcript}&rdquo;</span>
            </div>
          ) : lastResult ? (
            <div className="flex items-center gap-2 text-emerald-200 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/30 w-full">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-semibold text-white">{lastResult.spokenResponse}</span>
            </div>
          ) : null}

        </div>
      )}

    </div>
  );
};
