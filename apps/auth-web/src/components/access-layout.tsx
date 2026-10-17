import type { ReactNode } from 'react'

type Props = { title: string; description: string; children: ReactNode }

export function AccessLayout({ title, description, children }: Props) {
  return (
    <section className="access-layout">
      <div className="access-story">
        <p className="eyebrow">Lidcode / Your personal account</p>
        <h1>One identity.<br /><em>Your connections.</em></h1>
        <p className="intro-copy">A little less signing in. A lot more control over what you share.</p>
        <div className="identity-note"><span className="note-mark" aria-hidden="true">L.</span><div><strong>Permission stays personal.</strong><p>You choose which applications get access.</p></div></div>
      </div>
      <div className="access-card">
        <p className="eyebrow">Your account, at hand</p>
        <h2>{title}</h2><p className="muted">{description}</p>
        {children}
      </div>
    </section>
  )
}

export function Feedback({ error, success }: { error?: string; success?: string }) {
  if (error) return <p className="feedback error" role="alert">{error}</p>
  if (success) return <p className="feedback success" role="status">{success}</p>
  return null
}
