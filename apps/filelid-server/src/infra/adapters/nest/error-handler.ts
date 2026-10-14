import {
  Catch,
  HttpException,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common'
import type { FastifyReply } from 'fastify'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<FastifyReply>()
    if (error instanceof HttpException) {
      return response.status(error.getStatus()).send(error.getResponse())
    }
    if (
      error instanceof Error &&
      'statusCode' in error &&
      typeof error.statusCode === 'number' &&
      error.statusCode >= 400 &&
      error.statusCode < 500
    ) {
      return response
        .status(error.statusCode)
        .send({ statusCode: error.statusCode, message: error.message })
    }
    this.logger.error(error)
    return response
      .status(500)
      .send({ statusCode: 500, message: 'Something went wrong. Please try again.' })
  }
}
