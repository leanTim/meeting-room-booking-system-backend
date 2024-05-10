import { Injectable, Logger, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RedisService } from 'src/redis/redis.service';
import { Like, Repository } from 'typeorm';
import { md5 } from 'src/util';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { LoginUserDto } from './dto/login-user.dto';
import { LoginUserVo } from './vo/login-user.vo';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserListVo } from './vo/user-list.vo';

@Injectable()
export class UserService {

  @InjectRepository(User)
  private userRepository: Repository<User>

  @InjectRepository(Role)
  private roleRepository: Repository<Role>

  @InjectRepository(Permission)
  private permissionRepository: Repository<Permission>

  private logger = new Logger()

  // 注入redisservice 因为resdis.services是injectable的
  @Inject(RedisService)
  private redisService: RedisService


  // 数据初始化
  async initData () {
    const user1 = new User()
    user1.username = 'aaazhangsan'
    user1.password = md5('1111111')
    user1.email = 'aaa@aa.com'
    user1.isAdmin = true
    user1.nickName = '张三'
    user1.phoneNumber = '13552345678'

    const user2 = new User()
    user2.username = 'lisi'
    user2.password = md5('2222222')
    user2.email = 'bbb@bb.com'
    user2.nickName = '李四'

    const user3 = new User()
    user3.username = 'wangwu'
    user3.password = md5('333333')
    user3.nickName = '王武'
    user3.email = 'ccc@cc.com'
    user3.isAdmin = false

    const role1 = new Role()
    role1.name = '管理员'

    const role2 = new Role()
    role2.name = '普通用户'

    const role3 = new Role()
    role3.name = '管理员'

    const permission1 = new Permission()
    permission1.code = 'ccc'
    permission1.description = '访问 ccc 接口'

    const permission2 = new Permission()
    permission2.code = 'ddd'
    permission2.description = '访问 ddd 接口'

    const permission3 = new Permission()
    permission3.code = 'fff'
    permission3.description = '访问fff接口'

    user1.roles = [role1]
    user2.roles = [role2]
    user3.roles = [role3]

    role1.permissions = [permission1, permission2]
    role2.permissions = [permission1]
    role3.permissions = [permission1, permission2, permission3]

    await this.permissionRepository.save([permission1, permission2, permission3])
    await this.roleRepository.save([role1, role2, role3])
    await this.userRepository.save([user1, user2, user3])
  }

  // 注册
  async register(user: RegisterUserDto) {
    const captcha = await this.redisService.get(`captcha_${user.email}`)?? 'asd123'
    if(!captcha) {
      throw new HttpException('验证码失效', HttpStatus.BAD_REQUEST)
    }

    if(user.captcha !== captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST)
    }

    const foundUser = await this.userRepository.findOneBy({
      username: user.username
    })

