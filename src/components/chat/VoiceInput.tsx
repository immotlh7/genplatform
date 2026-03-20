'use client';

import { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props { onTranscript: (text: string) => void; }

export function VoiceInput({ onTranscript }: Props) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setProcessing(true);
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const form = new FormData();
          form.append('audio', blob, 'audio.webm');
          const res = await fetch('/api/chat/transcribe', { method: 'POST', body: form });
          const data = await res.json();
          if (data.text) onTranscript(data.text);
        } catch {}
        setProcessing(false);
        setSeconds(0);
      };
      recorder.start();
      mediaRef.current = recorder;
      setRecording(true);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      alert('لا يمكن الوصول للميكروفون');
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  };

  return (
    <Button
      variant={recording ? 'destructive' : 'outline'}
      size="icon"
      className={`h-9 w-9 ${recording ? 'animate-pulse' : ''}`}
      onClick={recording ? stopRecording : startRecording}
      disabled={processing}
      title={recording ? `Recording... ${seconds}s (click to stop)` : 'Voice input'}
    >
      {processing ? <Loader2 className="h-4 w-4 animate-spin" /> :
       recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}
