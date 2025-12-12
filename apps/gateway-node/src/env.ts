import z from 'zod'

export const env = z
  .object({
    PORT: z.coerce.number().optional().default(8080),
    SHORTLID: z.url(),
    LIDCODE: z.url(),
    AIKIDO_TOKEN: z.string().optional(),
    AIKIDO_DEBUG: z.enum(['true', 'false']).default('false'),
    AIKIDO_BLOCK: z.enum(['true', 'false']).default('true'),
    JWT_SECRET: z.string().min(1),
    WORKER_PROCESSES: z.coerce.number().optional().default(4),
  })
  .parse(process.env)
