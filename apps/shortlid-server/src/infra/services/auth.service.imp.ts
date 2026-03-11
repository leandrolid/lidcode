import { env } from '@/env'
import type { AuthUser, IAuthService } from '@domain/services/auth.service'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class AuthService implements IAuthService {
  private readonly logger = new Logger(AuthService.name)

  async validateSession(cookieHeader: string): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${env.AUTH_SERVER_URL}/v1/me`, {
        headers: {
          Cookie: cookieHeader,
        },
      })

      if (!response.ok) {
        return null
      }

      return (await response.json()) as AuthUser
    } catch (error) {
      this.logger.error(error)
      return null
    }
  }
}
