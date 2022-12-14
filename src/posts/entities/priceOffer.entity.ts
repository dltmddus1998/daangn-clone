import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Post } from '../entities/post.entity';

@Entity()
@ObjectType()
export class PriceOffer extends BaseEntity {
  @Field(type => Int)
  @PrimaryGeneratedColumn({ type: 'int' })
  priceOfferId!: number;

  @Field()
  @Column()
  offerPrice!: number;

  @Field(type => Boolean)
  @Column({ type: 'boolean', default: false })
  accept!: boolean;

  @Field()
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @Field(type => Int)
  @JoinColumn({ name: 'postId' })
  @ManyToOne(type => Post, post => post.priceOffer, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  post!: Post;
}
