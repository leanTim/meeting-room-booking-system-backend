import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    // Response指定底层是express
    const response = host.switchToHttp().getResponse<Response>()
    response.statusCode = exception.getStatus()
    // 有的时候exception.message并不是具体的错误，具体的错误在response.message里，数组的形式
    const res = exception.getResponse() as { message: string[] };

    response.json({
      code: exception.getStatus(),
      message: 'fail',
      data: res?.message?.join ? res?.message?.join(',') : exception.message
    }).end()
  }
}
