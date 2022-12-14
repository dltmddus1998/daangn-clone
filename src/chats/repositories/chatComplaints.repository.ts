import { ChatComplaints } from '../entities/chatComplaints.entity';
import { EntityManager, EntityRepository, getRepository, Repository } from 'typeorm';
import { SearchComplaintDto } from 'src/admins/dto/searchComplaint.dto';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Chat } from '../entities/chat.entity';
import { Admin } from 'src/admins/entities/admin.entity';
import { WorkLogs } from 'src/admins/entities/workLogs.entity';

@EntityRepository(ChatComplaints)
export class ChatComplaintsRepository extends Repository<ChatComplaints> {
  getChatComplaints(searchComplaintDto: SearchComplaintDto) {
    const { complaintReason, processState, memo, perPage, page } = searchComplaintDto;
    const queryBuilder = this.createQueryBuilder('chatComplaints')
      .innerJoinAndSelect('chatComplaints.chat', 'chat')
      .innerJoinAndSelect('chatComplaints.user', 'user')
      .innerJoinAndSelect('chatComplaints.complaintReason', 'complaintReason')
      .innerJoinAndSelect('chatComplaints.processState', 'processState')
      .orderBy('chatComplaints.createdAt', 'DESC')
      .offset((page - 1) * perPage)
      .limit(perPage);
    if (complaintReason) queryBuilder.andWhere('complaintReason.complaintReasonId = :complaintReason', { complaintReason });
    if (processState) queryBuilder.andWhere('processState.processStateId = :processState', { processState });
    if (memo) queryBuilder.andWhere('memo like :memo', { memo: `%${memo}%` });
    return queryBuilder.getMany();
  }

  async getChatComplaintById(complaintId: number) {
    return await this.findOne(complaintId);
  }

  async putWorkLogExamine(manager: EntityManager, admin: Admin) {
    return await manager.getRepository(WorkLogs).createQueryBuilder('WorkLogs').insert().into(WorkLogs).values({ admin, workTypes: 2, processTypes: 1 }).execute();
  }

  async examineChatReport(manager: EntityManager, complaintId: number) {
    return await manager
      .getRepository(ChatComplaints)
      .findOne(complaintId)
      .then(chatComplaint => {
        chatComplaint.processState.processStateId = 2;
        ChatComplaints.save(chatComplaint);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('신고 접수가 제대로 되지 않았습니다. 잠시후 다시 시도해주세요.');
      });
  }

  async putWorkLogCompleteBlind(manager: EntityManager, admin: Admin) {
    return await manager.getRepository(WorkLogs).createQueryBuilder('WorkLogs').insert().into(WorkLogs).values({ admin, workTypes: 2, processTypes: 2 }).execute();
  }

  async putWorkLogCompleteSuspensionOfUse(manager: EntityManager, admin: Admin) {
    return await manager.getRepository(WorkLogs).createQueryBuilder('WorkLogs').insert().into(WorkLogs).values({ admin, workTypes: 2, processTypes: 3 }).execute();
  }

  async completeReportHandlingOfChat(manager: EntityManager, complaintId: number) {
    return await manager
      .getRepository(ChatComplaints)
      .findOne(complaintId)
      .then(chatComplaint => {
        chatComplaint.processState.processStateId = 3;
        ChatComplaints.save(chatComplaint);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('신고 검토가 제대로 되지 않았습니다. 잠시후 다시 시도해주세요.');
      });
  }

  async updateReportHandlingOfChat(complaintId: number) {
    const chatComplaint = await this.findOne(complaintId);
    if (!chatComplaint) {
      throw new NotFoundException(`complaintId가 ${complaintId}에 해당하는 데이터가 없습니다.`);
    }
    await getRepository(Chat).createQueryBuilder('Chat').update(Chat).set({ reportHandling: true }).where('chatId = :chatId', { chatId: chatComplaint.chat.chatId }).execute();
  }

  async updateBlindState(manager: EntityManager, complaintId: number) {
    const chatComplaint = await this.findOne(complaintId);
    if (!chatComplaint) {
      throw new NotFoundException(`complaintId가 ${complaintId}에 해당하는 데이터가 없습니다.`);
    }
    return await manager
      .getRepository(Chat)
      .createQueryBuilder('Chat')
      .update(Chat)
      .set({ reportHandling: true })
      .where('phoneNumber = :phoneNumber', { phoneNumber: chatComplaint.user.phoneNumber })
      .execute();
  }

  async afterCompleteReportHandlingOfChat(manager: EntityManager, complaintId: number) {
    return await manager
      .getRepository(ChatComplaints)
      .findOne(complaintId)
      .then(chatComplaint => {
        chatComplaint.processState.processStateId = 4;
        manager.save(chatComplaint);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('신고 검토 후 처리가 제대로 되지 않았습니다. 잠시후 다시 시도해주세요.');
      });
  }

  async afterCompleteReportHandlingOfChatOverThird(manager: EntityManager, complaintId: number) {
    return await manager
      .getRepository(ChatComplaints)
      .findOne(complaintId)
      .then(chatComplaint => {
        chatComplaint.processState.processStateId = 5;
        manager.save(chatComplaint);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('신고 검토 후 처리가 제대로 되지 않았습니다. 잠시후 다시 시도해주세요.');
      });
  }
}
