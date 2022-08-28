import { Field, ObjectType } from "@nestjs/graphql";
import { Category } from "src/categories/category.entity";
import { DealState } from "src/dealStates/dealState.entity";
import { TownRange } from "src/townRanges/townRange.entity";
import { User } from 'src/users/user.entity';
import {BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';

@Entity()
@ObjectType()
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn({type: 'int'})
  postId!: number;

  @Field()
  @Column({type: 'varchar', length: 30})
  title!: string;

  @Field()
  @Column({type: 'text'})
  content!: string;

  @Field()
  @Column()
  price!: number;

  @Field()
  @Column({default: false})
  isOfferedPrice!: boolean;

  @Field()
  @Column({type: 'boolean', default: false})
  isHidden!: boolean;

  @Field()
  @Column({type: 'boolean', default: false})
  reportHandling!: boolean;

  @Field()
  @Column({type: 'int', default: 0})
  likes!: number;

  @Field()
  @Column({type: 'int', default: 0})
  views!: number;

  @Field()
  @CreateDateColumn({type: 'datetime'})
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({type: 'datetime'})
  updatedAt!: Date;

  @Field()
  @Column({type: 'datetime', default: () => "CURRENT_TIMESTAMP"})
  pulledAt!: Date;

  // @Field()
  // @JoinColumn({name: 'userName'})
  // @ManyToOne(type => User, user => user.posts, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  // userName!: User;

  @Field()
  @JoinColumn({name: 'categoryId'})
  @ManyToOne(type => Category, category => category.posts, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  category!: Category

  @Field()
  @JoinColumn({name: 'townRangeId'})
  @ManyToOne(type => TownRange, townRange => townRange.posts, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  townRange!: TownRange

  @Field()
  @JoinColumn({name: 'dealStateId'})
  @ManyToOne(type => DealState, dealState => dealState.posts, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  dealState!: DealState
}