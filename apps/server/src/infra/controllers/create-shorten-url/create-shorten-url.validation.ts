import { IValidation, IResponseValidation } from '@leandrolid/framework'
import z from 'zod'

export class CreateShortenUrlValidation implements IValidation {
  body = z.object({
    originalUrl: z.url(),
  })
}

export class CreateShortenUrlResponseValidation implements IResponseValidation {
  201 = z.object({
    shortUrl: z.string(),
  })
}
