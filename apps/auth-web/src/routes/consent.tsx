import { useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { AccessLayout, Feedback } from '../components/access-layout'
import { fetchClient, jsonRequest, type User } from '../lib/api'
import { authClient, finishAuthentication } from '../lib/auth-client'
import { scopeDetails, type IdentityScope } from '../lib/scopes'

type ConsentRequest = { client: { id: string; name: string | null }; scopes: IdentityScope[] }

export const Route = createFileRoute('/consent')({
  beforeLoad: async () => {
    const [session] = await fetchClient<{ user: User }>('/api/v1/me')
    if (!session) throw redirect({ href: `/login${window.location.search}`, reloadDocument: true })
    return { user: session.user }
  },
  loader: async () => {
    // Router search serialization turns repeated ba_param fields into JSON; signatures need the raw query.
    const [data, error] = await fetchClient<ConsentRequest>('/api/v1/oauth/continuation', jsonRequest({ oauthQuery: window.location.search.slice(1) }))
    return { request: data, error: error?.message ?? '' }
  },
  component: Consent,
})

function Consent() {
  const { user } = Route.useRouteContext()
  const initial = Route.useLoaderData()
  const [error, setError] = useState('')
  const [pending, setPending] = useState<'approve' | 'deny' | ''>('')

  async function choose(accept: boolean) {
    setPending(accept ? 'approve' : 'deny'); setError('')
    try {
      const result = await authClient.oauth2.consent({ accept })
      if (result.error) setError(result.error.message ?? 'Unable to finish the connection. Restart from your application.')
      else finishAuthentication(result.data)
    } catch { setError('Unable to connect. Please try again.') }
    finally { setPending('') }
  }

  return <AccessLayout title="A connection, by choice." description="Review what this application is asking to use.">
    <Feedback error={error || initial.error} />
    {initial.request ? <>
      <div className="consent-client"><span className="provider-mark" aria-hidden="true">{initial.request.client.name?.charAt(0) ?? 'A'}</span><div><h3>{initial.request.client.name ?? 'Lidcode application'}</h3><p className="field-note">Connecting as {user.email}</p></div></div>
      <ul className="scope-list">{initial.request.scopes.map((scope) => <li key={scope}><span aria-hidden="true">+</span><div><strong>{scopeDetails[scope].label}</strong><p>{scopeDetails[scope].description}</p></div></li>)}</ul>
      <p className="field-note">You can disconnect this app at any time from Authorized apps. Your password is never shared.</p>
      <div className="action-row consent-actions"><button className="button primary" disabled={Boolean(pending)} onClick={() => void choose(true)}>{pending === 'approve' ? 'Approving...' : 'Allow access'}</button><button className="button secondary" disabled={Boolean(pending)} onClick={() => void choose(false)}>{pending === 'deny' ? 'Declining...' : 'Deny access'}</button></div>
    </> : <a href="/profile">Back to your account</a>}
  </AccessLayout>
}
