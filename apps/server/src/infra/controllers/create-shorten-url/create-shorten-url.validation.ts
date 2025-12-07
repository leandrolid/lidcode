import z from 'zod'
import { createZodDto } from 'nestjs-zod'

const CreateShortenUrlBodySchema = z.object({
  originalUrl: z.url(),
})

// class is required for using DTO as a type
export class CreateShortenUrlBody extends createZodDto(CreateShortenUrlBodySchema) {}
