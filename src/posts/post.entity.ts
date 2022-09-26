import { Field, ObjectType } from '@nestjs/graphql';
import { Category } from 'src/categories/category.entity';
import { DealState } from 'src/dealStates/dealState.entity';
import { TownRange } from 'src/townRanges/townRange.entity';
import { User } from 'src/users/user.entity';
import { PriceOffer } from './priceOffer.entity';
import { PostsComplaint } from './postsComplaint.entity';
import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PostsLikeRecord } from './postsLikeRecord.entity';
import { PostImage } from './postImage.entity';
import { PurchaseHistory } from '../mypage/purchaseHistory.entity';
import { PostsViewRecord } from './postsViewRecord.entity';
import { ChatRoom } from 'src/chats/chatRoom.entity';
import { Location } from 'src/users/location.entity';

@Entity()
@ObjectType()
export class Post extends BaseEntity {
  @Field(() => Number)
  @PrimaryGeneratedColumn({ type: 'int' })
  postId!: number;

  @Field()
  @Column({ type: 'varchar', length: 30 })
  title!: string;

  @Field()
  @Column({ type: 'text' })
  content!: string;

  @Field()
  @Column()
  price!: number;

  @Field(type => Boolean)
  @Column({ default: false, type: 'boolean' })
  isOfferedPrice!: boolean;

  @Field()
  @Column({ type: 'boolean', default: false })
  isHidden!: boolean;

  @Field()
  @Column({ type: 'boolean', default: false })
  reportHandling!: boolean;

  @Field()
  @Column({ type: 'int', default: 0 })
  likes!: number;

  @Field()
  @Column({ type: 'int', default: 0 })
  views!: number;

  @Field()
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @Field()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  pulledAt!: Date;

  @Field(() => User)
  @JoinColumn({ name: 'phoneNumber' })
  @ManyToOne(type => User, user => user.posts, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  user!: User;

  @Field()
  @JoinColumn({ name: 'categoryId' })
  @ManyToOne(type => Category, category => category.posts, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  category!: Category;

  @Field(() => TownRange)
  @JoinColumn({ name: 'townRangeId' })
  @Column({ type: 'int', default: 4 })
  @ManyToOne(type => TownRange, townRange => townRange.posts, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  townRange!: TownRange;

  @Field(() => Location)
  @JoinColumn({ name: 'locationId' })
  @ManyToOne(type => Location, location => location.posts, { eager: true, onUpdate: 'RESTRICT', onDelete: 'RESTRICT' })
  location!: Location;

  @Field(() => DealState)
  @JoinColumn({ name: 'dealStateId' })
  @ManyToOne(type => DealState, dealState => dealState.posts, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  dealState!: DealState;

  @Field(() => [PostImage], { nullable: true })
  @OneToMany(type => PostImage, postImages => postImages.post, { eager: true })
  postImages?: PostImage[];

  @OneToMany(type => PriceOffer, priceOffer => priceOffer.post)
  priceOffer!: PriceOffer[];

  @OneToMany(type => PostsComplaint, postsComplaint => postsComplaint.post, { eager: false })
  postsComplaint!: PostsComplaint[];

  @OneToMany(type => PostsLikeRecord, postsLikeRecord => postsLikeRecord.post, { eager: false })
  postsLikeRecord!: PostsLikeRecord[];

  @OneToMany(type => PostsViewRecord, postsViewRecord => postsViewRecord.post, { eager: false })
  postsViewRecord!: PostsViewRecord[];

  @OneToMany(type => PurchaseHistory, purchaseHistory => purchaseHistory.post, { eager: false })
  purchaseHistory!: PurchaseHistory[];

  @OneToMany(type => ChatRoom, chatRoom => chatRoom.post, { eager: false })
  chatRoom!: ChatRoom[];
}
