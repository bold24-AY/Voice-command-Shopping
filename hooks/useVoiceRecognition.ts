'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceIntentResult, VoiceState } from '@/types';

// Map BCP-47 language tags to Groq Whisper ISO 639-1 codes
// Gujarati (gu) is not natively supported by Whisper so we let it auto-detect
// from the audio — Whisper handles it well via auto mode
const GROQ_LANG_MAP: Record<string, string | null> = {
  'en-IN': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'hi-IN': 'hi',
  'gu-IN': null, // null = auto-detect (Whisper handles Gujarati best this way)
  'es-ES': 'es',
  'fr-FR': 'fr',
};

export function useVoiceRecognition(onIntentProcessed?: (result: VoiceIntentResult) => void) {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    transcript: '',
    lastResult: null,
    error: null,
    language: 'en-IN'
  });

  // languageRef ensures startListening always reads the CURRENT language
  // (avoids stale closure bug where language stays "en-IN" forever)
  const languageRef = useRef('en-IN');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(hasMediaDevices || !!SpeechRecognition);
    }
  }, []);

  // Audio Speech Synthesis — speak response back in the selected language
  const speakText = useCallback((text: string, lang: string = 'en-IN') => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Send transcript + language to Gemini NLP route
  const processTranscript = useCallback(async (textToProcess: string, lang: string) => {
    if (!textToProcess.trim()) {
      setState(prev => ({ ...prev, isProcessing: false, isListening: false }));
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const response = await fetch('/api/nlp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: textToProcess, language: lang })
      });

      if (!response.ok) throw new Error('Failed to process voice command with AI');

      const result: VoiceIntentResult = await response.json();

      setState(prev => ({ ...prev, isProcessing: false, lastResult: result }));

      if (result.spokenResponse) {
        speakText(result.spokenResponse, lang);
      }

      if (onIntentProcessed) onIntentProcessed(result);
    } catch (err: any) {
      console.error('Voice intent processing error:', err);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: err.message || 'Error executing voice command'
      }));
    }
  }, [onIntentProcessed, speakText]);

  // Transcribe audio blob via Groq Whisper — passes correct ISO 639-1 language code
  const transcribeAudioBlob = useCallback(async (audioBlob: Blob, lang: string) => {
    const displayLang = lang.includes('-') ? lang.split('-')[0].toUpperCase() : lang.toUpperCase();
    setState(prev => ({ ...prev, isProcessing: true, transcript: `Transcribing ${displayLang} speech via Groq Whisper AI...` }));

    try {
      const groqLang = GROQ_LANG_MAP[lang] !== undefined ? GROQ_LANG_MAP[lang] : lang.split('-')[0];

      const formData = new FormData();
      formData.append('file', audioBlob, 'voice_recording.webm');
      // Only send language if it's defined (null means auto-detect for Gujarati)
      if (groqLang !== null) {
        formData.append('language', groqLang);
      }

      const res = await fetch('/api/speech', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Groq transcription failed');
      }

      const data = await res.json();
      const transcribedText = data.transcript || '';

      if (transcribedText.trim()) {
        setState(prev => ({ ...prev, transcript: transcribedText }));
        await processTranscript(transcribedText, lang);
      } else {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: 'No speech detected. Please speak clearly into the microphone.'
        }));
      }
    } catch (err: any) {
      console.error('Audio transcription error:', err);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: `Voice recognition error: ${err.message}`
      }));
    }
  }, [processTranscript]);

  // Start listening — reads language from ref (always current, no stale closure)
  const startListening = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const currentLang = languageRef.current;

    setState(prev => ({
      ...prev,
      isListening: true,
      transcript: 'Listening... (Speak now)',
      error: null,
      lastResult: null
    }));

    // Method A: MediaRecorder → Groq Whisper (works in all browsers, all languages)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        audioChunksRef.current = [];

        // Pick best supported mime type
        const mimeType = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          'audio/mp4',
          ''
        ].find(type => !type || MediaRecorder.isTypeSupported(type)) || '';

        const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const finalMime = mimeType.split(';')[0] || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          if (audioBlob.size > 100) {
            transcribeAudioBlob(audioBlob, currentLang);
          } else {
            setState(prev => ({
              ...prev,
              isProcessing: false,
              error: 'Recording too short. Please speak after tapping the mic.'
            }));
          }
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(100); // collect in 100ms chunks
        return;
      } catch (micErr: any) {
        if (micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError') {
          setState(prev => ({
            ...prev,
            isListening: false,
            error: 'Microphone permission denied. Click the 🔒 icon in your browser address bar and allow microphone.'
          }));
          return;
        }
        console.warn('MediaRecorder error, falling back to Web Speech API:', micErr);
      }
    }

    // Method B: Web Speech API fallback — sets lang correctly from ref
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = currentLang; // Use current language from ref

        recognition.onstart = () => {
          setState(prev => ({ ...prev, isListening: true, transcript: '', error: null }));
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setState(prev => ({ ...prev, transcript: currentTranscript }));
        };

        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            setState(prev => ({ ...prev, isListening: false, error: `Voice error: ${event.error}` }));
          }
        };

        recognition.onend = () => {
          setState(prev => {
            if (prev.transcript && prev.isListening) {
              processTranscript(prev.transcript, currentLang);
            }
            return { ...prev, isListening: false };
          });
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (e: any) {
        console.error('Speech recognition error:', e);
      }
    }

    setState(prev => ({
      ...prev,
      isListening: false,
      error: 'Microphone not supported. Please use Chrome or Edge browser.'
    }));
  }, [transcribeAudioBlob, processTranscript]);

  const stopListening = useCallback(() => {
    setState(prev => ({ ...prev, isListening: false }));

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  }, []);

  const setLanguage = useCallback((lang: string) => {
    languageRef.current = lang; // Keep ref in sync immediately
    setState(prev => ({ ...prev, language: lang }));
  }, []);

  const submitManualText = useCallback((text: string) => {
    const currentLang = languageRef.current;
    setState(prev => ({ ...prev, transcript: text }));
    processTranscript(text, currentLang);
  }, [processTranscript]);

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
