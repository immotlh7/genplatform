'use client'

import { useState, useEffect } from 'react'

// CSRF token utilities for React components
export function useCSRF() {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Get existing token from cookie or generate new one
    const existingToken = getCSRFTokenFromCookie()
    if (existingToken) {
      setToken(existingToken)
    } else {
      const newToken = generateCSRFToken()
      setCSRFTokenCookie(newToken)
      setToken(newToken)
    }
  }, [])

  const getCSRFTokenFromCookie = (): string | null => {
    if (typeof document === 'undefined') return null
    
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'csrf-token') {
        return decodeURIComponent(value)
      }
    }
    return null
  }

  const generateCSRFToken = (): string => {
    return 'csrf-' + Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  const setCSRFTokenCookie = (token: string): void => {
    if (typeof document !== 'undefined') {
      const maxAge = 24 * 60 * 60 // 24 hours
      document.cookie = `csrf-token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; samesite=lax`
    }
  }

  // Add CSRF token to form data
  const addTokenToFormData = (formData: FormData): FormData => {
    if (token) {
      formData.append('csrfToken', token)
    }
    return formData
  }

  // Add CSRF token to headers
  const addTokenToHeaders = (headers: HeadersInit = {}): HeadersInit => {
    if (token) {
      return {
        ...headers,
        'X-CSRF-Token': token
      }
    }
    return headers
  }

  // Create a fetch wrapper with CSRF protection
  const csrfFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const method = options.method?.toUpperCase() || 'GET'
    
    // Only add CSRF token for state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && token) {
      const headers = new Headers(options.headers)
      headers.set('X-CSRF-Token', token)
      
      // If sending JSON data, add token to body
      if (headers.get('content-type')?.includes('application/json') && options.body) {
        try {
          const bodyObj = JSON.parse(options.body as string)
          bodyObj.csrfToken = token
          options.body = JSON.stringify(bodyObj)
        } catch {
          // If body parsing fails, token is already in headers
        }
      }
      
      options.headers = headers
    }

    return fetch(url, options)
  }

  return {
    token,
    addTokenToFormData,
    addTokenToHeaders,
    csrfFetch
  }
}

// Higher-order component to provide CSRF protection to forms
export function withCSRF<T extends React.ComponentProps<any>>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return function CSRFProtectedComponent(props: T) {
    const { token, addTokenToFormData, addTokenToHeaders, csrfFetch } = useCSRF()

    const enhancedProps = {
      ...props,
      csrfToken: token,
      addCSRFToken: addTokenToFormData,
      addCSRFHeaders: addTokenToHeaders,
      csrfFetch
    }

    return <Component {...enhancedProps} />
  }
}