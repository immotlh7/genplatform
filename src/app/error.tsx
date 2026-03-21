'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Send error to server for debugging
    fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: typeof window !== 'undefined' ? window.location.href : '',
        timestamp: new Date().toISOString()
      })
    }).catch(() => {})
  }, [error]);

  return (
    <div style={{padding:40,textAlign:'center'}}>
      <h2 style={{color:'red',marginBottom:16}}>Error</h2>
      <pre style={{textAlign:'left',background:'#111',padding:16,borderRadius:8,overflow:'auto',fontSize:12,color:'#f88',maxHeight:300}}>
        {error.message}
        {'\n\n'}
        {error.stack}
      </pre>
      <button onClick={reset} style={{marginTop:16,padding:'10px 24px',background:'#2563eb',color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}}>
        Try again
      </button>
    </div>
  );
}
