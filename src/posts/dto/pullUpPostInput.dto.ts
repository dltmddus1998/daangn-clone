import {Field, InputType, Int} from '@nestjs/graphql';

@InputType()
export class PullUpPostInputDto {
  @Field()
  readonly postId: number;
}
