import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('file') as File;
    // language is optional — if not sent, Whisper auto-detects (best for Gujarati)
    const language = formData.get('language') as string | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 });
    }

    const groqFormData = new FormData();
    groqFormData.append('file', audioFile, audioFile.name || 'audio.webm');
    groqFormData.append('model', 'whisper-large-v3');
    groqFormData.append('response_format', 'json');

    // Only set language when explicitly known — omit it for auto-detect (Gujarati, mixed etc.)
    if (language && language.trim() !== '') {
      groqFormData.append('language', language.trim());
    }

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: groqFormData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq Whisper API Error:', response.status, errorText);
      return NextResponse.json({ error: 'Groq audio transcription failed', details: errorText }, { status: response.status });
    }

    const data = await response.json();
    const transcript = data.text || '';

    console.log(`[Speech] lang=${language || 'auto'} → "${transcript}"`);

    return NextResponse.json({ transcript, detected_language: data.language });
  } catch (error: any) {
    console.error('Speech Route Error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error.message },
      { status: 500 }
    );
  }
}
