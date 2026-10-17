import { useEffect, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Feedback } from '../components/access-layout'
import { fetchClient } from '../lib/api'
import { scopeDetails, type IdentityScope } from '../lib/scopes'

type AuthorizedApp = {
  clientId: string
  authorizationId: string
  name: string | null
  scopes: IdentityScope[]
  approvedAt: string
}

export const Route = createFileRoute('/_account/apps')({
  loader: async () => {
    const [data, error] = await fetchClient<{ apps: AuthorizedApp[] }>('/api/v1/authorized-apps')
    return { apps: data?.apps ?? [], error: error?.message ?? '' }
  },
  component: AuthorizedApps,
})

function AuthorizedApps() {
  const initial = Route.useLoaderData()
  const [apps, setApps] = useState(initial.apps)
  const [error, setError] = useState(initial.error)
  const [success, setSuccess] = useState('')
  const [confirming, setConfirming] = useState('')
  const [pending, setPending] = useState('')
  const confirmation = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (confirming) confirmation.current?.focus() }, [confirming])

  async function disconnect(app: AuthorizedApp) {
    setPending(app.clientId); setError(''); setSuccess('')
    const [, failure] = await fetchClient(`/api/v1/authorized-apps/${encodeURIComponent(app.clientId)}`, { method: 'DELETE' })
    if (failure) setError(failure.message)
    else {
      setApps((current) => current.filter((item) => item.clientId !== app.clientId))
      setConfirming(''); setSuccess(`${app.name ?? 'Application'} has been disconnected.`)
    }
    setPending('')
  }

  return <section><p className="eyebrow">03 / Your connections</p><h1 className="page-title">Access is <em>always your call.</em></h1><p className="muted">The applications you have allowed to use your Lidcode identity. <Link to="/methods">Manage Google and GitHub sign-in separately.</Link></p><Feedback error={error} success={success} />
    {!apps.length && !error ? <div className="panel empty-state"><span className="note-mark" aria-hidden="true">L.</span><h2>No applications connected.</h2><p className="muted">When you approve an application, its access appears here. Your sign-in methods are not delegated app connections.</p></div> : apps.map((app) => <article className="panel app-card" key={app.authorizationId}>
      <div className="card-heading"><div><h2>{app.name ?? 'Lidcode application'}</h2><p className="field-note">Approved <time dateTime={app.approvedAt}>{new Date(app.approvedAt).toLocaleString()}</time></p></div><button id={`disconnect-${app.clientId}`} className="button secondary" aria-label={`Disconnect ${app.name ?? 'application'}`} disabled={Boolean(pending)} onClick={() => setConfirming(app.clientId)}>Disconnect</button></div>
      <ul className="permission-tags" aria-label="Granted access">{app.scopes.map((scope) => <li className="tag" key={scope}>{scopeDetails[scope].label}</li>)}</ul>
      {confirming === app.clientId && <div className="confirm-disconnect" role="group" aria-labelledby={`confirm-${app.clientId}`}><h3 id={`confirm-${app.clientId}`}>Disconnect {app.name ?? 'this application'}?</h3><p>This cuts off its access across all of your sessions. Other applications and sign-in methods stay connected.</p><div className="action-row"><button ref={confirmation} className="button danger" disabled={Boolean(pending)} onClick={() => void disconnect(app)}>{pending === app.clientId ? 'Disconnecting...' : 'Confirm disconnect'}</button><button className="button secondary" disabled={Boolean(pending)} onClick={() => { setConfirming(''); document.getElementById(`disconnect-${app.clientId}`)?.focus() }}>Cancel</button></div></div>}
    </article>)}
  </section>
}
