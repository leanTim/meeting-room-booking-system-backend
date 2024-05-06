import { ApiProperty } from "@nestjs/swagger"

export class UserDetailVo {
    @ApiProperty()
    id: number

    @ApiProperty()
    username: string

    @ApiProperty()
    nickName: string

    @ApiProperty()
    email: string

    @ApiProperty()
    headPic: string

    @ApiProperty()
    phonoNumber: string

    @ApiProperty()
    isFrozen: boolean

    @ApiProperty()
    createTime: Date
}