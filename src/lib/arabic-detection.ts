/**
 * Arabic Text Detection Utilities
 * Enhanced detection with confidence scoring and context analysis
 * Created: 2026-03-18 for Task 1C-03
 */

// Arabic Unicode ranges
const ARABIC_RANGES = [
  [0x0600, 0x06FF], // Arabic
  [0x0750, 0x077F], // Arabic Supplement
  [0x08A0, 0x08FF], // Arabic Extended-A
  [0xFB50, 0xFDFF], // Arabic Presentation Forms-A
  [0xFE70, 0xFEFF], // Arabic Presentation Forms-B
]

// Arabic digits
const ARABIC_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/

// Common Arabic words for context detection
const COMMON_ARABIC_WORDS = [
  'في', 'من', 'إلى', 'على', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي',
  'مشروع', 'مهمة', 'فكرة', 'ميزة', 'تطبيق', 'كود', 'ملف', 'إنشاء', 'حذف', 'تعديل',
  'أنشئ', 'احذف', 'اكتب', 'افتح', 'أضف', 'شغل', 'ابني', 'انشر', 'ابحث', 'احفظ'
]

// Arabic text direction markers
const RTL_MARKERS = /[\u061C\u200E\u200F\u202A-\u202E]/

export interface ArabicDetectionResult {
  isArabic: boolean
  confidence: number
  metrics: {
    arabicChars: number
    totalChars: number
    arabicRatio: number
    wordCount: number
    arabicWords: number
    hasArabicDigits: boolean
    hasRTLMarkers: boolean
  }
  suggestions: string[]
}

/**
 * Detect if a character is Arabic
 */
export function isArabicChar(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false

  return ARABIC_RANGES.some(([start, end]) => 
    codePoint >= start && codePoint <= end
  )
}

/**
 * Advanced Arabic text detection with confidence scoring
 */
export function detectArabicText(text: string): ArabicDetectionResult {
  if (!text || text.trim().length === 0) {
    return {
      isArabic: false,
      confidence: 0,
      metrics: {
        arabicChars: 0,
        totalChars: 0,
        arabicRatio: 0,
        wordCount: 0,
        arabicWords: 0,
        hasArabicDigits: false,
        hasRTLMarkers: false
      },
      suggestions: []
    }
  }

  const cleanText = text.trim()
  const words = cleanText.split(/\s+/)
  
  // Count Arabic characters
  let arabicChars = 0
  let totalChars = 0

  for (const char of cleanText) {
    if (char.match(/\s/)) continue // Skip whitespace
    totalChars++
    if (isArabicChar(char)) {
      arabicChars++
    }
  }

  // Count Arabic words
  let arabicWords = 0
  for (const word of words) {
    if (word.split('').some(char => isArabicChar(char))) {
      arabicWords++
    }
  }

  // Check for Arabic-specific features
  const hasArabicDigits = ARABIC_DIGITS.test(cleanText)
  const hasRTLMarkers = RTL_MARKERS.test(cleanText)
  const hasCommonArabicWords = COMMON_ARABIC_WORDS.some(word => 
    cleanText.includes(word)
  )

  // Calculate ratios
  const arabicRatio = totalChars > 0 ? arabicChars / totalChars : 0
  const arabicWordRatio = words.length > 0 ? arabicWords / words.length : 0

  // Calculate confidence score
  let confidence = 0

  // Base confidence from character ratio
  confidence += arabicRatio * 0.6

  // Bonus for Arabic word ratio
  confidence += arabicWordRatio * 0.3

  // Bonus for Arabic-specific features
  if (hasArabicDigits) confidence += 0.05
  if (hasRTLMarkers) confidence += 0.05
  if (hasCommonArabicWords) confidence += 0.1

  // Penalty for mixed content
  if (arabicRatio > 0 && arabicRatio < 0.8) {
    confidence *= 0.9 // Small penalty for mixed text
  }

  // Determine if text is Arabic (multiple thresholds)
  const isArabic = confidence > 0.3 || arabicRatio > 0.4 || arabicWordRatio > 0.5

  // Generate suggestions based on analysis
  const suggestions: string[] = []

  if (isArabic) {
    if (confidence < 0.6) {
      suggestions.push('Mixed language detected - consider separating Arabic and English text')
    }
    if (arabicRatio < 0.5) {
      suggestions.push('Text contains both Arabic and Latin characters')
    }
    suggestions.push('Commander translation will be applied automatically')
  } else if (arabicChars > 0) {
    suggestions.push('Some Arabic characters detected but text appears to be primarily non-Arabic')
  }

  return {
    isArabic,
    confidence: Math.min(confidence, 1.0),
    metrics: {
      arabicChars,
      totalChars,
      arabicRatio,
      wordCount: words.length,
      arabicWords,
      hasArabicDigits,
      hasRTLMarkers
    },
    suggestions
  }
}

