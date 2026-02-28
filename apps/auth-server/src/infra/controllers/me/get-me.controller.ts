import { Controller, Get, UnauthorizedException } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Session } from '@thallesp/nestjs-better-auth'

type AuthSession = {
  user: {
    id: string
    email: string
    name: string
    role?: string | null
  }
}

@Controller('v1/me')
@ApiTags('User')
export class GetMeController {
  @Get()
  @ApiOperation({
    operationId: 'getCurrentUser',
    summary: 'Get Current User',
    description: 'Returns the currently authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user returned successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - no valid session',
  })
  execute(@Session() session: AuthSession | null) {
    if (!session?.user) {
      throw new UnauthorizedException('No valid session')
    }

    const { user } = session

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }
  }
}
