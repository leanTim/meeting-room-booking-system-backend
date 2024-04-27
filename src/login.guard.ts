import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Permission } from './user/entities/permission.entity';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express'

interface JwtUserData {
  userId: number,
  username: string,
  roles: string[],
  permissions: Permission[]
}

// 给express 的Request对象扩展上user属性
declare module 'express' {
  interface Request {
    user: JwtUserData
  }
}

@Injectable()
export class LoginGuard implements CanActivate {
  @Inject()
  private reflector: Reflector

  @Inject(JwtService)
  private jwtService: JwtService

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest()

    const requireLogin = this.reflector.getAllAndOverride('require-login', [
      context.getClass(),
      context.getHandler()
    ])

    if(!requireLogin) {
      return true
    }

    const authorization = request.headers.authorization
    
    if(!authorization) {
      throw new UnauthorizedException('用户未登录111')
    }
    try {
      const token = authorization.split(' ')[1]
      const data = this.jwtService.verify<JwtUserData>(token)
      request.user = {
        userId: data.userId,
        username: data.username,
        roles: data.roles,
        permissions: data.permissions
      }
      return true
    }catch(e) {
      throw new UnauthorizedException('token失效，请重新登录')
    }
  }
}
