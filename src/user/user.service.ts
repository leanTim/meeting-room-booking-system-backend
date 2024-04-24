import { Injectable, Logger, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterUserDto } from './dto/register-user';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RedisService } from 'src/redis/redis.service';
import { Repository } from 'typeorm';
import { md5 } from 'src/util';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';


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

  async initData () {
    const user1 = new User()
    user1.username = 'zhangsan'
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

    const role1 = new Role()
    role1.name = '管理员'

    const role2 = new Role()
    role2.name = '普通用户'

    const permission1 = new Permission()
    permission1.code = 'ccc'
    permission1.description = '访问 ccc 接口'

    const permission2 = new Permission()
    permission2.code = 'ddd'
    permission2.description = '访问 ddd 接口'

    user1.roles = [role1]
    user2.roles = [role2]

    role1.permissions = [permission1, permission2]
    role2.permissions = [permission1]

    await this.permissionRepository.save([permission1, permission2])
    await this.roleRepository.save([role1, role2])
    await this.userRepository.save([user1, user2])
  }

  async register(user: RegisterUserDto) {
    const captcha = await this.redisService.get(`captcha_${user.email}`)

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
    }
  }
  findAll() {
    return `This action returns all user`;
  }
}
