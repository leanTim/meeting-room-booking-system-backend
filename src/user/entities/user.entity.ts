import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Role } from "./role.entity";

@Entity({
    name: 'users'
})
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        comment: '用户名',
        length: 50,
    })
    username: string;

    @Column({
        comment: '密码',
        length: 50,
    })
    password: string

    @Column({
        comment: '昵称',
        name: 'nick_name',
        length: 50,
    })
    nickName: string

    @Column({
        comment: '邮箱',
        length: 50
    })
    email: string

    @Column({
        comment: '头像',
        length: 100,
        nullable: true
    })
    headpic: string

    @Column({
        comment: '手机号',
        length: 20,
        nullable: true
    })
    phoneNumber: string

    @Column({
        comment: '是否冻结',
        default: false
    })
    isFrozen: boolean

    @Column({
        comment: '是否管理员',
        default: false
    })
    isAdmin: boolean

    @CreateDateColumn()
    creatTime: Date

    @UpdateDateColumn()
    updateTime: Date

    @ManyToMany(() => Role)
    @JoinTable({
        name: 'user_roles'
    })
    roles: Role[] 
}
