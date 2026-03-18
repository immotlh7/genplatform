/**
 * CSRF Protected Form Component
 * Automatically includes CSRF token and handles protection
 */

'use client'

import { useCSRFForm } from '@/hooks/useCSRF'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Shield } from 'lucide-react'

interface CSRFProtectedFormProps {
  children: React.ReactNode
  onSubmit: (data: FormData, csrfToken: string) => Promise<void>
  className?: string
  submitText?: string
  disabled?: boolean
}

export function CSRFProtectedForm({
  children,
  onSubmit,
  className = '',
  submitText = 'Submit',
  disabled = false
}: CSRFProtectedFormProps) {
  const {
    loading,
    error,
    submitting,
    submitError,
    getFormElementProps,
    getCSRFInputProps
  } = useCSRFForm(onSubmit)

  if (loading) {
    return (
      <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border">
        <Shield className="h-5 w-5 text-blue-600 animate-pulse" />
        <span className="text-blue-800">Initializing security protection...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Security error: {error}. Please refresh the page.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form {...getFormElementProps()} className={className}>
      {/* Hidden CSRF token field */}
      <input {...getCSRFInputProps()} />
      
      {/* Form content */}
      {children}
      
      {/* Submit error display */}
      {submitError && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {submitError}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Submit button (optional - forms can provide their own) */}
      {submitText && (
        <Button 
          type="submit" 
          disabled={disabled || submitting}
          className="mt-4"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processing...
            </>
          ) : (
            submitText
          )}
        </Button>
      )}
    </form>
  )
}

/**
 * Simple CSRF input component for existing forms
 */
export function CSRFInput() {
  const { useCSRF } = require('@/hooks/useCSRF')
  const { csrfToken } = useCSRF()
  
  if (!csrfToken) return null
  
  return (
    <input
      type="hidden"
      name="csrfToken"
      value={csrfToken}
    />
  )
}

/**
 * CSRF status indicator component
 */
export function CSRFStatus() {
  const { useCSRF } = require('@/hooks/useCSRF')
  const { csrfToken, loading, error } = useCSRF()
  
  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span>Securing form...</span>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center space-x-2 text-sm text-red-600">
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <span>Security error</span>
      </div>
    )
  }
  
  if (csrfToken) {
    return (
      <div className="flex items-center space-x-2 text-sm text-green-600">
        <Shield className="w-3 h-3" />
        <span>CSRF protected</span>
      </div>
    )
  }
  
  return null
}