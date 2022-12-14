import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { AdminAuthority } from './adminAuthority.entity';
import { WorkLogs } from './workLogs.entity';

@Entity()
@ObjectType()
export class Admin extends BaseEntity {
  @Field(() => String)
  @PrimaryColumn({ type: 'varchar', unique: true })
  adminId!: string;

  @Field()
  @Column({ type: 'varchar' })
  adminPw!: string;

  @Field()
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @Field(() => [AdminAuthority])
  @OneToMany(type => AdminAuthority, adminAuthority => adminAuthority.admin, { eager: true })
  authorities!: AdminAuthority[];

  @Field(() => [WorkLogs])
  @OneToMany(type => WorkLogs, workLogs => workLogs.admin, { eager: false })
  workLogs!: WorkLogs[];
}
