import { useState, type FormEvent } from 'react'
import { AccessLayout, Feedback } from '../components/access-layout'
import { authClient, finishAuthentication, oauthSearch } from '../lib/auth-client'

type Mode = 'login' | 'register' | 'recover' | 'reset' | 'resend'
const titles: Record<Mode, [string, string]> = {
  login: ['Welcome back.', 'Sign in to your Lidcode account.'],
  register: ['Make it yours.', 'Create an account. Verify your email to get started.'],
  recover: ['Find your way back.', 'We will email a secure password reset link.'],
  reset: ['A fresh start.', 'Choose a new password for your existing account.'],
  resend: ['Check your inbox.', 'Request a new email verification link.'],
}

export function AccessPage({ mode }: { mode: Mode }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(new URLSearchParams(window.location.search).has('error') ? 'Sign-in could not be completed. Please try again.' : '')
  const [success, setSuccess] = useState('')
  const search = oauthSearch()
  const needsPassword = ['login', 'register', 'reset'].includes(mode)
  const token = new URLSearchParams(window.location.search).get('token')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true); setError(''); setSuccess('')
    try {
      if (mode === 'login') {
        const result = await authClient.signIn.email({ email, password })
        if (result.error) setError(result.error.message ?? 'Unable to sign in.')
        else finishAuthentication(result.data)
      } else if (mode === 'register') {
        const result = await authClient.signUp.email({ name, email, password, callbackURL: `/verified${search}` })
        if (result.error) setError(result.error.message ?? 'Unable to create your account.')
        else setSuccess('Check your inbox to verify your email. Your application connection will be waiting.')
      } else if (mode === 'resend') {
        const result = await authClient.sendVerificationEmail({ email, callbackURL: `/verified${search}` })
        if (result.error) setError(result.error.message ?? 'Unable to send verification email.')
        else setSuccess('If your account needs verification, a new link is on its way.')
      } else if (mode === 'recover') {
        const result = await authClient.requestPasswordReset({ email, redirectTo: `/reset-password${search}` })
        if (result.error) setError(result.error.message ?? 'Unable to request a reset.')
        else setSuccess('If an account exists for that email, a reset link is on its way.')
      } else {
        if (!token) { setError('This reset link is missing its token. Request a new link.'); return }
        const result = await authClient.resetPassword({ token, newPassword: password })
        if (result.error) setError(result.error.message ?? 'This reset link is expired or already used.')
        else setSuccess('Password saved. You can now sign in with your new password.')
      }
    } catch { setError('Unable to connect. Please try again.') }
    finally { setPending(false) }
  }

  async function social(provider: 'google' | 'github') {
    setPending(true); setError('')
    try {
      const result = await authClient.signIn.social({ provider, callbackURL: '/profile', errorCallbackURL: `/login${search}` })
      if (result.error) setError(result.error.message ?? 'Unable to connect to the sign-in provider.')
      else finishAuthentication(result.data)
    } catch { setError('Unable to connect. Please try again.') }
    finally { setPending(false) }
  }

  return (
    <AccessLayout title={titles[mode][0]} description={titles[mode][1]}>
      <Feedback error={error} success={success} />
      {mode === 'reset' && !token ? <p><a href={`/recover${search}`}>Request a new reset link</a></p> : (
        <form onSubmit={submit} className="form-stack" aria-busy={pending}>
          {mode === 'register' && <label>Name<input required maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label>}
          {mode !== 'reset' && <label>Email<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>}
          {needsPassword && <label>{mode === 'reset' ? 'New password' : 'Password'}<input type="password" required minLength={8} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} /></label>}
          <button className="button primary" disabled={pending} type="submit">{pending ? 'Please wait...' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : mode === 'reset' ? 'Save password' : 'Send email'}<span aria-hidden="true"> &rarr;</span></button>
        </form>
      )}
      {(mode === 'login' || mode === 'register') && <>
        <div className="divider"><span>or continue with</span></div>
        <div className="social-actions"><button className="button secondary" disabled={pending} onClick={() => void social('google')}>Google</button><button className="button secondary" disabled={pending} onClick={() => void social('github')}>GitHub</button></div>
      </>}
      <nav className="form-links" aria-label="Account options">
        {mode === 'login' ? <><a href={`/register${search}`}>Create an account</a><a href={`/recover${search}`}>Forgot password?</a><a href={`/resend-verification${search}`}>Resend verification</a></> : <a href={`/login${search}`}>Back to sign in</a>}
      </nav>
    </AccessLayout>
  )
}
