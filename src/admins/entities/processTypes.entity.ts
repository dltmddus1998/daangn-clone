import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { WorkLogs } from './workLogs.entity';

@Entity()
@ObjectType()
export class ProcessTypes extends BaseEntity {
  @Field()
  @PrimaryColumn({ type: 'int' })
  processId!: number;

  @Field()
  @Column({ type: 'text' })
  process!: string;

  @Field(() => [WorkLogs])
  @OneToMany(() => WorkLogs, workLogs => workLogs.processTypes, { eager: false })
  workLogs!: WorkLogs[];
}
