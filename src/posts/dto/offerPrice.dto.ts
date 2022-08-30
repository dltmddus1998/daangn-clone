import {Field, InputType} from '@nestjs/graphql';

@InputType()
export class OfferPriceDto {
  @Field()
  readonly priceOfferId: number;

  @Field()
  readonly postId: number;

  @Field()
  offerPrice: number;

  @Field()
  accept: boolean;
}
