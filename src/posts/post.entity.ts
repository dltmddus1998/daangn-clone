import {PriceOffer} from './priceOffer.entity';
import {Column, Entity, PrimaryGeneratedColumn, OneToMany, BaseEntity} from 'typeorm';
import {Field, Int, ObjectType} from '@nestjs/graphql';

@Entity()
@ObjectType()
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn({type: 'int'})
  postId!: number;

  @Field()
  @Column({
    length: 30,
    nullable: false,
  })
  title!: string;

  @Field()
  @Column({
    length: 500,
    nullable: false,
  })
  content!: string;

  @Field()
  @Column({
    nullable: false,
  })
  price: number;

  @Field()
  @Column({
    default: false,
    nullable: false,
  })
  isOfferedPrice: boolean;

  @Field()
  @Column({
    default: false,
    nullable: false,
  })
  isHidden: boolean;

  @Field()
  @Column({
    default: false,
    nullable: false,
  })
  reportHandling: boolean;

  @Field()
  @Column({
    default: 0,
    nullable: false,
  })
  likes: number;

  @Field()
  @Column({
    default: 0,
    nullable: false,
  })
  views: number;

  @Field()
  @Column({
    nullable: false,
    //   default: new Date(),
  })
  createdAt: Date;

  @Field()
  @Column({
    nullable: false,
    //   default: new Date(),
  })
  updatedAt: Date;

  @OneToMany(type => PriceOffer, priceOffer => priceOffer.priceOffered)
  priceOfferEntities!: PriceOffer[];
}
