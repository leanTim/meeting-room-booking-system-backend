import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //全局可用
  const configService = app.get(ConfigService)
  // 全局pipe
  app.useGlobalPipes(new ValidationPipe())

  await app.listen(configService.get('nest_server_port'));
}
bootstrap();
