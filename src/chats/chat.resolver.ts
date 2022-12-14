import { CreateChatComplaintsDto } from './dto/createChatComplaints.dto';
import { ChatComplaints } from './entities/chatComplaints.entity';
import { CreateUsersComplaintsDto } from './dto/createUsersComplaints.dto';
import { UserComplaints } from 'src/chats/entities/userComplaints.entity';
import { CreateChatRoomDto } from './dto/createChatRoom.dto';
import { ChatRoom } from 'src/chats/entities/chatRoom.entity';
import { CreateChatDto } from './dto/createChat.dto';
import { Chat } from 'src/chats/entities/chat.entity';
import { ChatService } from './chat.service';
import { UseGuards, ParseIntPipe } from '@nestjs/common';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { JwtAuthGuard } from 'src/users/guards/jwtAuth.guard';
import { GetUser } from 'src/users/validations/getUser.decorator';
import { User } from 'src/users/entities/user.entity';

@Resolver()
@UseGuards(JwtAuthGuard)
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}

  // 채팅방 생성 ✔︎
  @Mutation(() => ChatRoom)
  createChatRoom(@GetUser() user: User, @Args('createChatRoomDto') createChatRoomDto: CreateChatRoomDto): Promise<ChatRoom> {
    return this.chatService.createChatRoom(user, createChatRoomDto);
  }

  // 채팅 작성 ✔︎
  @Mutation(() => Chat)
  createChat(@GetUser() user: User, @Args('createChatDto') createChatDto: CreateChatDto): Promise<Chat> {
    return this.chatService.createChat(user, createChatDto);
  }

  // 채팅방 리스트 조회 ✔︎
  @Query(() => [ChatRoom])
  getChatRoomList(@GetUser() user: User, @Args('postId', ParseIntPipe) postId: number) {
    return this.chatService.getChatRoomList(user, postId);
  }

  // 특정 채팅방의 채팅 조회 ✔︎
  @Query(() => [Chat])
  getChatListOfChatRoom(@GetUser() user: User, @Args('chatRoomId') chatRoomId: number): Promise<Chat[]> {
    return this.chatService.getChatListOfChatRoom(user, chatRoomId);
  }

  // 채팅 유저 신고
  @Mutation(() => UserComplaints)
  reportUserFromChat(@GetUser() user: User, @Args('createUsersComplaintsDto') createUsersComplaintsDto: CreateUsersComplaintsDto): Promise<UserComplaints> {
    return this.chatService.reportUserFromChat(user, createUsersComplaintsDto);
  }

  // 채팅 신고
  @Mutation(() => ChatComplaints)
  reportChat(@GetUser() user: User, @Args('createChatComplaintsDto') createChatComplaintsDto: CreateChatComplaintsDto): Promise<ChatComplaints> {
    return this.chatService.reportChat(user, createChatComplaintsDto);
  }
}
