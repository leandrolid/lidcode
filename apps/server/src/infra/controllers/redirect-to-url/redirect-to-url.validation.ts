import { IResponseValidation, IValidation } from '@leandrolid/framework'
import z from 'zod'

export class RedirectToUrlValidation implements IValidation {
  params = z.object({
    code: z.string().min(3).max(10),
  })
}

export class RedirectToUrlResponseValidation extends IResponseValidation {
  constructor() {
    super({
      '200': z.object({
        originalUrl: z.url().describe('The original URL to redirect to'),
      }),
    })
  }
}
