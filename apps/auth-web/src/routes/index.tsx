import { createFileRoute, redirect } from '@tanstack/react-router'
import { fetchClient, type User } from '../lib/api'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const [data] = await fetchClient<{ user: User }>('/api/v1/me')
    throw redirect({ to: data ? '/profile' : '/login' })
  },
})
