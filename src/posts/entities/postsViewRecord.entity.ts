import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { BaseEntity, Entity, JoinColumn, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Post } from '../entities/post.entity';

@Entity()
@ObjectType()
export class PostsViewRecord extends BaseEntity {
  @Field(() => Number)
  @PrimaryGeneratedColumn({ type: 'int' })
  postsViewId!: number;

  @Field(() => Post)
  @JoinColumn({ name: 'postId' })
  @ManyToOne(type => Post, post => post.postsViewRecord, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  post!: Post;

  @Field(() => User)
  @JoinColumn({ name: 'userPhoneNumber' })
  @ManyToOne(type => User, user => user.postsViewRecord, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  user!: User;
}
