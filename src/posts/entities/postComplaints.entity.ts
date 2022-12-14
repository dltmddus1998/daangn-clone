import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from './post.entity';
import { ProcessState } from 'src/posts/entities/processState.entity';
import { ComplaintReason } from 'src/posts/entities/complaintReason.entity';

@Entity()
@ObjectType()
export class PostComplaints extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn({ type: 'int' })
  complaintId!: number;

  @Field(type => Post)
  @JoinColumn({ name: 'postId' })
  @ManyToOne(type => Post, post => post.postsComplaint, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  post!: Post;

  @Field(() => ComplaintReason)
  @JoinColumn({ name: 'complaintReasonId' })
  @ManyToOne(type => ComplaintReason, complaintReason => complaintReason.postComplaints, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  complaintReason!: ComplaintReason;

  @Field(() => ProcessState)
  @JoinColumn({ name: 'processState' })
  @Column({ type: 'int', default: 1 })
  @ManyToOne(type => ProcessState, processState => processState.postsComplaint, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  processState!: ProcessState;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  memo?: string;

  @Field()
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
