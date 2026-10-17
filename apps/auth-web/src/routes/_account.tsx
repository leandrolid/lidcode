import { useState } from 'react'
import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { fetchClient, type User } from '../lib/api'
import { authClient } from '../lib/auth-client'
import { Feedback } from '../components/access-layout'

export const Route = createFileRoute('/_account')({
  beforeLoad: async () => {
    const [data] = await fetchClient<{ user: User }>('/api/v1/me')
    if (!data) throw redirect({ to: '/login' })
    return { user: data.user }
  },
  component: AccountLayout,
})

function AccountLayout() {
  const { user } = Route.useRouteContext()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  async function logout() {
    setPending(true)
    const result = await authClient.signOut()
    if (result.error) { setError(result.error.message ?? 'Unable to sign out.'); setPending(false) }
    else window.location.assign('/login')
  }
  return <div className="portal-layout"><aside className="portal-navigation"><p className="eyebrow">Your space</p><nav aria-label="Account"><Link to="/profile">Profile</Link><Link to="/methods">Sign-in methods</Link><Link to="/apps">Authorized apps</Link>{user.role === 'admin' && <><span className="navigation-section mono">Administration</span><Link to="/clients">OAuth clients</Link></>}</nav><button className="text-button" disabled={pending} onClick={() => void logout()}>{pending ? 'Signing out...' : 'Sign out'}</button><Feedback error={error} /></aside><div className="portal-content"><Outlet /></div></div>
}
