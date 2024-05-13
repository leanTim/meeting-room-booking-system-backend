import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MeetingRoom } from './entities/meeting-room.entity';
import { Like, Repository } from 'typeorm';

@Injectable()
export class MeetingRoomService {
  // 1. 在app.module的TypeOrmModule.forRootAsync里引用表
  // 2. 然后在meeting-booking.module里import
  // 3. 在server里注入meetingroom表，这样就能使用了
  @InjectRepository(MeetingRoom)
  private repository: Repository<MeetingRoom>

  initData() {
    const room1 = new MeetingRoom();
    room1.name = '木星';
    room1.capacity = 10;
    room1.equipment = '白板';
    room1.location = '一层西';

    const room2 = new MeetingRoom();
    room2.name = '金星';
    room2.capacity = 5;
    room2.equipment = '';
    room2.location = '二层东';

    const room3 = new MeetingRoom();
    room3.name = '天王星';
    room3.capacity = 30;
    room3.equipment = '白板，电视';
    room3.location = '三层东';

    this.repository.insert([room1, room2, room3])
  }

  async find(pageNo: number, pageSize: number, name: string, capacity: string, equipment: string) {
    if(pageNo < 1) {
        throw new BadRequestException('页码最小位1')
    }
    const skipCount = pageNo * pageSize

    const condition: Record<string, any> = {}

    if(name) {
        condition.name = Like(`%${name}%`)
    }

    if(equipment) {
        condition.equipment = Like(`%${equipment}%`)
    }

    if(capacity) {
        condition.capacity = capacity
    }

    const [meetingRooms, totalCount] = await this.repository.findAndCount({
        skip: skipCount,
        take: pageSize,
        where: condition
    })
    
    return {
        meetingRooms,
        totalCount
    }
  }

  async create(meetingRoomDto: CreateMeetingRoomDto) {
    const room = await this.repository.findOneBy({
        name: meetingRoomDto.name
    })

    if(room) {
        throw new BadRequestException('会议室名字已存在')
    }
    return await this.repository.save(meetingRoomDto)
  }

  async update(meetingRoonDto: UpdateMeetingRoomDto) {
    const meetingRoom = await this.repository.findOneBy({
        id: meetingRoonDto.id
    })

    if(!meetingRoom) {
        throw new BadRequestException('会议室不存在')
    }

    meetingRoom.capacity = meetingRoonDto.capacity
    meetingRoom.location = meetingRoonDto.location
    meetingRoom.name = meetingRoonDto.name

    if(meetingRoonDto.description) {
        meetingRoom.description = meetingRoonDto.description
    }

    if(meetingRoonDto.equipment) {
        meetingRoom.equipment = meetingRoonDto.equipment
    }

    await this.repository.update({
        id: meetingRoom.id
    }, meetingRoom)
    return 'success'
  }

  async findById(id: number) {
    return await this.repository.findOneBy({
        id
    })
  }
  
  async delete(id: number) {
    await this.repository.delete({
        id
    })
    return 'success'
  }
}

