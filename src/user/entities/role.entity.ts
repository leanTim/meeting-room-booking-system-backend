import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Permission } from './permission.entity';

@Entity({
    name: 'roles'
})
export class Role {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        comment: '管理员/普通用户',
        length: 20
    })
    name: string

    @ManyToMany(() => Permission)
    @JoinTable({
        name: 'role_permissions'
    })
    permissions: Permission[]
}