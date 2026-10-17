import { createFileRoute } from '@tanstack/react-router'
import { VerificationPage } from '../pages/verification-page'

export const Route = createFileRoute('/verify-email')({ component: VerificationPage })
