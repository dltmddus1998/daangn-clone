import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from './repositories/user.repository';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import * as config from 'config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwtAuth.guard';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import * as redisStore from 'cache-manager-redis-store';
import { LocationRepository } from './repositories/location.repository';

const cacheConfig: any = config.get('cache');
const jwtConfig: any = config.get('jwt');
const passportConfig: any = config.get('passport');
const elasticsearchConfig: any = config.get('elasticsearch');

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: passportConfig.defaultStrategy,
      session: false,
    }),
    JwtModule.register({
      secret: jwtConfig.secret,
      signOptions: {
        expiresIn: jwtConfig.expiresIn,
      },
    }),
    CacheModule.register({
      store: redisStore,
      host: cacheConfig.host,
      port: cacheConfig.port,
      ttl: cacheConfig.ttl,
      max: cacheConfig.max,
    }),
    ElasticsearchModule.register({
      node: elasticsearchConfig.node,
      maxRetries: elasticsearchConfig.maxRetries,
      requestTimeout: elasticsearchConfig.requestTimeout,
      pingTimeout: elasticsearchConfig.pingTimeout,
      sniffOnStart: elasticsearchConfig.sniffOnStart,
    }),
    TypeOrmModule.forFeature([UserRepository, LocationRepository]),
  ],
  providers: [UserService, UserResolver, JwtStrategy, JwtAuthGuard],
  exports: [UserService, JwtStrategy, PassportModule, JwtAuthGuard],
})
export class UserModule {}
