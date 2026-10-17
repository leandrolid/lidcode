import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Feedback } from '../components/access-layout'
import { fetchClient, jsonRequest } from '../lib/api'
import { scopeDetails, type IdentityScope } from '../lib/scopes'

type Client = {
  clientId: string
  name: string | null
  redirectUris: string[]
  scopes: IdentityScope[]
  resource: string | null
  disabled: boolean
}
type Mutation = { client: Client; clientSecret?: string }

export const Route = createFileRoute('/_account/clients')({
  beforeLoad: ({ context }) => { if (context.user.role !== 'admin') throw redirect({ to: '/profile' }) },
  loader: async () => {
    const [data, error] = await fetchClient<{ clients: Client[] }>('/api/v1/admin/oauth-clients')
    return { clients: data?.clients ?? [], error: error?.message ?? '' }
  },
  component: OAuthClients,
})

function OAuthClients() {
  const initial = Route.useLoaderData()
  const [clients, setClients] = useState(initial.clients)
  const [editing, setEditing] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [redirectUris, setRedirectUris] = useState('')
  const [scopes, setScopes] = useState<IdentityScope[]>(['openid', 'profile', 'email'])
  const [pending, setPending] = useState('')
  const [error, setError] = useState(initial.error)
  const [success, setSuccess] = useState('')
  const [secret, setSecret] = useState<{ name: string; value: string } | null>(null)
  const nameInput = useRef<HTMLInputElement>(null)
  const secretInput = useRef<HTMLInputElement>(null)
  useEffect(() => { if (showForm) nameInput.current?.focus() }, [showForm, editing])
  useEffect(() => { if (secret) secretInput.current?.focus() }, [secret])

  function edit(client?: Client) {
    setEditing(client?.clientId ?? ''); setName(client?.name ?? ''); setRedirectUris(client?.redirectUris.join('\n') ?? '')
    setScopes(client?.scopes ?? ['openid', 'profile', 'email']); setShowForm(true)
    setSecret(null); setError(''); setSuccess('')
  }

  function applyResult(result: Mutation) {
    setClients((current) => current.some((client) => client.clientId === result.client.clientId)
      ? current.map((client) => client.clientId === result.client.clientId ? result.client : client)
      : [...current, result.client])
    if (result.clientSecret) setSecret({ name: result.client.name ?? 'Application', value: result.clientSecret })
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess(''); setSecret(null)
    if (!scopes.length) { setError('Choose at least one permitted scope.'); return }
    setPending('save')
    const [data, failure] = await fetchClient<Mutation>(editing ? `/api/v1/admin/oauth-clients/${editing}` : '/api/v1/admin/oauth-clients', jsonRequest({
      name, redirectUris: redirectUris.split(/\r?\n/).map((uri) => uri.trim()).filter(Boolean), scopes,
    }, editing ? 'PATCH' : 'POST'))
    if (failure) setError(failure.message)
    else { applyResult(data); setShowForm(false); setSuccess(editing ? 'Client configuration saved.' : 'Application registered. Copy its new secret now.') }
    setPending('')
  }

  async function changeStatus(client: Client) {
    setPending(client.clientId); setError(''); setSuccess(''); setSecret(null)
    const [data, failure] = await fetchClient<Mutation>(`/api/v1/admin/oauth-clients/${client.clientId}/status`, jsonRequest({ enabled: client.disabled }, 'PATCH'))
    if (failure) setError(failure.message)
    else { applyResult(data); setSuccess(data.client.disabled ? 'Client disabled.' : 'Client enabled.') }
    setPending('')
  }

  async function rotate(client: Client) {
    setPending(`rotate-${client.clientId}`); setError(''); setSuccess(''); setSecret(null)
    const [data, failure] = await fetchClient<Mutation>(`/api/v1/admin/oauth-clients/${client.clientId}/rotate-secret`, { method: 'POST' })
    if (failure) setError(failure.message)
    else { applyResult(data); setSuccess('Secret rotated. The previous secret no longer works.') }
    setPending('')
  }

  return <section><p className="eyebrow">04 / Administrator registry</p><div className="card-heading"><div><h1 className="page-title">Connections, <em>configured.</em></h1><p className="muted">Confidential Lidcode applications. PKCE and user approval stay required.</p></div><button className="button primary" disabled={Boolean(pending)} onClick={() => edit()}>Register application</button></div>
    <Feedback error={error} success={success} />
    {secret && <section className="panel secret-panel" aria-label="One-time client credential"><h2>New secret for {secret.name}</h2><p>Shown only for this operation. Store it on the application&apos;s backend before closing this message. Never put it in a browser bundle.</p><label>New client secret<input ref={secretInput} className="mono" readOnly autoComplete="off" spellCheck={false} value={secret.value} onFocus={(event) => event.currentTarget.select()} /></label><button className="text-button" onClick={() => setSecret(null)}>Dismiss secret</button></section>}
    {showForm && <section className="panel" aria-label="Client configuration"><h2>{editing ? 'Edit application' : 'Register application'}</h2><form className="form-stack" onSubmit={save} aria-busy={pending === 'save'}>
      <label>Application name<input ref={nameInput} required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <div className="field-group"><label htmlFor="redirect-uris">Redirect URIs</label><textarea id="redirect-uris" required rows={3} aria-describedby="redirect-hint" placeholder="https://app.example.com/callback" value={redirectUris} onChange={(event) => setRedirectUris(event.target.value)} /><span id="redirect-hint" className="field-note">One exact HTTPS URI per line. Explicit HTTP loopback callbacks are allowed for local development.</span></div>
      <fieldset className="scope-options"><legend>Permitted identity scopes</legend>{(Object.keys(scopeDetails) as IdentityScope[]).map((scope) => <label className="checkbox-option" key={scope}><input type="checkbox" checked={scopes.includes(scope)} onChange={(event) => setScopes((current) => event.target.checked ? [...current, scope] : current.filter((item) => item !== scope))} /><span>{scopeDetails[scope].label}</span><code aria-hidden="true">{scope}</code></label>)}</fieldset>
      <div className="action-row"><button className="button primary" disabled={Boolean(pending)}>{pending === 'save' ? 'Saving...' : editing ? 'Save configuration' : 'Create client'}</button><button type="button" className="button secondary" disabled={Boolean(pending)} onClick={() => setShowForm(false)}>Cancel</button></div>
    </form></section>}
    {!clients.length && !error && <div className="panel empty-state"><h2>No OAuth clients registered.</h2><p className="muted">Register an application when its backend and exact callback URLs are ready.</p></div>}
    {clients.map((client) => <article className="panel client-card" key={client.clientId}><div className="card-heading"><div><h2>{client.name ?? 'Lidcode application'}</h2><p className="mono user-id">{client.clientId}</p></div><span className={`tag ${client.disabled ? 'neutral' : ''}`}>{client.disabled ? 'Disabled' : 'Enabled'}</span></div>
      <dl className="client-metadata"><dt>Resource</dt><dd><code>{client.resource ?? 'Not configured'}</code></dd><dt>Exact redirect URIs</dt><dd>{client.redirectUris.map((uri) => <code key={uri}>{uri}</code>)}</dd><dt>Permitted scopes</dt><dd><span className="mono">{client.scopes.join(' ')}</span></dd></dl>
      <p className="field-note">Authorization code + rotating refresh tokens. S256 PKCE. Explicit user consent. Rotating a secret invalidates its previous value immediately.</p>
      <div className="action-row"><button className="button secondary" aria-label={`Edit ${client.name}`} disabled={Boolean(pending)} onClick={() => edit(client)}>Edit metadata</button><button className="button secondary" aria-label={`${client.disabled ? 'Enable' : 'Disable'} ${client.name}`} disabled={Boolean(pending)} onClick={() => void changeStatus(client)}>{pending === client.clientId ? 'Updating...' : client.disabled ? 'Enable client' : 'Disable client'}</button><button className="button secondary" aria-label={`Rotate secret for ${client.name}`} disabled={Boolean(pending)} onClick={() => void rotate(client)}>{pending === `rotate-${client.clientId}` ? 'Rotating...' : 'Rotate secret'}</button></div>
    </article>)}
  </section>
}
