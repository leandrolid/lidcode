import z from 'zod'
import { createZodDto } from 'nestjs-zod'

const CreateShortenUrlBodySchema = z.object({
  originalUrl: z.url(),
})

export class CreateShortenUrlBody extends createZodDto(CreateShortenUrlBodySchema) {}
