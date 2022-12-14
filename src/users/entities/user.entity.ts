import { ChatComplaints } from '../../chats/entities/chatComplaints.entity';
import { UserComplaints } from 'src/chats/entities/userComplaints.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import { Post } from 'src/posts/entities/post.entity';
import { PostsLikeRecord } from 'src/posts/entities/postsLikeRecord.entity';
import { PurchaseHistory } from 'src/mypage/entities/purchaseHistory.entity';
import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Followings } from '../../mypage/entities/followings.entity';
import { PostsViewRecord } from 'src/posts/entities/postsViewRecord.entity';
import { Location } from './location.entity';
import { ChatRoom } from 'src/chats/entities/chatRoom.entity';
import { Chat } from 'src/chats/entities/chat.entity';
import { BlockUser } from 'src/chats/entities/blockUser.entity';

@Entity()
@ObjectType()
export class User extends BaseEntity {
  @Field()
  @PrimaryColumn({ type: 'varchar', length: 11, unique: true })
  phoneNumber!: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 30, unique: true, nullable: true })
  userName?: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  profileImage?: string;

  @Field()
  @Column({ type: 'decimal', precision: 3, scale: 1, default: 36.5 })
  mannerTemp!: number;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  respTime?: number;

  @Field()
  @Column({ type: 'boolean' })
  marketingInfoAgree!: boolean;

  @Field()
  @Column({ type: 'boolean', default: false })
  suspensionOfUse!: boolean;

  @Field()
  @Column({ default: false })
  reportHandling!: boolean; // 채팅 관련 신고 여부

  @Field()
  @Column({ default: 0 })
  reportedTimes!: number; // 신고당한 횟수

  @Field()
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @OneToMany(type => Post, post => post.user, { eager: false })
  posts!: Post[];

  @OneToMany(type => PostsLikeRecord, postsLikeRecord => postsLikeRecord.post, { eager: false })
  postsLikeRecord!: PostsLikeRecord[];

  @OneToMany(type => PostsViewRecord, postsViewRecord => postsViewRecord.user, { eager: false })
  postsViewRecord!: PostsViewRecord;

  @OneToMany(type => Followings, followings => followings.followingUser, { eager: false })
  followings!: Followings[];

  @OneToMany(type => Followings, followings => followings.followerUser, { eager: false })
  followers!: Followings[];

  @OneToMany(type => PurchaseHistory, purchaseHistory => purchaseHistory.user, { eager: false })
  purchaseHistory!: PurchaseHistory[];

  @OneToMany(type => Location, location => location.user, { eager: false })
  locations!: Location[];

  @OneToMany(type => ChatRoom, chatRoom => chatRoom.user, { eager: false })
  chatRoom!: ChatRoom[];

  @OneToMany(type => Chat, chat => chat.user, { eager: false })
  chat!: Chat[];

  @OneToMany(type => UserComplaints, userComplaints => userComplaints.complaintUser, { eager: false })
  complaintUser!: UserComplaints[];

  @OneToMany(type => UserComplaints, userComplaints => userComplaints.subjectUser, { eager: false })
  subjectUser!: UserComplaints[];

  @OneToMany(type => ChatComplaints, chatComplaints => chatComplaints.user, { eager: false })
  chatComplaints!: ChatComplaints[];

  @OneToMany(type => BlockUser, blockUser => blockUser.user, { eager: false })
  user!: BlockUser[];

  @OneToMany(type => BlockUser, blockUser => blockUser.targetUser, { eager: false })
  targetUser!: BlockUser[];
}
