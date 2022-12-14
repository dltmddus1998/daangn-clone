import { Field, ObjectType } from '@nestjs/graphql';
import { Post } from 'src/posts/entities/post.entity';
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@ObjectType()
export class PostImage extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn({ type: 'int' })
  postImageId!: number;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  imagePath!: string;

  @JoinColumn({ name: 'postId' })
  @ManyToOne(type => Post, post => post.postImages, { eager: false, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  post!: number;
}
