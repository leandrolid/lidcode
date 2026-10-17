import { createFileRoute } from '@tanstack/react-router'
import { AccessPage } from '../pages/access-page'

export const Route = createFileRoute('/reset-password')({ component: () => <AccessPage mode="reset" /> })
