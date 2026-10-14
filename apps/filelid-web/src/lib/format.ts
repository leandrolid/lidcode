export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return 'Expired'
  const minutes = Math.ceil(milliseconds / 60000)
  if (minutes < 60) return `${minutes}m remaining`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m remaining`
  return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`
}
