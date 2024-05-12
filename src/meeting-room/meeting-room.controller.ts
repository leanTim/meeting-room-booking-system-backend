import { Controller, Get, Post, Body, Patch, Param, Delete, Query, DefaultValuePipe, Put } from '@nestjs/common';
import { MeetingRoomService } from './meeting-room.service';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';
import { generateParseIntPipe } from '../util';

@Controller('meeting-room')
export class MeetingRoomController {
  constructor(private readonly meetingRoomService: MeetingRoomService) {}

  @Get('list')
  async list(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))pageNo: number,
    @Query('pageSize', new DefaultValuePipe(2),generateParseIntPipe('pageSize'))pageSize: number
  ) {
    return await this.meetingRoomService.find(pageNo, pageSize)
  }

  @Post('create')
  async create(
    @Body() meetingRoomDto: CreateMeetingRoomDto
  ) {
    return await this.meetingRoomService.create(meetingRoomDto)
  }

  @Put('update')
  async update(
    @Body()meetingRoomDto: UpdateMeetingRoomDto
  ) {
    return await this.meetingRoomService.update(meetingRoomDto)
  }



}
