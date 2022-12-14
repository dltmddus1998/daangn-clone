import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from 'src/posts/entities/post.entity';
import { User } from 'src/users/entities/user.entity';
import { Chat } from './chat.entity';

@Entity()
@ObjectType()
export class ChatRoom extends BaseEntity {
  @Field(() => Number)
  @PrimaryGeneratedColumn({ type: 'int' })
  chatRoomId!: number;

  @Field()
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @Field()
  @Column({ default: false })
  sellerLeft!: boolean;

  @Field()
  @Column({ default: false })
  senderLeft!: boolean;

  @Field(() => Post)
  @JoinColumn({ name: 'postId' })
  @ManyToOne(type => Post, post => post.chatRoom, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  post!: Post;

  @Field(() => User)
  @JoinColumn({ name: 'userPhoneNumber' })
  @ManyToOne(type => User, user => user.chatRoom, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  user!: User;

  @OneToMany(type => Chat, chat => chat.chatRoom, { eager: false })
  chat!: Chat[];
}
