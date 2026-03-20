import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as File;

    if (!audio) {
      return NextResponse.json({ error: 'No audio file' }, { status: 400 });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return NextResponse.json({
        text: '[Voice message — add OPENAI_API_KEY for transcription]',
        language: 'en',
        fallback: true
      });
    }

    const whisperForm = new FormData();
    whisperForm.append('file', audio, 'audio.webm');
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('response_format', 'json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: whisperForm
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.text || '';
    const isArabic = /[\u0600-\u06FF]/.test(text);

    return NextResponse.json({ text, language: isArabic ? 'ar' : 'en' });
  } catch (error: any) {
    return NextResponse.json({
      text: '[Voice message — transcription failed]',
      language: 'en',
      error: error.message
    }, { status: 500 });
  }
}
