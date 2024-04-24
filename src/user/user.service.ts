import { Injectable, Logger, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterUserDto } from './dto/register-user';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RedisService } from 'src/redis/redis.service';
import { Repository } from 'typeorm';
import { md5 } from 'src/util';


@Injectable()
export class UserService {

  @InjectRepository(User)
  private userRepository: Repository<User>

  private logger = new Logger()

  // 注入redisservice 因为resdis.services是injectable的
  @Inject(RedisService)
  private redisService: RedisService

  findAll() {
    return `This action returns all user`;
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

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }


  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
