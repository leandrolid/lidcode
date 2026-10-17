export const scopeDetails = {
  openid: { label: 'Identify your account', description: 'Use your stable Lidcode account identifier to sign you in.' },
  profile: { label: 'Read your profile', description: 'See your name and avatar.' },
  email: { label: 'Read your email', description: 'See your email address and verification status.' },
  offline_access: { label: 'Stay connected', description: 'Renew access until you disconnect this application.' },
}

export type IdentityScope = keyof typeof scopeDetails
