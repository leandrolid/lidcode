import { createAuth } from './src/auth.js'
import { parseEnv } from './src/env.js'
import { createDatabase } from './src/infra/adapters/drizzle/client.js'

const env = parseEnv(process.env)
export const auth = createAuth(env, createDatabase(env).database)
