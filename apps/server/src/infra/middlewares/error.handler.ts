import { HttpStatusCode, IErrorHandler, Logger, ServerError } from '@lidcode/framework'
import { FastifyReply } from 'fastify'

export class HttpErrorHandler implements IErrorHandler {
  private readonly logger: Logger = new Logger('HttpErrorHandler')
  execute(error: Error, res: FastifyReply) {
    if (error instanceof ServerError && error.code < HttpStatusCode.INTERNAL_SERVER_ERROR) {
      return res
        .headers({ 'Content-Type': 'text/html; charset=utf-8' })
        .status(error.code)
        .send(NOT_FOUND_PAGE)
    }
    if (error instanceof ServerError) {
      return res.status(error.code).send({ message: error.message, errors: error.cause })
    }
    this.logger.error(error)
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: 'Error interno do servidor',
      statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
    })
  }
}

const NOT_FOUND_PAGE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7052489958602359" crossorigin="anonymous"></script>
    <title>404 Not Found</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
        }
        .container {
            text-align: center;
        }
        h1 {
            font-size: 5rem;
            margin: 0;
        }
        p {
            font-size: 1.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>404</h1>
        <p>Page not found</p>
    </div>
</body>
</html>
`
