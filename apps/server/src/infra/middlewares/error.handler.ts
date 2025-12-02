import {
    HttpStatusCode,
    IErrorHandler,
    Logger,
    ServerError,
    type IResponse,
} from '@lidcode/framework'

export class HttpErrorHandler implements IErrorHandler {
  private readonly logger: Logger = new Logger('HttpErrorHandler')
  execute(error: Error, res: IResponse) {
    if (error instanceof ServerError && error.code in HttpStatusCode) {
      return res.status(error.code).send({ message: error.message, errors: error.cause })
    }
    if (error instanceof ServerError) {
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send({
        message: error.message,
        errors: error.cause,
      })
    }
    this.logger.error(error)
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: 'Error interno do servidor',
      statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
    })
  }
}
