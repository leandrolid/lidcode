import { createFileRoute } from '@tanstack/react-router'
import { AccessPage } from '../pages/access-page'

export const Route = createFileRoute('/register')({ component: () => <AccessPage mode="register" /> })
