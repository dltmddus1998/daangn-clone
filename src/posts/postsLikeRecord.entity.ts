import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/users/user.entity';
import { BaseEntity, Entity, JoinColumn, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Post } from './post.entity';

@Entity()
@ObjectType()
export class PostsLikeRecord extends BaseEntity {
  @Field(() => Number)
  @PrimaryGeneratedColumn({ type: 'int' })
  postsLikeId!: number;

  @Field(() => Post)
  @JoinColumn({ name: 'postId' })
  @ManyToOne(type => Post, post => post.postsLikeRecord, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  post!: Post;

  @Field(() => User)
  @JoinColumn({ name: 'userName' })
  @ManyToOne(type => User, user => user.postsLikeRecord, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  user!: User;
}
