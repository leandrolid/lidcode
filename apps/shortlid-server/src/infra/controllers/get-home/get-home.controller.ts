import { Controller, Get, HttpStatus, Res } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import type { FastifyReply } from 'fastify'

@Controller()
export class GetHomeController {
  @Get('')
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

  @Get('robots.txt')
  @ApiOperation({
    operationId: 'getRobotsTxt',
    summary: 'Get robots.txt',
    description: 'Controller to serve the robots.txt file',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the robots.txt content.',
  })
  async getRobotsTxt(@Res() res: FastifyReply) {
    return res
      .header('content-type', 'text/plain; charset=utf-8')
      .status(HttpStatus.OK)
      .sendFile('robots.txt')
  }

  @Get('favicon.ico')
  @ApiOperation({
    operationId: 'getFavicon',
    summary: 'Get favicon.ico',
    description: 'Controller to serve the favicon.ico file',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the favicon.ico content.',
  })
  async getFavicon(@Res() res: FastifyReply) {
    return res.header('content-type', 'image/svg+xml').status(HttpStatus.OK).sendFile('favicon.svg')
  }

  @Get('sitemap.xml')
  @ApiOperation({
    operationId: 'getSitemapXml',
    summary: 'Get sitemap.xml',
    description: 'Controller to serve the sitemap.xml file',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the sitemap.xml content.',
  })
  async getSitemapXml(@Res() res: FastifyReply) {
    return res
      .header('content-type', 'application/xml; charset=utf-8')
      .status(HttpStatus.OK)
      .sendFile('sitemap.xml')
  }
}
