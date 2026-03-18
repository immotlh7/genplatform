/**
 * React Hook for CSRF Protection
 * Manages CSRF tokens for forms and API requests
 */

import { useState, useEffect, useCallback } from 'react'
import { getCSRFConfig, createProtectedFetch } from '@/lib/csrf'

interface CSRFHook {
  csrfToken: string | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  protectedFetch: (url: string, options?: RequestInit) => Promise<Response>
  getFormProps: () => { [key: string]: string }
  getHeaderProps: () => { [key: string]: string }
}

/**
 * Hook for managing CSRF tokens
 */
export function useCSRF(): CSRFHook {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const config = getCSRFConfig()

  // Get CSRF token from cookie or fetch new one
  const fetchCSRFToken = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // First, try to get token from cookie
      const cookieToken = getCookie(config.cookieName)
      
      if (cookieToken) {
        setCsrfToken(cookieToken)
        setLoading(false)
        return
      }
      
      // If no cookie token, fetch from API
      const response = await fetch('/api/csrf-token')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success || !data.csrfToken) {
        throw new Error('Invalid CSRF token response')
      }
      
      setCsrfToken(data.csrfToken)
      
    } catch (err) {
      console.error('CSRF token fetch failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to get CSRF token')
    } finally {
      setLoading(false)
    }
  }, [config.cookieName])

  // Refresh token
  const refresh = useCallback(async () => {
    await fetchCSRFToken()
  }, [fetchCSRFToken])

  // Initialize on mount
  useEffect(() => {
    fetchCSRFToken()
  }, [fetchCSRFToken])

  // Create protected fetch function
  const protectedFetch = useCallback((url: string, options: RequestInit = {}) => {
    if (!csrfToken) {
      return Promise.reject(new Error('CSRF token not available'))
    }
    
    const protectedFetcher = createProtectedFetch(csrfToken)
    return protectedFetcher(url, options)
  }, [csrfToken])

  // Get form props for easy integration
  const getFormProps = useCallback(() => {
    if (!csrfToken) return {}
    
    return {
      [config.formFieldName]: csrfToken
    }
  }, [csrfToken, config.formFieldName])

  // Get header props for fetch requests
  const getHeaderProps = useCallback(() => {
    if (!csrfToken) return {}
    
    return {
      [config.headerName]: csrfToken
    }
  }, [csrfToken, config.headerName])

  return {
    csrfToken,
    loading,
    error,
    refresh,
    protectedFetch,
    getFormProps,
    getHeaderProps
  }
}

/**
 * Hook for protecting a specific form
 */
export function useCSRFForm(onSubmit?: (data: FormData, csrfToken: string) => Promise<void>) {
  const { csrfToken, loading, error, protectedFetch } = useCSRF()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!csrfToken) {
      setSubmitError('CSRF token not available')
      return
    }
    
    if (!onSubmit) {
      return
    }
    
    setSubmitting(true)
    setSubmitError(null)
    
    try {
      const formData = new FormData(event.currentTarget)
      await onSubmit(formData, csrfToken)
    } catch (err) {
      console.error('Form submission failed:', err)
      setSubmitError(err instanceof Error ? err.message : 'Form submission failed')
    } finally {
      setSubmitting(false)
    }
  }, [csrfToken, onSubmit])

  // Get props for form element
  const getFormElementProps = useCallback(() => ({
    onSubmit: handleSubmit
  }), [handleSubmit])

  // Get props for hidden CSRF input
  const getCSRFInputProps = useCallback(() => ({
    type: 'hidden',
    name: getCSRFConfig().formFieldName,
    value: csrfToken || ''
  }), [csrfToken])

  return {
    csrfToken,
    loading,
    error,
    submitting,
    submitError,
    protectedFetch,
    getFormElementProps,
    getCSRFInputProps,
    handleSubmit
  }
}

/**
 * Utility to get cookie value
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null // Server-side
  }
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  
  return null
}

/**
 * Component for automatically including CSRF token in forms
 */
export function CSRFInput(): JSX.Element | null {
  const { csrfToken } = useCSRF()
  const config = getCSRFConfig()
  
  if (!csrfToken) {
    return null
  }
  
  return (
    <input
      type="hidden"
      name={config.formFieldName}
      value={csrfToken}
    />
  )
}

/**
 * Higher-order component for CSRF protection
 */
export function withCSRFProtection<T extends object>(
  WrappedComponent: React.ComponentType<T>
): React.ComponentType<T> {
  return function CSRFProtectedComponent(props: T) {
    const csrf = useCSRF()
    
    if (csrf.loading) {
      return <div>Loading CSRF protection...</div>
    }
    
    if (csrf.error) {
      return <div>CSRF protection error: {csrf.error}</div>
    }
    
    return <WrappedComponent {...props} />
  }
}