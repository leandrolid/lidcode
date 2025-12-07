import { Controller, Get, HttpStatus, Res } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import type { FastifyReply } from 'fastify'

@Controller()
export class GetHomeController {
  @Get()
  @ApiOperation({
    operationId: 'getHome',
    summary: 'Get Home Page',
    description: 'Controller to serve the home page of the service hub',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the home page HTML content.',
  })
  async execute(@Res() res: FastifyReply) {
    return res
      .header('content-type', 'text/html; charset=utf-8')
      .status(HttpStatus.OK)
      .sendFile('home.html')
  }
}
