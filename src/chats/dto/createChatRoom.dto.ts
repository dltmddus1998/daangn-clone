import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { Post } from 'src/posts/entities/post.entity';

@InputType()
export class CreateChatRoomDto {
  @Field(() => Number)
  @IsNotEmpty()
  @IsNumber()
  post!: Post;
}
