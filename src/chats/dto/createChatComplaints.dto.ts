import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { Chat } from '../entities/chat.entity';
import { ComplaintReason } from 'src/posts/entities/complaintReason.entity';

@InputType()
export class CreateChatComplaintsDto {
  @Field(() => Number)
  @IsNotEmpty()
  @IsNumber()
  chat!: Chat;

  @Field(() => Number)
  @IsNotEmpty()
  @IsNumber()
  complaintReason!: ComplaintReason;
}
