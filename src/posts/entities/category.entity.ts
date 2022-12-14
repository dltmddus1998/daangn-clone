import { Field, ObjectType } from '@nestjs/graphql';
import { Post } from 'src/posts/entities/post.entity';
import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

@Entity()
@ObjectType()
export class Category extends BaseEntity {
  @Field()
  @PrimaryColumn({ type: 'int' })
  categoryId!: number;

  @Field()
  @Column({ type: 'varchar' })
  category!: string;

  @OneToMany(type => Post, post => post.category, { eager: false })
  posts!: Post[];
}
