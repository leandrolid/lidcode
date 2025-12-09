import { RedirectToUrlUsecase } from '@/application/usecases/urls/redirect-to-url.usecase'
import { RedirectToUrlParams } from '@infra/controllers/redirect-to-url/redirect-to-url.validation'
import { Controller, Get, Param, Res } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger'
import type { FastifyReply } from 'fastify'

@Controller()
export class RedirectToUrlController {
  constructor(private readonly redirectToUrlUsecase: RedirectToUrlUsecase) {}

  @Get(':code')
  @ApiOperation({
    operationId: 'redirectToUrl',
    summary: 'Redirect to Original URL',
    description: 'Controller to redirect to the original URL using the shortened code',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to the original URL associated with the provided shortened code.',
  })
  @ApiParam({
    name: 'code',
    type: RedirectToUrlParams.Output.Output,
  })
  async execute(@Param() params: RedirectToUrlParams, @Res() response: FastifyReply) {
    const output = await this.redirectToUrlUsecase.execute({
      ...params,
    })
    return response.redirect(output.originalUrl, 302)
  }
}
