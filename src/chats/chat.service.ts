import { BlockUser } from 'src/chats/entities/blockUser.entity';
import { CreateChatComplaintsDto } from './dto/createChatComplaints.dto';
import { UserComplaints } from 'src/chats/entities/userComplaints.entity';
import { CreateUsersComplaintsDto } from './dto/createUsersComplaints.dto';
import { CreateChatDto } from './dto/createChat.dto';
import { CreateChatRoomDto } from './dto/createChatRoom.dto';
import { BadRequestException, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRepository } from './repositories/chat.repository';
import { User } from 'src/users/entities/user.entity';
import { ChatRoom } from './entities/chatRoom.entity';
import { Post } from 'src/posts/entities/post.entity';
import { Chat } from './entities/chat.entity';
import { getRepository } from 'typeorm';
import { ChatComplaints } from './entities/chatComplaints.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRepository)
    private chatRepository: ChatRepository,
  ) {}
  clientToUser = {};

  async identify(user: User, clientId: string) {
    this.clientToUser[clientId] = user.userName;
    return Object.values(this.clientToUser);
  }

  async getClientName(clientId: string) {
    return this.clientToUser[clientId];
  }

  async getChatListOfChatRoom(user: User, chatRoomId: number): Promise<Chat[]> {
    /**
     * 특정 채팅방의 채팅 조회
     *
     * @author 이승연(dltmddus1998)
     * @param {User, chatRoomId} 로그인한 유저, 채팅방 번호
     * @return {Chat[]} 채팅 리스트
     * @throws {BadRequestException} 해당 채팅방에 권한이 없는 유저 금지
     *
     */
    const foundChat = await Chat.find({
      where: {
        chatRoom: chatRoomId,
      },
    });
    let filteredChats = [];
    foundChat.forEach(chat => {
      if (chat.user.userName === user.userName || chat.chatRoom.user.userName === user.userName) {
        filteredChats.push(chat);
      } else {
        throw new BadRequestException('해당 채팅방의 참여자가 아닌 경우 조회할 수 없습니다.');
      }
    });
    return filteredChats;
  }

  async getChatRoomById(chatRoomId: number) {
    const found = await this.chatRepository.findOne({
      where: {
        chatRoomId,
      },
    });
    if (!found) {
      throw new NotFoundException('해당 채팅방은 존재하지 않습니다.');
    }
    return found;
  }

  async getChatRoomList(user: User, postId: number) {
    /**
     * 채팅방 리스트 조회
     *
     * @author 이승연(dltmddus1998)
     * @param {User, postId} 로그인한 유저, 게시글 번호
     * @return {ChatRoom[]} 채팅방 리스트
     */

    // 게시글 작성자만 채팅방 리스트 조회할 수 있어
    return await this.chatRepository.find({
      where: {
        user,
        post: postId,
      },
    });
  }

  async createChatRoom(user: User, createChatRoomDto: CreateChatRoomDto) {
    /**
     * 채팅방 생성
     *
     * @author 이승연(dltmddus1998)
     * @param {User, createChatRoomDto} 로그인한 유저(구매 희망자), 게시글 번호
     * @return {chatRoom} 만들어진 채팅방
     * @throws {BadRequestException} 본인작성글 채팅방 생성 금지, 이미 존재하는 채팅방 생성 금지 (동일한 유저 복수의 채팅방 생성 금지)
     */
    const { post } = createChatRoomDto;
    const foundPost = await Post.findOne(post);
    if (foundPost.user.userName === user.userName) {
      throw new BadRequestException('본인이 작성한 게시글에서 채팅방을 만들 수 없습니다.');
    }
    const chatRoom = await ChatRoom.findOne({
      where: {
        post,
        user,
      },
    });
    if (!chatRoom) {
      const insertId = await this.chatRepository.createChatRoom(user, createChatRoomDto);
      return await this.getChatRoomById(insertId);
    } else {
      throw new InternalServerErrorException('해당 채팅방은 이미 존재합니다.');
    }
  }

  async createChat(user: User, createChatDto: CreateChatDto): Promise<Chat> {
    /**
     * 채팅 생성
     *
     * @author 이승연(dltmddus1998)
     * @param {User, createChatDto}
     * @return {Chat} 방금 보낸 채팅
     * @throws {BadRequestException} 게시글 작성자와 구매희망자 외 채팅 작성 금지 / 차단한 및 차단당한 유저와 채팅 금지
     */
    // 현재 로그인한 유저 - 채팅하려는 상대방 유저 조합이 blockUser에서 targetUser - user에서 발견되면 채팅 불가
    const blockUser = await getRepository(BlockUser).findOne({
      where: {
        user,
      },
    });
    const { chatRoom } = createChatDto;
    const foundChatRoom = await ChatRoom.findOne(chatRoom);
    if (foundChatRoom.user.userName === user.userName || user.userName === foundChatRoom.post.user.userName) {
      const insertId = await this.chatRepository.createChat(user, createChatDto);
      return await Chat.findOne(insertId);
    } else if (foundChatRoom.user.userName === blockUser.user.userName && user.userName === blockUser.targetUser.userName) {
      throw new BadRequestException('로그인한 유저를 차단한 유저와는 채팅할 수 없습니다.');
    } else if (foundChatRoom.user.userName === blockUser.targetUser.userName && user.userName === blockUser.user.userName) {
      throw new BadRequestException('차단한 유저와는 채팅할 수 없습니다.');
    } else {
      throw new BadRequestException('해당 게시글 작성자와 구매희망자 외에는 채팅에 참여할 수 없습니다.');
    }
  }

  async getUserComplaintById(complaintId: number): Promise<UserComplaints> {
    const found = await getRepository(UserComplaints).findOne(complaintId);
    if (!found) {
      throw new NotFoundException(`complaintId가 ${complaintId}인 것을 찾을 수 없습니다.`);
    }
    return found;
  }

  async reportUserFromChat(user: User, createUsersComplaintsDto: CreateUsersComplaintsDto): Promise<UserComplaints> {
    /**
     * 채팅 상대 유저 신고
     *
     * @author 이승연(dltmddus1998)
     * @param {User, CreateUsersComplaintsDto} 로그인한 유저, 신고대상 유저, 신고 이유
     * @return {UserComplaints} 유저 관련 신고 데이터
     */
    const { subjectUserName } = createUsersComplaintsDto;
    const targetUser = await getRepository(User).findOne({
      where: {
        userName: subjectUserName,
      },
    });
    const blockUser = await getRepository(BlockUser).findOne({
      where: {
        user,
        targetUser,
      },
    });
    if (blockUser) {
      throw new BadRequestException('이미 해당 유저에 대한 차단 기록이 존재합니다.');
    }
    const insertId = await this.chatRepository.dealReportedUserTransaction(user, createUsersComplaintsDto);
    return await this.getUserComplaintById(insertId);
  }

  async getChatComplaintById(complaintId: number): Promise<ChatComplaints> {
    const found = await getRepository(ChatComplaints).findOne(complaintId);
    if (!found) {
      throw new NotFoundException(`complaintId가 ${complaintId}인 것을 찾을 수 없습니다.`);
    }
    return found;
  }

  async reportChat(user: User, createChatComplaintsDto: CreateChatComplaintsDto): Promise<ChatComplaints> {
    /**
     * 채팅 신고
     *
     * @author 이승연(dltmddus1998)
     * @param {User, CreateChatComplaintsDto} 로그인한 유저, 신고대상 채팅, 신고 이유
     * @return {ChatComplaints} 채팅 관련 신고 데이터
     * @throws {BadRequestException} 이미 신고한 채팅 신고 불가
     */
    const { chat } = createChatComplaintsDto;
    const reportedChat = await getRepository(ChatComplaints).findOne({
      where: {
        chat,
      },
    });
    if (reportedChat) {
      throw new BadRequestException('이미 신고한 채팅입니다.');
    }
    const insertId = await this.chatRepository.reportChat(user, createChatComplaintsDto);
    return await this.getChatComplaintById(insertId);
  }
}
