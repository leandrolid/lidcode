import type { IncomingMessage } from 'node:http'
import { env } from '../env'

const Upstreams = {
  LIDCODE: env.LIDCODE,
  SHORTLID: env.SHORTLID,
}

export function getUpstream(req: IncomingMessage): string {
  if (!req.url) return Upstreams.LIDCODE
  if (req.url.startsWith('/v2/urls')) {
    return Upstreams.SHORTLID
  }
  return Upstreams.LIDCODE
}
