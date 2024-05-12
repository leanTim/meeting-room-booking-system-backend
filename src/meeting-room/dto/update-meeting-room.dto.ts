import { PartialType } from "@nestjs/swagger"
import { IsNotEmpty } from "class-validator"
import { CreateMeetingRoomDto } from './create-meeting-room.dto';

// 在CreateMeetingRoomDto的基础上加一个必填属性id
export class UpdateMeetingRoomDto extends PartialType(CreateMeetingRoomDto) {
    @IsNotEmpty({
        message: 'id 不能为空'
    })
    id: number
}