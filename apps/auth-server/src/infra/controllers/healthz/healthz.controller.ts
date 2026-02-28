import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

@Controller('healthz')
@ApiTags('Health')
export class HealthzController {
  private readonly version: string

  constructor() {
    // Use process.cwd() for workspace-relative lookup
    const packageJsonPath = join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    this.version = packageJson.version
  }

  @Get()
  @AllowAnonymous()
  @ApiOperation({
    operationId: 'healthCheck',
    summary: 'Health Check',
    description: 'Public endpoint to verify service health and version',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  execute() {
    return {
      status: 'ok',
      version: this.version,
    }
  }
}
