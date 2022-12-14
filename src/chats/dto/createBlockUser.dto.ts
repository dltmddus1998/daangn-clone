import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';
import { User } from 'src/users/entities/user.entity';

@InputType()
export class CreateBlockUserDto {
  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  targetUserName!: User;
}
