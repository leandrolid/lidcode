import { Catch, HttpException, HttpStatus, Logger, type ArgumentsHost } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import { ZodSerializationException } from 'nestjs-zod'
import { flattenError, ZodError } from 'zod'
import type { FastifyReply } from 'fastify'

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    console.log('Exception caught by HttpExceptionFilter:', exception)
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
      return response
        .status(exception.getStatus())
        .headers({ 'Content-Type': 'text/html; charset=utf-8' })
        .send(NOT_FOUND_PAGE)
    }
    super.catch(exception, host)
  }
}

const NOT_FOUND_PAGE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0ib2tsY2goMC4xNDEgMC4wMDUgMjg1LjgyMykiLz4KPHN2ZyB4PSI0IiB5PSI0IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ib2tsY2goMC40ODggMC4yNDMgMjY0LjM3NikiPgo8cGF0aCBkPSJNNCAyaDEydjJINFYyeiIvPgo8cGF0aCBkPSJNNCA2aDEwdjJINFY2eiIvPgo8cGF0aCBkPSJNNCAxMGg4djJINFYxMHoiLz4KPHN2ZyB4PSIxNiIgeT0iMTIiIHdpZHRoPSI4IiBoZWlnaHQ9IjEyIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxOCIgcj0iNCIgZmlsbD0ib2tsY2goMC40ODggMC4yNDMgMjY0LjM3NikiLz4KPHN2ZyB4PSIxOCIgeT0iMTYiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjE4IiByPSIyIiBmaWxsPSJva2xjaCgwLjk4NSAwIDApIi8+Cjwvc3ZnPgo8L3N2Zz4KPC9zdmc+Cjwvc3ZnPgo=" />
    <meta name="google-adsense-account" content="ca-pub-7052489958602359">
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
            background: linear-gradient(135deg, #1a1a2e, #09090b);
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
</html>`.replace(/(^\s+|\n)/gm, '')
