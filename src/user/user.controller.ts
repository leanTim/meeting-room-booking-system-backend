import { Controller, Get, Post, Body, Patch, Param, Delete, Inject, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterUserDto } from './dto/register-user';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';


@Controller('user')
export class UserController {
  @Inject(EmailService)
  private emailService: EmailService

  @Inject(RedisService)
  private redisService: RedisService

  @Get('register-captcha')
  async captcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2,8)
    await this.redisService.set(`captcha_${address}`, code, 5 * 60)
    console.log(address)
    await this.emailService.sendMail({
      to: address,
      subject: '注册验证码',
      html: `<p>你的注册验证码是 ${code}</p>`
    })

    return '发送成功；'
  }

  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.register(registerUser)
  }

  @Get('init-data')
  async initData() {
    await this.userService.initData()
    return 'down'
  }


  @Get()
  findAll() {
    return this.userService.findAll();
  }

}
