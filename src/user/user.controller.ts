import { Controller, Get, Post, Body, Patch, Param, Delete, Inject, Query, UnauthorizedException, ParseIntPipe, BadRequestException, DefaultValuePipe, HttpStatus, HttpCode } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { UserDetailVo } from './vo/user-info.vo';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { generateParseIntPipe } from 'src/util';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginUserVo } from './vo/login-user.vo';
import { RefreshTokenVo } from './vo/refresh-token.vo';
import { UserListVo } from './vo/user-list.vo';



@ApiTags('用户管理模块')
@Controller('user')
export class UserController {
  @Inject(EmailService)
  private emailService: EmailService

  @Inject(RedisService)
  private redisService: RedisService

  @Inject(JwtService)
  private jwtService: JwtService

  @Inject(ConfigService)
  private configService: ConfigService

  @ApiQuery({
    name: 'address',
    type: String,
    description: '邮箱地址',
    required: true,
    example: 'xx@xx.com'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String
  })
  @Get('register-captcha')
  async captcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2,8)
    await this.redisService.set(`captcha_${address}`, code, 5 * 60)
    await this.emailService.sendMail({
      to: address,
      subject: '注册验证码',
      html: `<p>你的注册验证码是 ${code}</p>`
    })

    return '发送成功；'
  }

  @ApiBody({
    type: RegisterUserDto
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '注册成功/失败',
    type: String
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码失效/验证码错误/用户已存在',
    type: String
  })
  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.register(registerUser)
  }

   // 普通用户登录
   @ApiBody({
    type: LoginUserDto
   })
   @ApiResponse({
    status: HttpStatus.OK,
    description: '用户信息和token',
    type: LoginUserVo
   })
   @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '用户不存在/密码错误',
    type: String
   })
   @Post('login')
   async userLogin(@Body() loginUser: LoginUserDto) {
     const vo = await this.userService.login(loginUser, false)
 
     vo.accessToken = this.jwtService.sign({
       userId: vo.userInfo.id,
       username: vo.userInfo.username,
       roles: vo.userInfo.roles,
       permissions: vo.userInfo.permissions
     },{
       expiresIn: this.configService.get('jwt_access_token_expires_time') || '30m'
     })
 
     vo.refreshToken = this.jwtService.sign({
       userId: vo.userInfo.id
     },{
       expiresIn: this.configService.get('jwt_refresh_token_expires_time') || '7d'
     })
 
     return vo
   }

  //管理员用户登录
  @Post('admin/login')
  async adminLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, true)

    vo.accessToken = this.jwtService.sign({
      userId: vo.userInfo.id,
      username: vo.userInfo.username,
      roles: vo.userInfo.roles,
      permissions: vo.userInfo.permissions
    }, {
      expiresIn: this.configService.get('jwt_access_token_expires_time') || '30m'
    })

    vo.refreshToken = this.jwtService.sign({
      userId: vo.userInfo.id
    }, {
      expiresIn: this.configService.get('jwt_refresh_token_expires_time') || '7d'
    })

    return vo
  }

  // access_token过期用refresh_token刷新
  @ApiQuery({
    name: 'refreshToken',
    type: String,
    required: true,
    description: '刷新token',
    example: 'xxxx.aaaa.aaaaaa'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '刷新成功'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'token失效，请重新登录',
    type: RefreshTokenVo
  })
  @Get('refresh')
  async refresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken)
      const user = await this.userService.findUserById(data.userId, false)
      const access_token = this.jwtService.sign({
        userId: user.id,
        username: user.username,
        roles: user.roles,
        permissions: user.permissions
      }, {
        expiresIn: this.configService.get('jwt_access_token_expires_time') || '30m'
      })

      const refresh_token = this.jwtService.sign({
        userId: user.id
      }, {
        expiresIn: this.configService.get('jwt_refresh_token_expires_time') || '7d'
      })

      const vo = new RefreshTokenVo()

      vo.access_token = access_token
      vo.refresh_token = refreshToken

      return vo
    }catch (e) {
      throw new UnauthorizedException('token失效，请重新登录')
    }
  }

  @Get('admin/refresh')
  async adminRefresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken)
      const user = await this.userService.findUserById(data.userId, true)
      const access_token = this.jwtService.sign({
        userId: user.id,
        username: user.username,
        roles: user.roles,
        permissions: user.permissions
      }, {
        expiresIn: this.configService.get('jwt_access_token_expires_time') || '30m'
      })

      const refresh_token = this.jwtService.sign({
        userId: user.id
      }, {
        expiresIn: this.configService.get('jwt_refresh_token_expires_time') || '7d'
      })

      return {
        access_token,
        refresh_token
      }
    }catch(e) {
      throw new UnauthorizedException('token失效，请重新登录')
    }
  }

 // 查询用户信息
  @ApiBearerAuth() // swager里接口需要登录的标识
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDetailVo,
    description: 'success'
  })
  @Get('info')
  @RequireLogin()
  async info(@UserInfo('userId') userId: number) {
    const user =  await this.userService.findUserDetailById(userId)

    const vo = new UserDetailVo()
    vo.id = user.id
    vo.username = user.username
    vo.nickName = user.nickName
    vo.headPic = user.headPic
    vo.phonoNumber = user.phoneNumber
    vo.email = user.email
    vo.createTime = user.createTime,
    vo.isFrozen = user.isFrozen

    return vo
  }

  @ApiQuery({
    name: 'addess',
    description: '邮箱地址',
    type: String
  })
  @ApiResponse({
    description: '发送成功',
    type: String
  })
  @Get('update_password/captcha')
  async updatePasswordCaptcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2,8)

    await this.redisService.set(`update_password_captcha_${address}`, code, 10 * 60)

    await this.emailService.sendMail({
      to: address,
      subject: '更改密码验证码',
      html: `<p>你的更改密码验证码是 ${code}</p>`
    })

    return '发送成功；'
  }

  @Get('update/captecha')
  async updateCaptcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2,8)

    await this.redisService.set(`update_password_captcha_${address}`, code, 10 * 60)

    await this.emailService.sendMail({
      to: address,
      subject: '更改用户信息验证码',
      html: `<p>你的更改用户信息的验证码是 ${code}</p>`
    })

    return '发送成功；'
  }

  constructor(private readonly userService: UserService) {}


  @Get('init-data')
  async initData() {
    await this.userService.initData()
    return 'down'
  }

  // 修改密码
  @ApiBody({
    type: UpdateUserPasswordDto
  })
  @ApiResponse({
    type: String,
    status: HttpStatus.OK,
    description: '密码修改成功/失败'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码失效/错误',
    type: String
  })
  @Post(['update_password', 'admin/update_password'])
  async updatePassword(@Body() passwordDto: UpdateUserPasswordDto) {
    return await this.userService.updatePassword(passwordDto)
  }

  // 冻结用户
  @ApiBearerAuth()
  @ApiQuery({
    name: 'id',
    description: 'userId',
    type: Number
  })
  @ApiResponse({
    type: String,
    description: 'success'
  })
  @RequireLogin()
  @Get('freeze')
  async freeze(@Query('id') userId: number) {
    await this.userService.freezeUserById(userId)
    return 'success'
  }

  // 获取用户列表
  // 可以根据用户名或者邮箱和昵称等筛选
  @ApiBearerAuth()
  @ApiQuery({
    name: 'pageNo',
    description: '第几页',
    type: Number
  })
  @ApiQuery({
    name: 'pageSize',
    description: '每页几条数据',
    type: Number
  })
  @ApiQuery({
    name: 'username',
    description: '用户名',
    type: String
  })
  @ApiQuery({
    name: 'nickName',
    description: '昵称',
    type: String
  })
  @ApiQuery({
    name: 'email',
    description: '邮箱地址',
    type: String
  })
  @ApiResponse({
    description: '用户列表',
    type: UserListVo
  })
  @RequireLogin()
  @Get('list')
  async list(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo')) pageNo: number, 
    @Query('pageSize', new DefaultValuePipe(2),generateParseIntPipe('pageSize')) pageSize: number,
    @Query('username') username: string,
    @Query('nickName') nickName: string,
    @Query('email') email: string
  )
  {
    // return await this.userService.findUsersByPage(pageNo, pageSize)
    return await this.userService.findUser(username, nickName, email, pageNo, pageSize)
  }


  @ApiBearerAuth()
  @ApiBody({
    type: UpdateUserDto
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
    type: String
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码失效/错误'
  })
  @Post(['update', 'admin/update'])
  @RequireLogin()
  async update(@UserInfo('userId') userId: number, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.updateUser(userId, updateUserDto)
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

}
