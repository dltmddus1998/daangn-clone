import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class GetOtherProfileDto {
  @Field()
  @IsNotEmpty()
  @IsString()
  userName!: string;
}
