import { AuthenticationError } from 'apollo-server-core';
import { CreateChatDto } from './dto/createChat.dto';
import { ChatService } from './chat.service';
import { Logger } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayInit, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket, Server, Namespace } from 'socket.io';
import { User } from 'src/users/entities/user.entity';
import { CreateChatRoomDto } from './dto/createChatRoom.dto';
import jwt from 'jsonwebtoken';
import * as config from 'config';
import { ChatRoom } from './entities/chatRoom.entity';

const jwtConfig: any = config.get('jwt');

// let createdChatRooms: string[] = [];
let createdChatRooms = ChatRoom.find().then(chatRoom => {
  return chatRoom;
});

@WebSocketGateway(3000, {
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway {}
