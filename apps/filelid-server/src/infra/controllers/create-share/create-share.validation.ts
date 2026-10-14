import { EXPIRATION_HOURS } from '@domain/sharing'
import { createZodDto } from 'nestjs-zod'
import z from 'zod'

const createShareQuerySchema = z.object({
  expiresIn: z.coerce
    .number()
    .pipe(z.union(EXPIRATION_HOURS.map((hours) => z.literal(hours))))
    .default(24),
})

export class CreateShareQuery extends createZodDto(createShareQuerySchema) {}
