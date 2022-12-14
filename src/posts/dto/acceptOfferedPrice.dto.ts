import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

@InputType()
export class AcceptOfferedPriceDto {
  @Field()
  @IsNotEmpty()
  @IsBoolean()
  accept!: boolean;

  @Field(() => Number)
  @IsNotEmpty()
  @IsNumber()
  priceOfferId: number;
}
