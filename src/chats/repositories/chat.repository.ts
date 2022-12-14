import { BlockUser } from 'src/chats/entities/blockUser.entity';
import { ChatComplaints } from '../entities/chatComplaints.entity';
import { CreateChatComplaintsDto } from '../dto/createChatComplaints.dto';
import { UserComplaints } from 'src/chats/entities/userComplaints.entity';
import { CreateUsersComplaintsDto } from '../dto/createUsersComplaints.dto';
import { InternalServerErrorException } from '@nestjs/common';
import { CreateChatRoomDto } from '../dto/createChatRoom.dto';
import { EntityManager, EntityRepository, getConnection, getRepository, Repository } from 'typeorm';
import { ChatRoom } from '../entities/chatRoom.entity';
import { Chat } from '../entities/chat.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateChatDto } from '../dto/createChat.dto';

@EntityRepository(ChatRoom)
export class ChatRepository extends Repository<ChatRoom> {
  async createChatRoom(user: User, createChatRoomDto: CreateChatRoomDto) {
    const { post } = createChatRoomDto;
    const query = await getRepository(ChatRoom).createQueryBuilder('ChatRoom').insert().into(ChatRoom).values({ post, user }).execute();
    return query.raw.insertId;
  }

  async createChat(user: User, createChatDto: CreateChatDto) {
    const { chatRoom, chatting } = createChatDto;
    const query = await getRepository(Chat).createQueryBuilder('Chat').insert().into(Chat).values({ chatRoom, user, chatting }).execute();
    return query.raw.insertId;
  }

  async reportUserFromChat(manager: EntityManager, user: User, createUsersComplaintsDto: CreateUsersComplaintsDto): Promise<number> {
    const { subjectUserName, complaintReason } = createUsersComplaintsDto;
    const user1 = await getRepository(User).findOne({ where: { userName: subjectUserName } });
    const query = await manager
      .getRepository(UserComplaints)
      .createQueryBuilder('UserComplaints')
      .insert()
      .into(UserComplaints)
      .values({
        complaintUser: user,
        subjectUser: user1,
        complaintReason,
      })
      .execute();
    return query.raw.insertId;
  }

  async blockUser(manager: EntityManager, user: User, createUsersComplaintsDto: CreateUsersComplaintsDto) {
    const { subjectUserName } = createUsersComplaintsDto;
    const user1 = await getRepository(User).findOne({ where: { userName: subjectUserName } });
    const query = await manager
      .getRepository(BlockUser)
      .createQueryBuilder('BlockUser')
      .insert()
      .into(BlockUser)
      .values({
        user,
        targetUser: user1,
      })
      .execute();
    return query.raw.insertId;
  }

  async dealReportedUserTransaction(user: User, createUsersComplaintDto: CreateUsersComplaintsDto) {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await this.reportUserFromChat(queryRunner.manager, user, createUsersComplaintDto);
      const insertId = await this.blockUser(queryRunner.manager, user, createUsersComplaintDto);
      await queryRunner.commitTransaction();
      return insertId;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      throw new InternalServerErrorException('채팅 상대 유저 신고 및 차단을 실패하였습니다. 잠시후 다시 시도해주세요.');
    } finally {
      await queryRunner.release();
    }
  }

  async reportChat(user: User, createChatComplaintsDto: CreateChatComplaintsDto) {
    const { chat, complaintReason } = createChatComplaintsDto;
    const query = await getRepository(ChatComplaints)
      .createQueryBuilder('ChatComplaints')
      .insert()
      .into(ChatComplaints)
      .values({
        chat,
        complaintReason,
        user,
      })
      .execute();
    return query.raw.insertId;
  }
}
