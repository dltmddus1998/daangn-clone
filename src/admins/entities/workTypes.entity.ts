import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { WorkLogs } from './workLogs.entity';

@Entity()
@ObjectType()
export class WorkTypes extends BaseEntity {
  @Field()
  @PrimaryColumn({ type: 'int' })
  workLogId!: number;

  @Field()
  @Column({ type: 'text' })
  workLog!: string;

  @Field(() => [WorkLogs])
  @OneToMany(() => WorkLogs, workLogs => workLogs.workTypes, { eager: false })
  workLogs!: WorkLogs[];
}
