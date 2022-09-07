import { EntityRepository, getRepository, Repository } from 'typeorm';
import { ChatRoom } from './chatRoom.entity';

@EntityRepository(ChatRoom)
export class ChatRoomRepository extends Repository<ChatRoom> {}
