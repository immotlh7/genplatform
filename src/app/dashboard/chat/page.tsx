'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function OldChatRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/claude'); }, [router]);
  return <div style={{padding: 24, fontSize: 13, color: '#888'}}>Redirecting to Claude Chat...</div>;
}
