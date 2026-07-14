'use client'

import { createContext, useContext, useState, useCallback, useSyncExternalStore, type ReactNode } from 'react'
import fr from '@/messages/fr.json'
import en from '@/messages/en.json'

type Locale = 'fr' | 'en'

const translations: Record<Locale, typeof fr> = { fr, en }

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current === null || current === undefined) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current : undefined
}

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'fr'
  const stored = localStorage.getItem('hookara-lang') as Locale | null
  if (stored && (stored === 'fr' || stored === 'en')) return stored
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('en')) return 'en'
  return 'fr'
}

function getServerSnapshot(): Locale {
  return 'fr'
}

function subscribeToLocale(callback: () => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === 'hookara-lang') callback()
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeToLocale,
    detectLocale,
    getServerSnapshot
  )

  const setLocale = useCallback((newLocale: Locale) => {
    localStorage.setItem('hookara-lang', newLocale)
    document.documentElement.lang = newLocale
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', newLocale === 'fr' ? 'fr_FR' : 'en_US')
    window.dispatchEvent(new StorageEvent('storage', { key: 'hookara-lang' }))
  }, [])

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const value = getNestedValue(translations[locale], key)
    if (value === undefined) return key
    if (!params) return value
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
      value
    )
  }, [locale])

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useTranslation must be used within a LanguageProvider')
  return context
}
