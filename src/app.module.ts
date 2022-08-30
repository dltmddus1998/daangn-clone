import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {TypeOrmModule} from '@nestjs/typeorm';
import {GraphQLModule} from '@nestjs/graphql';
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo';
import {PostModule} from './posts/post.module';
// import {PriceOfferModule} from './priceOffer/priceOffer.module';
import {Post} from './posts/post.entity';
import {PriceOffer} from './posts/priceOffer.entity';
import {ApolloServerPluginLandingPageLocalDefault} from 'apollo-server-core';
import {join} from 'path';

@Module({
  imports: [
    PostModule,
    // PriceOfferModule,
    ConfigModule.forRoot({
      envFilePath: [`${__dirname}/.env`],
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: 3306,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [Post, PriceOffer],
      synchronize: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      debug: true,
      playground: false,
      include: [PostModule],
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
