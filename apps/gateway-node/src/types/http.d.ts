import 'node:http'

module 'node:http' {
  interface IncomingMessage extends IncomingMessage {
    user?: {
      id: string
      name: string
    }
  }
}
