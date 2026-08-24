'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceIntentResult, VoiceState } from '@/types';

export function useVoiceRecognition(onIntentProcessed?: (result: VoiceIntentResult) => void) {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    transcript: '',
    lastResult: null,
    error: null,
    language: 'en-IN'
  });

  const [isSupported, setIsSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }
  }, []);

  const speakText = useCallback((text: string, lang: string = 'en-US') => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // cancel previous utterances
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const processTranscript = useCallback(async (textToProcess: string, lang: string) => {
    if (!textToProcess.trim()) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const response = await fetch('/api/nlp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: textToProcess, language: lang })
      });

      if (!response.ok) {
        throw new Error('Failed to parse voice command');
      }

      const result: VoiceIntentResult = await response.json();

      setState(prev => ({
        ...prev,
        isProcessing: false,
        lastResult: result
      }));

      if (result.spokenResponse) {
        speakText(result.spokenResponse, lang);
      }

      if (onIntentProcessed) {
        onIntentProcessed(result);
      }
    } catch (err: any) {
      console.error('Voice processing error:', err);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: err.message || 'Error parsing command'
      }));
    }
  }, [onIntentProcessed, speakText]);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setState(prev => ({ ...prev, error: 'Speech Recognition is not supported in this browser.' }));
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = state.language;

      recognition.onstart = () => {
        setState(prev => ({
          ...prev,
          isListening: true,
          transcript: '',
          error: null
        }));
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setState(prev => ({ ...prev, transcript: currentTranscript }));
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setState(prev => ({
            ...prev,
            isListening: false,
            error: `Voice error: ${event.error}`
          }));
        }
      };

      recognition.onend = () => {
        setState(prev => {
          if (prev.transcript && prev.isListening) {
            // Process automatically on speech end
            processTranscript(prev.transcript, prev.language);
          }
          return { ...prev, isListening: false };
        });
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error('Failed to start speech recognition:', e);
      setState(prev => ({ ...prev, isListening: false, error: e.message }));
    }
  }, [state.language, processTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setState(prev => ({ ...prev, isListening: false }));
    }
  }, []);

  const setLanguage = useCallback((lang: string) => {
    setState(prev => ({ ...prev, language: lang }));
  }, []);

  const submitManualText = useCallback((text: string) => {
    setState(prev => ({ ...prev, transcript: text }));
    processTranscript(text, state.language);
  }, [state.language, processTranscript]);

  return {
    ...state,
    isSupported,
    startListening,
    stopListening,
    setLanguage,
    submitManualText,
    speakText
  };
}
