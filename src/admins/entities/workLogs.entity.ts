import { ProcessTypes } from './processTypes.entity';
import { WorkTypes } from './workTypes.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Admin } from './admin.entity';

@Entity()
@ObjectType()
export class WorkLogs extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn({ type: 'int' })
  workId!: number;

  @Field(() => Admin)
  @JoinColumn({ name: 'adminId' })
  @ManyToOne(type => Admin, admin => admin.workLogs, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  admin!: Admin;

  @Field(() => WorkTypes)
  @JoinColumn({ name: 'workType' })
  @ManyToOne(type => WorkTypes, workTypes => workTypes.workLogs, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  workTypes!: number;

  @Field(() => ProcessTypes)
  @JoinColumn({ name: 'processType' })
  @ManyToOne(type => ProcessTypes, processTypes => processTypes.workLogs, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  processTypes!: number;

  @Field()
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
