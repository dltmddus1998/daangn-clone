import { Field, ObjectType } from '@nestjs/graphql';
import { Post } from 'src/posts/entities/post.entity';
import { BaseEntity, Column, Entity, JoinColumn, OneToMany, PrimaryColumn } from 'typeorm';

@Entity()
@ObjectType()
export class DealState extends BaseEntity {
  @Field()
  @PrimaryColumn({ type: 'int' })
  dealStateId!: number;

  @Field()
  @Column({ type: 'varchar' })
  dealState!: string;

  @OneToMany(type => Post, post => post.dealState, { eager: false })
  posts!: Post[];
}
