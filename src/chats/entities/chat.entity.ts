import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { ChatRoom } from './chatRoom.entity';
import { ChatComplaints } from './chatComplaints.entity';

@Entity()
@ObjectType()
export class Chat extends BaseEntity {
  @Field(() => Number)
  @PrimaryGeneratedColumn({ type: 'int' })
  chatId!: number;

  @Field(() => ChatRoom)
  @JoinColumn({ name: 'chatRoomId' })
  @ManyToOne(type => ChatRoom, chatRoom => chatRoom.chat, { eager: true })
  chatRoom!: ChatRoom;

  @Field(() => User)
  @JoinColumn({ name: 'writer' })
  @ManyToOne(type => User, user => user.chat, { eager: true })
  user!: User;

  @Field()
  @Column({ type: 'text' })
  chatting!: string;

  @Field()
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @Field()
  @Column({ default: false })
  isConfirmed!: Boolean;

  @Field()
  @Column({ default: false })
  reportHandling!: boolean;

  @OneToMany(type => ChatComplaints, chatComplaints => chatComplaints.chat, { eager: false })
  chatComplaints!: ChatComplaints[];
}
