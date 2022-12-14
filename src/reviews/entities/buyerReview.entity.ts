import { Field, ObjectType } from '@nestjs/graphql';
import { Post } from 'src/posts/entities/post.entity';
import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ScoreItem } from './scoreItem.entity';
import { SelectedMannerItemToBuyer } from './selectedMannerItemToBuyer.entity';

@Entity()
@ObjectType()
export class BuyerReview extends BaseEntity {
  @Field(() => Number)
  @PrimaryGeneratedColumn({ type: 'int' })
  buyerReviewId!: number;

  @Field()
  @Column({ type: 'text' })
  review!: string;

  @Field()
  @Column({ type: 'boolean' })
  retransaction!: boolean;

  @Field()
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ type: 'datetime' })
  updatedAt?: Date;

  @Field({ nullable: true })
  @DeleteDateColumn({ type: 'datetime' })
  deletedAt?: Date;

  @Field(() => Post)
  @JoinColumn({ name: 'postId' })
  @OneToOne(type => Post, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  post!: Post;

  @Field(() => ScoreItem)
  @JoinColumn({ name: 'score' })
  @ManyToOne(type => ScoreItem, scoreItem => scoreItem.buyerReview, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  score!: ScoreItem;

  @Field(() => [SelectedMannerItemToBuyer])
  @OneToMany(type => SelectedMannerItemToBuyer, selectedMannerItemToBuyer => selectedMannerItemToBuyer.buyerReview, { eager: true })
  selectedMannerItems!: SelectedMannerItemToBuyer[];
}
