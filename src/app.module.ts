import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostModule } from './posts/post.module';
import { typeORMConfig } from './configs/typeorm.config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UserModule } from './users/user.module';
import { ChatModule } from './chats/chat.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeORMConfig),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      debug: true,
      playground: true,
      context: ({ req, connection }) => {
        if (req) {
          return req;
        } else {
          return connection;
        }
      },
    }),
    PostModule,
    UserModule,
    ChatModule,
    EventsModule,
  ],
})
export class AppModule {}
