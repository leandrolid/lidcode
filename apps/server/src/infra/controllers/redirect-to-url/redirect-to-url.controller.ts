import { RedirectToUrlUsecase } from '@/application/usecases/urls/redirect-to-url.usecase'
import { type RedirectToUrlParams } from '@infra/controllers/redirect-to-url/redirect-to-url.validation'
import { Controller, Get, Param, Res, UsePipes } from '@nestjs/common'
import type { FastifyReply } from 'fastify'
import { ZodValidationPipe } from 'nestjs-zod'

@Controller(':code')
// @Docs({
//   tags: ['Shorten URLs'],
//   title: 'Redirect to Original URL',
//   description: 'Controller to redirect to the original URL using the shortened code',
//   response: new RedirectToUrlResponseValidation(),
// })
export class RedirectToUrlController {
  constructor(private readonly redirectToUrlUsecase: RedirectToUrlUsecase) {}

  @Get('')
  @UsePipes(ZodValidationPipe)
  async execute(@Param() params: RedirectToUrlParams, @Res() response: FastifyReply) {
    const output = await this.redirectToUrlUsecase.execute({
      ...params,
    })
    return response.redirect(output.originalUrl, 302)
  }
}
