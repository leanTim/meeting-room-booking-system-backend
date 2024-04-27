import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Response, Request } from 'express';

@Injectable()
export class InvokeRecordInterceptor implements NestInterceptor {
  private readonly logger = new Logger(InvokeRecordInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const requset = context.switchToHttp().getRequest<Request>()
    const resopnse = context.switchToHttp().getResponse<Response>()

    const userAgent = requset.headers['user-agent']
    const {ip, method, path} = requset

    this.logger.debug(
      `${method} ${path} ${ip} ${userAgent}: ${
        context.getClass().name
      } ${
        context.getHandler().name
      } invoked...`
    )

    this.logger.debug(`user: ${requset.user?.userId}, ${requset.user?.username}`)

    const now = Date.now()
    return next.handle().pipe(
      tap((res) => {
        this.logger.debug(`
          ${method} ${path} ${ip} ${userAgent}: ${resopnse.statusCode}: ${Date.now() - now}ms
        `)
        this.logger.debug(`Response: ${JSON.stringify(res)}`)
      })
    )
  }
}
