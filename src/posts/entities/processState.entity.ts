import { UserComplaints } from '../../chats/entities/userComplaints.entity';
import { ChatComplaints } from '../../chats/entities/chatComplaints.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PostComplaints } from './postComplaints.entity';

@Entity()
@ObjectType()
export class ProcessState extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn({ type: 'int' })
  processStateId!: number;

  @Field()
  @Column({ type: 'varchar' })
  processState!: string;

  @OneToMany(type => PostComplaints, postComplaints => postComplaints.processState, { eager: false })
  postsComplaint!: PostComplaints[];

  @OneToMany(type => ChatComplaints, chatComplaints => chatComplaints.processState, { eager: false })
  chatComplaints!: ChatComplaints[];

  @OneToMany(type => UserComplaints, userComplaints => userComplaints.processState, { eager: false })
  userComplaints!: UserComplaints[];
}
