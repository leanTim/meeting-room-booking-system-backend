import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RequireLogin, UserInfo } from './custom.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('aaa')
  // @SetMetadata('require-login', true)
  // @SetMetadata('require-permission', ['ddd'])
  @RequireLogin()
  aaaa(@UserInfo() userInfo){
    return 'aaaa'
  }

  @Get('bbb')
  bbb() {
    return 'bbb'
  }
}
