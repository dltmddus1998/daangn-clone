import { Field, Int, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Post } from './post.entity';
// import { ProcessState } from 'src/processStates/processState.entity';
import { ProcessState } from '../processStates/processState.entity';
import { ComplaintReason } from 'src/complaintReasons/complaintReason.entity';

@Entity()
@ObjectType()
export class PostsComplaint extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn({ type: 'int' })
  complaintId!: number;

  @Field(type => Post)
  @JoinColumn({ name: 'postId' })
  @ManyToOne(type => Post, post => post.postsComplaint, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  post!: Post;

  @Field()
  @JoinColumn({ name: 'complaintReasonId' })
  @ManyToOne(type => ComplaintReason, complaintReason => complaintReason.postsComplaint, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  complaintReason!: ComplaintReason;

  @Field()
  @JoinColumn({ name: 'processStateId' })
  @ManyToOne(type => ProcessState, processState => processState.postsComplaint, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  processState!: ProcessState;

  @Field()
  @Column({ type: 'text', nullable: true })
  memo!: string;

  @Field()
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
