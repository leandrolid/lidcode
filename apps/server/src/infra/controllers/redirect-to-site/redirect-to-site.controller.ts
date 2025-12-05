import { Controller, Docs, Get, ServerError } from '@lidcode/framework'

@Controller('')
@Docs({
  tags: ['Static'],
  title: 'Static redirect to site',
  description: 'Controller to redirect to my personal site',
})
export class RedirectToSiteController {
  @Get('')
  async execute() {
    throw new ServerError(418, 'Página não encontrada')
  }
}
