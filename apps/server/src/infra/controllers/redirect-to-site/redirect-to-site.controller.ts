import { Controller, Docs, Get, NotFoundError, Response, type IResponse } from '@lidcode/framework'

@Controller('')
@Docs({
  tags: ['Static'],
  title: 'Static redirect to site',
  description: 'Controller to redirect to my personal site',
})
export class RedirectToSiteController {
  @Get('')
  async execute(@Response() response: IResponse) {
    // return response.redirect(env.SITE_URL, 301)
    throw new NotFoundError('Página não encontrada')
  }
}
