'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');

  useEffect(() => {
    // Get saved locale from localStorage on mount
    const savedLocale = localStorage.getItem('locale') as 'en' | 'ar' | null;
    if (savedLocale) {
      setLocale(savedLocale);
      applyLocale(savedLocale);
    }
  }, []);

  const applyLocale = (newLocale: 'en' | 'ar') => {
    // Set document direction and language
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLocale;
    
    // Add/remove RTL class for styling
    if (newLocale === 'ar') {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  };

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    
    // Save to localStorage
    localStorage.setItem('locale', newLocale);
    
    // Apply locale changes
    applyLocale(newLocale);
    setLocale(newLocale);
    
    // Reload page to apply translations
    window.location.reload();
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
      aria-label={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}
    >
      <Globe className="w-4 h-4" />
      <span className="uppercase">{locale === 'en' ? 'AR' : 'EN'}</span>
    </button>
  );
}