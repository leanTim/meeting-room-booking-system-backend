import { ApiProperty } from "@nestjs/swagger";

class User {
    @ApiProperty()
    username: string

    @ApiProperty()
    id: number

    @ApiProperty()
    nickName: string

    @ApiProperty()
    email: string

    @ApiProperty()
    phoneNumber: string

    @ApiProperty()
    headPic: string

    @ApiProperty()
    isFrozen: boolean

    @ApiProperty()
    createTime: Date
}

export class UserListVo {
    
    @ApiProperty({
        type: [User]
    })
    users: User[]

    @ApiProperty()
    totalCount: number
}