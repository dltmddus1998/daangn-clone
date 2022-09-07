import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as config from 'config';
import { Category } from 'src/categories/category.entity';
import { DealState } from 'src/dealStates/dealState.entity';
import { Post } from 'src/posts/post.entity';
import { TownRange } from 'src/townRanges/townRange.entity';
import { User } from 'src/users/user.entity';
import { PriceOffer } from 'src/posts/priceOffer.entity';
import { ComplaintReason } from 'src/complaintReasons/complaintReason.entity';
import { PostsComplaint } from 'src/posts/postsComplaint.entity';
import { ProcessState } from 'src/processStates/processState.entity';
import { ChatRoom } from 'src/chats/chatRoom.entity';
import { Chat } from 'src/chats/chat.entity';

const dbConfig: any = config.get('db');

export const typeORMConfig: TypeOrmModuleOptions = {
  type: dbConfig.type,
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  entities: [Post, User, Category, PriceOffer, DealState, TownRange, ComplaintReason, PostsComplaint, ProcessState, ChatRoom, Chat],
  synchronize: dbConfig.synchronize,
  timezone: dbConfig.timezone,
};
