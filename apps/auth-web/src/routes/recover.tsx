import { createFileRoute } from '@tanstack/react-router'
import { AccessPage } from '../pages/access-page'

export const Route = createFileRoute('/recover')({ component: () => <AccessPage mode="recover" /> })
