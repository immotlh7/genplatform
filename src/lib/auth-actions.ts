'use client';

export async function signOut(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  // Force full page reload to clear all client state
  window.location.href = '/login';
}