/**
 * Real-time Arabic detection for input fields
 */
export function useArabicDetection(text: string, options?: {
  minLength?: number
  debounceMs?: number
}) {
  const minLength = options?.minLength || 1
  
  if (text.length < minLength) {
    return {
      isArabic: false,
      confidence: 0,
      metrics: null,
      suggestions: []
    }
  }

  return detectArabicText(text)
}

/**
 * Get appropriate text direction based on Arabic detection
 */
export function getTextDirection(isArabic: boolean, confidence: number): 'ltr' | 'rtl' | 'auto' {
  if (isArabic && confidence > 0.7) {
    return 'rtl'
  } else if (isArabic && confidence > 0.3) {
    return 'auto'
  }
  return 'ltr'
}

/**
 * Get appropriate placeholder text based on language detection
 */
export function getLocalizedPlaceholder(isArabic: boolean, type: 'chat' | 'command' | 'search' = 'chat'): string {
  if (isArabic) {
    switch (type) {
      case 'chat':
        return 'اكتب رسالتك هنا...'
      case 'command':
        return 'اكتب أمرك بالعربية...'
      case 'search':
        return 'ابحث...'
      default:
        return 'اكتب هنا...'
    }
  } else {
    switch (type) {
      case 'chat':
        return 'Type your message...'
      case 'command':
        return 'Enter command...'
      case 'search':
        return 'Search...'
      default:
        return 'Type here...'
    }
  }
}

/**
 * Format confidence percentage for display
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`
}

/**
 * Get confidence level description
 */
export function getConfidenceLevel(confidence: number): {
  level: 'low' | 'medium' | 'high'
  description: string
  color: string
} {
  if (confidence >= 0.8) {
    return {
      level: 'high',
      description: 'High confidence Arabic text',
      color: 'green'
    }
  } else if (confidence >= 0.5) {
    return {
      level: 'medium',
      description: 'Likely Arabic text',
      color: 'yellow'
    }
  } else {
    return {
      level: 'low',
      description: 'Possibly Arabic text',
      color: 'orange'
    }
  }
}

/**
 * Extract Arabic keywords for better context understanding
 */
export function extractArabicKeywords(text: string): string[] {
  const words = text.split(/\s+/)
  const arabicKeywords: string[] = []

  for (const word of words) {
    // Check if word is primarily Arabic
    const detection = detectArabicText(word)
    if (detection.isArabic && detection.confidence > 0.7) {
      arabicKeywords.push(word)
    }
  }

  return arabicKeywords
}

/**
 * Validate text for Arabic command processing
 */
export function validateArabicCommand(text: string): {
  isValid: boolean
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []

  if (!text || text.trim().length === 0) {
    issues.push('Empty command')
    return { isValid: false, issues, suggestions }
  }

  if (text.length > 2000) {
    issues.push('Command too long (max 2000 characters)')
    suggestions.push('Try breaking your command into smaller parts')
  }

  const detection = detectArabicText(text)
  
  if (!detection.isArabic) {
    issues.push('Text does not appear to be Arabic')
    suggestions.push('Use Arabic text for Commander translation')
  } else if (detection.confidence < 0.3) {
    issues.push('Low confidence Arabic detection')
    suggestions.push('Consider using more Arabic text or checking for typos')
  }

  // Check for mixed content
  if (detection.metrics.arabicRatio > 0 && detection.metrics.arabicRatio < 0.8) {
    suggestions.push('Mixed language detected - pure Arabic text works better for translation')
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  }
}