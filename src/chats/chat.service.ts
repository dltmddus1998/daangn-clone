import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRepository } from './chat.repository';
import { ChatRoomRepository } from './chatRoom.repository';
import { EventsGateway } from 'src/events/events.gateway';
import * as config from 'config';

const serverConfig: any = config.get('server');

@Injectable()
export class ChatService {
  /**
   * 코드 작성자: 이승연
   * 기능: 채팅
   * 1) 게시물에서 판매자에게 (구매 희망자가) 채팅 시작 가능
   * 2) 판매자 <-> 구매희망자 실시간 채팅
   * 3) 사용자 모두 상대방이나 채팅 자체 신고 가능
   *
   * 세부 구현 사항
   * 🚩 특정 게시글에서 (구매 희망자가) 채팅방 생성하기
   * 🚩 특정 게시글에서
   */
  constructor(
    @InjectRepository(ChatRoomRepository)
    private chatRoomRepository: ChatRoomRepository,
    @InjectRepository(ChatRepository)
    private chatRepository: ChatRepository,
    private eventsGateway: EventsGateway,
  ) {}

  async chatToSeller() {
    // socket.io로 판매자에게 전송
    this.eventsGateway.server.to(`http://localhost:${serverConfig.port}`);
  }
}
