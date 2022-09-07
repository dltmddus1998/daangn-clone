import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoomRepository } from './chatRoom.repository';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';
import { ChatRoomResolver } from './chatRoom.resolver';
import { ChatResolver } from './chat.resolver';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRoomRepository]), TypeOrmModule.forFeature([ChatRepository]), EventsModule],
  providers: [ChatService, ChatRoomResolver, ChatResolver],
})
export class ChatModule {}
