import { Catch, HttpException, HttpStatus, Logger, type ArgumentsHost } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import { ZodSerializationException } from 'nestjs-zod'
import { flattenError, ZodError } from 'zod'
import type { FastifyReply, FastifyRequest } from 'fastify'

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()
    if (exception instanceof ZodSerializationException) {
      const zodError = exception.getZodError()
      if (zodError instanceof ZodError) {
        return response.status(HttpStatus.BAD_REQUEST).send({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation failed',
          errors: flattenError(zodError).fieldErrors,
        })
      }
    }
    if (
      exception instanceof HttpException &&
      exception.getStatus() < HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      const isApiRoute = request.url.startsWith('/v1/')
      const acceptsJson = request.headers.accept?.includes('application/json')
      if (isApiRoute || acceptsJson) {
        return response.status(exception.getStatus()).send({
          statusCode: exception.getStatus(),
          message: exception.message,
        })
      }
      return response
        .status(exception.getStatus())
        .header('content-type', 'text/html; charset=utf-8')
        .sendFile('error.html')
    }
    this.logger.error(exception)
    super.catch(exception, host)
  }
}
