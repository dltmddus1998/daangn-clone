import { Field, ObjectType, Int } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { BaseEntity, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@ObjectType()
export class PurchaseHistory extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn({ type: 'int' })
  purchaseHistoryId!: number;

  @Field(() => User)
  @JoinColumn({ name: 'userPhoneNumber' })
  @ManyToOne(type => User, user => user.purchaseHistory, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  user!: User;

  @Field(() => Post)
  @JoinColumn({ name: 'postId' })
  @ManyToOne(type => Post, post => post.purchaseHistory, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  post!: Post;

  @Field()
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
