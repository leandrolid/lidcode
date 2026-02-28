import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectDrizzle, type Drizzle } from '@infra/adapters/drizzle/client'
import { user } from '@infra/adapters/drizzle/schemas/user'
import { Roles } from '@infra/adapters/nest/roles.decorator'
import { RolesGuard } from '@infra/adapters/nest/roles.guard'

@Controller('v1/admin/users')
@ApiTags('Admin')
@UseGuards(RolesGuard)
export class ListUsersController {
  constructor(@InjectDrizzle() private readonly db: Drizzle) {}

  @Get()
  @Roles('admin')
  @ApiOperation({
    operationId: 'listUsers',
    summary: 'List All Users',
    description: 'Admin-only endpoint to retrieve all users',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users returned successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async execute() {
    const users = await this.db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)

    return { users }
  }
}