    if(foundUser) {
      throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST)
    }
    const newUser = new User()
    newUser.username = user.username
    newUser.password = md5(user.password)
    newUser.email = user.email
    newUser.nickName = user.nickname

    try{
      await this.userRepository.save(newUser)
      return '注册成功'
    } catch(e) {
      this.logger.error(e, UserService)
      return '注册失败'
    }
  }

  // 登录
  async login(loginUserDto: LoginUserDto, isAdmin: boolean) {
    const user = await this.userRepository.findOne({
      where: {
        username: loginUserDto.username,
        isAdmin
      },
      relations: ['roles', 'roles.permissions']
    })

    if(!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST)
    }

    if(user.password !== md5(loginUserDto.password)) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST)
    }

    const vo = new LoginUserVo()
    vo.userInfo = {
      id: user.id,
      username: user.username,
      nickname: user.nickName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      headPic: user.headPic,
      createTime: user.createTime.getTime(),
      isFrozen: user.isFrozen,
      isAdmin: user.isAdmin,
      roles: user.roles.map(item => item.name),
      permissions: user.roles.reduce((arr, item) => {
        item.permissions.forEach(permission => {
            if(arr.indexOf(permission) === -1) {
                arr.push(permission);
            }
        })
          return arr;
      }, [])
    }

    return vo
  }

  async findUserById(userId: number, isAdmin: boolean) {

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
        isAdmin
      },
      relations: ['roles', 'roles.permissions']
    })

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      roles: user.roles.map((item) => item.name),
      permissions: user.roles.reduce((arr, item) => {
        item.permissions.forEach(permission => {
            if(arr.indexOf(permission) === -1) {
                arr.push(permission);
            }
        })
        return arr;
      }, [])
    }
  }

  async findUserDetailById(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId
      }
    })

    return user
  }

  async updatePassword(passwordDto: UpdateUserPasswordDto) {
    const captcha = await this.redisService.get(`update_password_chptcha_${passwordDto.email}`) || 'asd123'
    if(!captcha) {
      throw new HttpException('验证码失效', HttpStatus.BAD_REQUEST)
    }

    if(passwordDto.captcha !== captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST)
    }

    const foundUser = await this.userRepository.findOneBy({
      username: passwordDto.username
    })

    if(foundUser.email !== passwordDto.email) {
      throw new HttpException('邮箱不正确', HttpStatus.BAD_REQUEST)
    }

    const newPassword = md5(passwordDto.password)

    if(foundUser.password === newPassword) {
      throw new HttpException('新密码与旧密码相同', HttpStatus.BAD_REQUEST)
    }

    foundUser.password = newPassword

    try {
      await this.userRepository.save(foundUser)
      return '密码修改成功'
    }catch(e) {
      this.logger.error(e, UserService)
      return '密码修改失败'
    }
  }

  async updateUser(userId: number, updateUserDto: UpdateUserDto) {
    const captcha = await this.redisService.get(`update_user_captcha_${updateUserDto.email}`) || 'asd123'

    if(!captcha) {
      throw new HttpException('验证码失效', HttpStatus.BAD_REQUEST)
    }

    if(updateUserDto.captcha !== captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST)
    }

    const foundUser = await this.userRepository.findOneBy({
      id: userId
    })

    if(updateUserDto.nickName) {
      foundUser.nickName = updateUserDto.nickName
    }

    if(updateUserDto.headPic) {
      foundUser.headPic = updateUserDto.headPic
    }

    try {
      await this.userRepository.save(foundUser)
      return '信息修改成功'
    }catch(e) {
      this.logger.log(e, UserService)
      return '信息修改失败'
    }
  }

  async freezeUserById(id: number) {
    const user = await this.userRepository.findOneBy({
      id
    })

    user.isFrozen = true

    await this.userRepository.save(user)
  }

  async findUsersByPage(pageNo: number, pageSize: number) {
    const skipCount = (pageNo - 1) * pageSize

    const [users, totalCount] = await this.userRepository.findAndCount({
      select: ['id', 'username', 'nickName', 'phoneNumber', 'email', 'headPic', 'isFrozen', 'createTime'],
      skip: skipCount,
      take: pageSize
    })

    return {
      users,
      totalCount
    }
  }

  async findUser(username: string, nickName: string, email: string, pageNo: number, pageSize: number) {
    const skipCount = (pageNo - 1) * pageSize

    const condition: Record<string, any> = {}

    if(username) {
      condition.username = Like(`%${username}%`)
    }

    if(nickName) {
      condition.nickName = Like(`%${nickName}%`)
    }

    if(email) {
      condition.email = Like(`%${email}%`)
    }

    const [users, totalCount] = await this.userRepository.findAndCount({
      select: ['id', 'username', 'nickName', 'phoneNumber', 'email', 'headPic', 'isFrozen', 'createTime'],
      skip: skipCount,
      take: pageSize,
      where: condition
    })

    const vo = new UserListVo()

    vo.totalCount = totalCount
    vo.users = users

    return vo
  }

  findAll() {
    return `This action returns all user`;
  }
}
