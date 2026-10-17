import { createFileRoute } from '@tanstack/react-router'
import { AccessPage } from '../pages/access-page'

export const Route = createFileRoute('/login')({ component: () => <AccessPage mode="login" /> })
