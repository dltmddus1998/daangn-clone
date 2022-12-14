import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostModule } from './posts/post.module';
import { typeORMConfig } from './configs/typeorm.config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UserModule } from './users/user.module';
import * as graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import * as config from 'config';
import { MypageModule } from './mypage/mypage.module';
import { ReviewModule } from './reviews/review.module';
import { AdminModule } from './admins/admin.module';
import { ChatModule } from './chats/chat.module';

const uploadConfig: any = config.get('upload');

@Module({
  imports: [
    TypeOrmModule.forRoot(typeORMConfig),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      debug: true,
      playground: true,
    }),
    PostModule,
    UserModule,
    MypageModule,
    ReviewModule,
    AdminModule,
    ChatModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(graphqlUploadExpress({ maxFileSize: uploadConfig.maxSize, maxFiles: uploadConfig.maxFiles })).forRoutes('graphql');
  }
}
