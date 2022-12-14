import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { Post } from '../entities/post.entity';
import { ComplaintReason } from 'src/posts/entities/complaintReason.entity';

@InputType()
export class CreatePostsComplaintsDto {
  @Field(() => Number)
  @IsNotEmpty()
  @IsNumber()
  post!: Post;

  @Field(() => Number)
  @IsNotEmpty()
  @IsNumber()
  complaintReason!: ComplaintReason;
}
