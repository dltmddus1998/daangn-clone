import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';
import { Category } from 'src/posts/entities/category.entity';
import { TownRange } from 'src/posts/entities/townRange.entity';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import { FileUpload } from 'src/users/models/fileUpload.model';

@InputType()
export class UpdatePostDto {
  @Field()
  @IsNotEmpty()
  @Length(2, 30)
  @IsString()
  title!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  content!: string;

  @Field(() => Number)
  @IsNotEmpty()
  @IsNumber()
  category!: Category;

  @Field()
  @IsNotEmpty()
  @IsNumber()
  price!: number;

  @Field()
  @IsNotEmpty()
  @IsBoolean()
  isOfferedPrice!: boolean;

  @Field(() => Number)
  @IsNotEmpty()
  @IsNumber()
  townRange!: TownRange;

  @Field(() => [GraphQLUpload], { nullable: true })
  images?: Promise<FileUpload>[];
}
