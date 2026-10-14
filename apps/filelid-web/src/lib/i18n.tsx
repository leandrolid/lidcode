import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { translations, type Language, type Translate } from './translations'

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: Translate
}

const LanguageContext = createContext<LanguageContextValue | null>(null)
const storageKey = 'filelid:language'

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved === 'en' || saved === 'pt-BR') return saved
  } catch {
    // Browser language detection still works when local storage is unavailable.
  }
  for (const language of navigator.languages.length ? navigator.languages : [navigator.language]) {
    const base = language.toLowerCase().split('-')[0]
    if (base === 'pt') return 'pt-BR'
    if (base === 'en') return 'en'
  }
  return 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>(initialLanguage)

  function setLanguage(next: Language) {
    updateLanguage(next)
    try {
      localStorage.setItem(storageKey, next)
    } catch {
      // Keep the selected language for this session even if it cannot be saved.
    }
  }

  const t: Translate = (key, values) =>
    translations[language][key].replace(/\{(\w+)\}/g, (placeholder, name: string) =>
      String(values?.[name] ?? placeholder),
    )

  useEffect(() => {
    document.documentElement.lang = language
    document.title = translations[language]['meta.title']
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', translations[language]['meta.description'])
  }, [language])

  return <LanguageContext value={{ language, setLanguage, t }}>{children}</LanguageContext>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
