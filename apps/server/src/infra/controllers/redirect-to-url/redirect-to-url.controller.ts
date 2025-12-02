import { RedirectToUrlUsecase } from '@/application/usecases/urls/redirect-to-url.usecase'
import {
    RedirectToUrlResponseValidation,
    RedirectToUrlValidation,
} from '@infra/controllers/redirect-to-url/redirect-to-url.validation'
import {
    Controller,
    Docs,
    Get,
    Params,
    Response,
    Validate,
    type InferParams,
    type IResponse,
} from '@lidcode/framework'

@Controller(':code')
@Docs({
  tags: ['Shorten URLs'],
  title: 'Redirect to Original URL',
  description: 'Controller to redirect to the original URL using the shortened code',
  response: new RedirectToUrlResponseValidation(),
})
export class RedirectToUrlController {
  constructor(private readonly redirectToUrlUsecase: RedirectToUrlUsecase) {}

  @Get('')
  @Validate(new RedirectToUrlValidation())
  async execute(
    @Params() params: InferParams<RedirectToUrlValidation>,
    @Response() response: IResponse,
  ) {
    const output = await this.redirectToUrlUsecase.execute({
      ...params,
    })
    return response.redirect(output.originalUrl, 302)
  }
}
