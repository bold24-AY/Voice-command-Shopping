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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check audio capabilities
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(hasMediaDevices || !!SpeechRecognition);
    }
  }, []);

  // Audio Speech Synthesis playback
  const speakText = useCallback((text: string, lang: string = 'en-US') => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Send transcript to Gemini NLP route
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

      if (!response.ok) {
        throw new Error('Failed to process voice command with AI');
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
      console.error('Voice intent processing error:', err);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: err.message || 'Error executing voice command'
      }));
    }
  }, [onIntentProcessed, speakText]);

  // Transcribe Recorded Audio Blob via Groq Whisper API
  const transcribeAudioBlob = useCallback(async (audioBlob: Blob, lang: string) => {
    setState(prev => ({ ...prev, isProcessing: true, transcript: 'Transcribing speech via Groq Whisper...' }));

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice_recording.webm');
      formData.append('language', lang);

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

  // Start Voice Recording with Explicit Mic Permission Request
  const startListening = useCallback(async () => {
    if (typeof window === 'undefined') return;

    setState(prev => ({
      ...prev,
      isListening: true,
      transcript: 'Listening... (Speak now)',
      error: null
    }));

    // Method A: Try Browser MediaRecorder API with Groq Whisper (High Accuracy)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        audioChunksRef.current = [];

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          if (audioBlob.size > 0) {
            transcribeAudioBlob(audioBlob, state.language);
          }
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        return;
      } catch (micErr: any) {
        console.warn('Microphone permission or MediaRecorder error:', micErr);
        if (micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError') {
          setState(prev => ({
            ...prev,
            isListening: false,
            error: 'Microphone permission denied. Please allow microphone access in your browser address bar.'
          }));
          return;
        }
      }
    }

    // Method B: Web Speech API Fallback
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = state.language;

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
          setState(prev => ({ ...prev, isListening: false, error: `Voice error: ${event.error}` }));
        };

        recognition.onend = () => {
          setState(prev => {
            if (prev.transcript && prev.isListening) {
              processTranscript(prev.transcript, prev.language);
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
      error: 'Microphone access is not supported or blocked by browser settings.'
    }));
  }, [state.language, transcribeAudioBlob, processTranscript]);

  // Stop Listening & Finalize Recording
  const stopListening = useCallback(() => {
    setState(prev => ({ ...prev, isListening: false }));

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
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
