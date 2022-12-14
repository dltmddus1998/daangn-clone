import { Field, InputType } from '@nestjs/graphql';
import { IsNumber, Min } from 'class-validator';
import { WorkTypes } from '../entities/workTypes.entity';
import { ProcessTypes } from '../entities/processTypes.entity';

@InputType()
export class SearchWorkLogsDto {
  @Field(() => Number, { nullable: true })
  workTypes?: WorkTypes;

  @Field(() => Number, { nullable: true })
  processTypes?: ProcessTypes;

  @Field({ nullable: true, defaultValue: 10 })
  @IsNumber()
  @Min(1)
  perPage?: number;

  @Field({ nullable: true, defaultValue: 1 })
  @IsNumber()
  @Min(1)
  page?: number;
}
