import {Column, Entity, PrimaryColumn, ManyToOne} from 'typeorm';
import {Field, Int, ObjectType} from '@nestjs/graphql';
import {Post} from './post.entity';

@Entity()
@ObjectType()
export class PriceOffer {
  @Field(type => Int)
  @PrimaryColumn({nullable: false})
  priceOfferId: number;

  @Field()
  @Column({
    default: 0,
    nullable: false,
  })
  offerPrice: number;

  @Field()
  @Column({
    default: false,
    nullable: false,
  })
  accept: boolean;

  @Field()
  @Column({
    // default: new Date(),
    nullable: false,
  })
  createdAt: Date;

  @ManyToOne(type => Post, post => post.priceOfferEntities)
  priceOffered!: Post;
}
