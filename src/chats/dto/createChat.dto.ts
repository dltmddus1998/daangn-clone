import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ChatRoom } from '../entities/chatRoom.entity';

@InputType()
export class CreateChatDto {
  @Field(() => Number)
  @IsNotEmpty()
  @IsNumber()
  chatRoom!: ChatRoom;

  @Field()
  @IsNotEmpty()
  @IsString()
  chatting!: string;
}
