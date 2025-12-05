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
    <title>404 - Oops! You Found the Void</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: #e94560;
            overflow: hidden;
        }
        .container {
            text-align: center;
        }
        h1 {
            font-size: 8rem;
            margin: 0;
            text-shadow: 0 0 20px #e94560, 0 0 40px #e94560;
        }
        .subtitle {
            font-size: 2rem;
            margin: 20px 0;
            color: #0f4c75;
            font-weight: bold;
        }
        p {
            font-size: 1.2rem;
            margin: 10px 0;
            color: #bbb;
        }
        .funny-message {
            font-size: 1.5rem;
            margin: 30px 0;
            color: #3282b8;
            font-style: italic;
        }
        .back-link {
            display: inline-block;
            margin-top: 30px;
            padding: 12px 24px;
            background: #3282b8;
            color: white;
            text-decoration: none;
            border-radius: 25px;
            transition: all 0.3s ease;
            font-weight: bold;
        }
        .back-link:hover {
            background: #0f4c75;
        }
        .stars {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        .star {
            position: absolute;
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
            animation: twinkle 2s infinite;
        }
        @keyframes twinkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="stars">
        <div class="star" style="top: 10%; left: 20%; animation-delay: 0s;"></div>
        <div class="star" style="top: 20%; left: 80%; animation-delay: 0.5s;"></div>
        <div class="star" style="top: 60%; left: 30%; animation-delay: 1s;"></div>
        <div class="star" style="top: 80%; left: 70%; animation-delay: 1.5s;"></div>
        <div class="star" style="top: 40%; left: 10%; animation-delay: 2s;"></div>
        <div class="star" style="top: 30%; left: 90%; animation-delay: 0.3s;"></div>
    </div>
    <div class="container">
        <h1>404</h1>
        <div class="subtitle">OOPS!</div>
        <p>Looks like this page went on vacation...</p>
        <div class="funny-message">"I'm not lost, you're lost!" - This Page, probably</div>
        <p>Don't worry, it happens to the best of us.<br>Even our URLs sometimes take unexpected detours.</p>
        <a href="https://short.lidco.de" class="back-link">Take Me Home</a>
    </div>
</body>
</html>
`
