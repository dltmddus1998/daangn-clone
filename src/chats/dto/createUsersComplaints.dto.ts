import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { User } from 'src/users/entities/user.entity';
import { ComplaintReason } from 'src/posts/entities/complaintReason.entity';

@InputType()
export class CreateUsersComplaintsDto {
  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  subjectUserName!: User;

  @Field(() => Number)
  @IsNotEmpty()
  @IsNumber()
  complaintReason!: ComplaintReason;
}
