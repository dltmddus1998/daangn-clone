import { Field, Int, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PostsComplaint } from '../src/posts/postsComplaint.entity';

/**
 * PostsComplaint 참조
 */

@Entity()
@ObjectType()
export class ProcessState extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn({ type: 'int' })
  processStateId!: number;

  @Field()
  @Column({ type: 'varchar' })
  processState!: string;

  @OneToMany(type => PostsComplaint, postsComplaint => postsComplaint.processState, { eager: false })
  postsComplaint!: PostsComplaint[];
}
