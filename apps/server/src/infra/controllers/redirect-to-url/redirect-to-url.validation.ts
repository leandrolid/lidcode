import { createZodDto } from 'nestjs-zod'
import z from 'zod'

const RedirectToUrlParamsSchema = z.object({
  code: z.string().min(3).max(10),
})

export class RedirectToUrlParams extends createZodDto(RedirectToUrlParamsSchema) {}
