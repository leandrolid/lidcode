import type { Language, Translate } from './translations'

export function formatSize(bytes: number, language: Language): string {
  if (bytes < 1024) return `${bytes} B`
  const number = new Intl.NumberFormat(language, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  if (bytes < 1024 * 1024) return `${number.format(bytes / 1024)} KB`
  return `${number.format(bytes / (1024 * 1024))} MB`
}

export function formatRemaining(milliseconds: number, t: Translate): string {
  if (milliseconds <= 0) return t('time.expired')
  const minutes = Math.ceil(milliseconds / 60000)
  if (minutes < 60) return t('time.minutes', { minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('time.hours', { hours, minutes: minutes % 60 })
  return t('time.days', { days: Math.floor(hours / 24), hours: hours % 24 })
}
