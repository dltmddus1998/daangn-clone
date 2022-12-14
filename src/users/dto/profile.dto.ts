import { Field, InputType } from '@nestjs/graphql';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import { FileUpload } from '../models/fileUpload.model';

@InputType()
export class ProfileUserDto {
  @Field(() => String, { nullable: true })
  userName?: string;

  @Field(() => GraphQLUpload, { nullable: true })
  profileImage?: Promise<FileUpload>;
}
