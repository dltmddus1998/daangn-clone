import { Field, InputType } from '@nestjs/graphql';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import { FileUpload } from '../models/fileUpload.model';
import { Length } from 'class-validator';

@InputType()
export class ProfileUserDto {
  @Field(() => String, { nullable: true })
  @Length(2, 10)
  userName?: string;

  @Field(() => GraphQLUpload, { nullable: true })
  profileImage?: Promise<FileUpload>;
}
