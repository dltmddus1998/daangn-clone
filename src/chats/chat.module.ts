import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/users/user.module';
import { ChatRepository } from './repositories/chat.repository';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRepository]), UserModule],
  providers: [ChatService, ChatResolver],
})
export class ChatModule {}
