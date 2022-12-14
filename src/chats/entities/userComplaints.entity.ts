import { Field, ObjectType } from '@nestjs/graphql';
import { ComplaintReason } from 'src/posts/entities/complaintReason.entity';
import { ProcessState } from 'src/posts/entities/processState.entity';
import { User } from 'src/users/entities/user.entity';
import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@ObjectType()
export class UserComplaints extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn({ type: 'int' })
  complaintId!: number;

  @Field(() => ComplaintReason)
  @JoinColumn({ name: 'complaintReasonId' })
  @ManyToOne(type => ComplaintReason, complaintReason => complaintReason.userComplaints, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  complaintReason!: ComplaintReason;

  @Field(() => ProcessState)
  @JoinColumn({ name: 'processState' })
  @Column({ type: 'int', default: 1 })
  @ManyToOne(type => ProcessState, processState => processState.userComplaints, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  processState!: ProcessState;

  @Field(() => User)
  @JoinColumn({ name: 'complaintUserPhoneNumber' })
  @ManyToOne(type => User, user => user.complaintUser, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  complaintUser!: User;

  @Field(() => User)
  @JoinColumn({ name: 'subjectUserPhoneNumber' })
  @ManyToOne(type => User, user => user.subjectUser, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  subjectUser!: User;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  memo?: string;

  @Field()
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
