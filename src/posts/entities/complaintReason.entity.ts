import { UserComplaints } from '../../chats/entities/userComplaints.entity';
import { ChatComplaints } from '../../chats/entities/chatComplaints.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { PostComplaints } from 'src/posts/entities/postComplaints.entity';

@Entity()
@ObjectType()
export class ComplaintReason extends BaseEntity {
  @Field(() => Number)
  @PrimaryGeneratedColumn({ type: 'int' })
  complaintReasonId!: number;

  @Field()
  @Column({ type: 'char' })
  type!: string;

  @Field()
  @Column()
  complaintReason!: string;

  @OneToMany(type => PostComplaints, postComplaints => postComplaints.complaintReason, { eager: false })
  postComplaints!: PostComplaints[];

  @OneToMany(type => ChatComplaints, chatComplaints => chatComplaints.complaintReason, { eager: false })
  chatComplaints!: ChatComplaints[];

  @OneToMany(type => UserComplaints, userComplaints => userComplaints.complaintReason, { eager: false })
  userComplaints!: UserComplaints[];
}
