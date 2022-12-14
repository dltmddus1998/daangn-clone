import { Field, InputType } from '@nestjs/graphql';
import { IsNumber, Min } from 'class-validator';
import { ComplaintReason } from 'src/posts/entities/complaintReason.entity';
import { ProcessState } from 'src/posts/entities/processState.entity';

@InputType()
export class SearchComplaintDto {
  @Field(() => Number, { nullable: true })
  complaintReason?: ComplaintReason;

  @Field(() => Number, { nullable: true })
  processState?: ProcessState;

  @Field(() => String, { nullable: true })
  memo?: string;

  @Field({ nullable: true, defaultValue: 10 })
  @IsNumber()
  @Min(1)
  perPage?: number;

  @Field({ nullable: true, defaultValue: 1 })
  @IsNumber()
  @Min(1)
  page?: number;
}
