import type { AuthUser } from '@domain/services/auth.service'
import type { IAuthService } from '@domain/services/auth.service'
import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { FastifyRequest } from 'fastify'

export const REQUIRE_AUTH_KEY = 'requireAuth'
export const RequireAuth = () => SetMetadata(REQUIRE_AUTH_KEY, true)

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | null => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest & { user?: AuthUser }>()
    return request.user ?? null
  },
)

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject('IAuthService') private readonly authService: IAuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthUser | null }>()

    const cookieHeader = request.headers.cookie ?? ''

    if (cookieHeader) {
      const user = await this.authService.validateSession(cookieHeader)
      request.user = user ?? undefined
    }

    const requiresAuth = this.reflector.getAllAndOverride<boolean>(REQUIRE_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (requiresAuth && !request.user) {
      throw new UnauthorizedException('Authentication required')
    }

    return true
  }
}
