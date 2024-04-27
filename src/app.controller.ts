import { Controller, Get, SetMetadata } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('aaa')
  @SetMetadata('require-login', true)
  // @SetMetadata('require-permission', ['ddd'])
  aaaa(){
    return 'aaaa'
  }

  @Get('bbb')
  bbb() {
    return 'bbb'
  }
}
