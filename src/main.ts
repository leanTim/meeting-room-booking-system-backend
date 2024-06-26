import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FormatResponseInterceptor } from './format-response.interceptor';
import { InvokeRecordInterceptor } from './invoke-record.interceptor';
import { UnloginFilter } from './unlogin.filter';
import { CustomExceptionFilter } from './custom-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // 设置静态文件目录，这样就可以直接访问上传的文件(http://localhost:3001/uploads/1715325669401-362838210-logo.png)
  app.useStaticAssets('uploads', {
    prefix: '/uploads'
  })

  //全局可用
  const configService = app.get(ConfigService)
  // 全局pipe
  app.useGlobalPipes(new ValidationPipe())
  app.useGlobalInterceptors(new FormatResponseInterceptor())
  app.useGlobalInterceptors(new InvokeRecordInterceptor())
  app.useGlobalFilters(new UnloginFilter())
  app.useGlobalFilters(new CustomExceptionFilter())

  app.enableCors() //开启跨域
  // 接口文档 http://localhost:3000/api-doc#/default
  const config = new DocumentBuilder()
    .setTitle('会议室预定系统')
    .setDescription('api 接口文档')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      description: '基于jwt的认证'
    })
    .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api-doc', app, document)

  await app.listen(configService.get('nest_server_port'));
}
bootstrap();
