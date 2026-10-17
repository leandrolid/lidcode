import { useState, type FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Feedback } from '../components/access-layout'
import { fetchClient } from '../lib/api'
import { authClient, finishAuthentication } from '../lib/auth-client'

type Method = { id: string; provider: 'credential' | 'google' | 'github'; usable: boolean }
const labels = { credential: 'Email & password', google: 'Google', github: 'GitHub' }

export const Route = createFileRoute('/_account/methods')({
  loader: async () => {
    const [data, error] = await fetchClient<{ methods: Method[] }>('/api/v1/me/sign-in-methods')
    return { methods: data?.methods ?? [], error: error?.message ?? '' }
  },
  component: SignInMethods,
})

function SignInMethods() {
  const { user } = Route.useRouteContext()
  const initial = Route.useLoaderData()
  const [methods, setMethods] = useState(initial.methods)
  const [pending, setPending] = useState('')
  const [error, setError] = useState(initial.error || (new URLSearchParams(window.location.search).has('error') ? 'This provider could not be linked. Try again from your account.' : ''))
  const [success, setSuccess] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const usableCount = methods.filter((method) => method.usable).length
  const hasPassword = methods.some((method) => method.provider === 'credential' && method.usable)

  async function connect(provider: 'google' | 'github') {
    setPending(provider); setError(''); setSuccess('')
    try {
      const result = await authClient.linkSocial({ provider, callbackURL: '/methods', errorCallbackURL: '/methods?error=link_failed' })
      if (result.error) setError(result.error.message ?? 'Unable to connect this provider.')
      else finishAuthentication(result.data, '/methods')
    } catch { setError('Unable to connect. Please try again.') }
    finally { setPending('') }
  }

  async function remove(method: Method) {
    setPending(method.id); setError(''); setSuccess('')
    const [, failure] = await fetchClient(`/api/v1/me/sign-in-methods/${encodeURIComponent(method.id)}`, { method: 'DELETE' })
    if (failure) setError(failure.message)
    else { setMethods((current) => current.filter((item) => item.id !== method.id)); setSuccess(`${labels[method.provider]} disconnected.`) }
    setPending('')
  }

  async function password(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending('password'); setError(''); setSuccess('')
    try {
      const result = hasPassword
        ? await authClient.changePassword({ currentPassword, newPassword })
        : await authClient.requestPasswordReset({ email: user.email, redirectTo: '/reset-password' })
      if (result.error) setError(result.error.message ?? 'Unable to update your password.')
      else { setSuccess(hasPassword ? 'Your password has been changed.' : 'Check your email for a secure password setup link.'); setCurrentPassword(''); setNewPassword('') }
    } catch { setError('Unable to connect. Please try again.') }
    finally { setPending('') }
  }

  return <section><p className="eyebrow">02 / Account access</p><h1 className="page-title">Your ways <em>back in.</em></h1><p className="muted">Connect the methods you use to sign in. These are separate from the applications you authorize.</p>
    <Feedback error={error} success={success} />
    <div className="panel"><h2>Connected methods</h2><div className="method-list">{methods.map((method) => <div className="method-row" key={method.id}><span className="provider-mark" aria-hidden="true">{method.provider === 'credential' ? '@' : method.provider === 'google' ? 'G' : 'GH'}</span><div className="row-content"><h3>{labels[method.provider]}</h3><p>{method.usable ? 'Ready to sign in' : 'Password not set'}</p></div><button className="button secondary" aria-label={`Remove ${labels[method.provider]}`} aria-busy={pending === method.id} disabled={Boolean(pending) || (method.usable && usableCount === 1)} onClick={() => void remove(method)}>{pending === method.id ? 'Removing...' : 'Remove'}</button></div>)}</div>
      {usableCount === 1 && <p className="field-note">Keep at least one sign-in method. Add another before removing your last one.</p>}
      <div className="action-row">{(['google', 'github'] as const).filter((provider) => !methods.some((method) => method.provider === provider)).map((provider) => <button className="button secondary" key={provider} disabled={Boolean(pending)} onClick={() => void connect(provider)}>{pending === provider ? 'Connecting...' : `Connect ${labels[provider]}`}</button>)}</div>
    </div>
    <div className="panel"><h2>{hasPassword ? 'Change your password' : 'Add a password'}</h2><p className="muted">{hasPassword ? 'Use your current password to set a new one.' : 'Confirm ownership of your account email to add email and password sign-in.'}</p><form className="form-stack" onSubmit={password} aria-busy={pending === 'password'}>{hasPassword && <><label>Current password<input required type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label><label>New password<input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label></>}<button className="button primary" disabled={Boolean(pending)}>{pending === 'password' ? 'Please wait...' : hasPassword ? 'Change password' : 'Send password setup link'}</button></form></div>
  </section>
}
