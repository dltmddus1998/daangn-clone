import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
@ObjectType()
export class Followings extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn({ type: 'int' })
  followingId: number;

  @Field(() => User)
  @JoinColumn({ name: 'userPhoneNumber' })
  @ManyToOne(type => User, user => user.followings, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  followingUser!: User;

  @Field(() => User)
  @JoinColumn({ name: 'subjectUserPhoneNumber' })
  @ManyToOne(type => User, user => user.followers, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  followerUser!: User;

  @Field()
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
