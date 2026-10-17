import { useState } from 'react'
import { AccessLayout, Feedback } from '../components/access-layout'
import { authClient, finishAuthentication, oauthSearch } from '../lib/auth-client'

export function VerificationPage({ verified = false }: { verified?: boolean }) {
  const params = new URLSearchParams(window.location.search)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(params.has('error') ? 'This link is expired or already used. Request a new link.' : '')
  const [complete, setComplete] = useState(verified && !params.has('error'))
  let continuation = oauthSearch()
  const callback = params.get('callbackURL')
  if (callback) {
    const target = new URL(callback, window.location.origin)
    if (target.origin === window.location.origin && target.pathname === '/verified') continuation = oauthSearch(target.search)
  }

  async function act() {
    setPending(true); setError('')
    try {
      if (!complete) {
        const token = params.get('token')
        if (!token) { setError('This link is missing its verification token. Request a new link.'); return }
        const result = await authClient.verifyEmail({ query: { token } })
        if (result.error) setError(result.error.message ?? 'This link is expired or already used.')
        else setComplete(true)
      } else if (continuation) {
        const query = new URLSearchParams(continuation)
        const result = await authClient.oauth2.continue({ created: true, oauth_query: query.toString() })
        if (result.error) setError(result.error.message ?? 'Restart the connection from your application.')
        else finishAuthentication(result.data)
      } else window.location.assign('/profile')
    } catch { setError('Unable to connect. Please try again.') }
    finally { setPending(false) }
  }

  return <AccessLayout title={complete ? 'Email verified.' : 'A quick confirmation.'} description={complete ? 'Your Lidcode account is ready.' : 'Confirm your email to finish creating your account.'}>
    <Feedback error={error} />
    <button className="button primary" disabled={pending} onClick={() => void act()}>{pending ? 'Please wait...' : complete ? (continuation ? 'Continue to application' : 'Open your account') : 'Verify my email'}</button>
    <nav className="form-links"><a href={`/resend-verification${continuation}`}>Request a new verification link</a><a href={`/login${continuation}`}>Back to sign in</a></nav>
  </AccessLayout>
}
