import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getInfo() {
    return {
      service: 'MK Finance — Car CRM API',
      status: 'running',
      docs: '/api-docs',
    };
  }
}
