import type { AuthEnv } from '../../env.js'

export type AccountEmail = {
  to: string
  kind: 'verification' | 'password-reset'
  url: string
}

export type SendAccountEmail = (message: AccountEmail) => Promise<void>

export function accountEmailLink(env: Pick<AuthEnv, 'AUTH_PUBLIC_ORIGIN'>, message: AccountEmail) {
  if (message.kind !== 'verification') return message.url
  const link = new URL('/verify-email', env.AUTH_PUBLIC_ORIGIN)
  link.search = new URL(message.url).search
  return link.href
}

export function createEmailSender(env: AuthEnv): SendAccountEmail {
  return async (message) => {
    const { to, kind } = message
    const url = accountEmailLink(env, message)
    if (!env.AUTH_RESEND_API_KEY || !env.AUTH_EMAIL_FROM) {
      throw new Error('Configure AUTH_RESEND_API_KEY and AUTH_EMAIL_FROM to send account emails')
    }

    const verification = kind === 'verification'
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.AUTH_RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.AUTH_EMAIL_FROM,
        to: [to],
        subject: verification ? 'Verify your Lidcode email' : 'Reset your Lidcode password',
        text: `${verification ? 'Verify your email' : 'Reset your password'} using this link:\n\n${url}\n\nThis link expires in one hour.`,
      }),
    })

    if (!response.ok) throw new Error('Account email delivery failed')
  }
}
