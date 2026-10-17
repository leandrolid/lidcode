import { createFileRoute } from '@tanstack/react-router'
import { AccessPage } from '../pages/access-page'

export const Route = createFileRoute('/resend-verification')({ component: () => <AccessPage mode="resend" /> })
