import { useState, type FormEvent } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Feedback } from '../components/access-layout'
import { fetchClient, jsonRequest, type User } from '../lib/api'

export const Route = createFileRoute('/_account/profile')({ component: Profile })

function Profile() {
  const { user } = Route.useRouteContext()
  const router = useRouter()
  const [name, setName] = useState(user.name)
  const [image, setImage] = useState(user.image ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(''); setSuccess('')
    const [data, failure] = await fetchClient<{ user: User }>('/api/v1/me', jsonRequest({ name, image: image.trim() || null }, 'PATCH'))
    if (failure) setError(failure.message)
    else {
      setName(data.user.name); setImage(data.user.image ?? '')
      await router.invalidate()
      setSuccess('Your profile has been saved.')
    }
    setPending(false)
  }

  return <section><p className="eyebrow">01 / Your identity</p><h1 className="page-title">The person <em>behind it all.</em></h1><p className="muted">A familiar face, wherever you choose to connect.</p>
    <div className="profile-grid"><div className="panel"><h2>Your profile</h2><Feedback error={error} success={success} />
      <form className="form-stack" onSubmit={save} aria-busy={pending}>
        <label>Name<input required maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <div className="field-group"><label htmlFor="avatar-url">Avatar URL</label><input id="avatar-url" aria-describedby="avatar-hint" type="url" placeholder="https://..." value={image} onChange={(event) => setImage(event.target.value)} /><span id="avatar-hint" className="field-note">Use a link to an existing image. Leave blank to remove it.</span></div>
        <button className="button primary" disabled={pending}>{pending ? 'Saving...' : 'Save profile'}</button>
      </form></div>
      <aside className="panel identity-card"><div className="avatar">{user.image ? <img src={user.image} alt="Your profile avatar" /> : <span aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>}</div><h2>{user.name}</h2><p className="muted">{user.email}</p><span className="tag">Email verified</span><dl><dt>Account ID</dt><dd className="mono user-id">{user.id}</dd></dl></aside>
    </div>
  </section>
}
