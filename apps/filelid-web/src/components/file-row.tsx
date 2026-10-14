import type { ReactNode } from 'react'
import { File, FileArchive, FileCode2, FileImage, FileText, Film, Music2 } from 'lucide-react'
import { formatSize } from '../lib/format'
import { useLanguage } from '../lib/i18n'

type Props = { name: string; size: number; children?: ReactNode }

export function FileRow({ name, size, children }: Props) {
  const { language } = useLanguage()
  const extension = name.split('.').pop()?.toLowerCase() || ''
  let Icon = File
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(extension)) Icon = FileImage
  else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) Icon = FileArchive
  else if (['js', 'ts', 'tsx', 'json', 'html', 'css'].includes(extension)) Icon = FileCode2
  else if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(extension)) Icon = FileText
  else if (['mp4', 'mov', 'webm'].includes(extension)) Icon = Film
  else if (['mp3', 'wav', 'flac'].includes(extension)) Icon = Music2

  return (
    <li className="file-row">
      <span className="file-icon">
        <Icon size={20} strokeWidth={1.5} />
      </span>
      <div className="file-description">
        <span className="file-name" title={name}>
          {name}
        </span>
        <span className="file-size">{formatSize(size, language)}</span>
      </div>
      {children}
    </li>
  )
}
