import { Admin } from 'src/admins/entities/admin.entity';
import { WorkLogs } from 'src/admins/entities/workLogs.entity';
import { EntityRepository, Repository, getRepository, EntityManager } from 'typeorm';
import { SearchComplaintDto } from 'src/admins/dto/searchComplaint.dto';
import { UserComplaints } from '../entities/userComplaints.entity';
import { User } from 'src/users/entities/user.entity';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

@EntityRepository(UserComplaints)
export class UserComplaintsRepository extends Repository<UserComplaints> {
  getUserComplaints(searchComplaintDto: SearchComplaintDto) {
    const { complaintReason, processState, memo, perPage, page } = searchComplaintDto;
    const queryBuilder = this.createQueryBuilder('userComplaints')
      .innerJoinAndSelect('userComplaints.complaintUser', 'complaintUser')
      .innerJoinAndSelect('userComplaints.subjectUser', 'subjectUser')
      .innerJoinAndSelect('userComplaints.complaintReason', 'complaintReason')
      .innerJoinAndSelect('userComplaints.processState', 'processState')
      .orderBy('userComplaints.createdAt', 'DESC')
      .offset((page - 1) * perPage)
      .limit(perPage);
    if (complaintReason) queryBuilder.andWhere('complaintReason.complaintReasonId = :complaintReason', { complaintReason });
    if (processState) queryBuilder.andWhere('processState.processStateId = :processState', { processState });
    if (memo) queryBuilder.andWhere('memo like :memo', { memo: `%${memo}%` });
    return queryBuilder.getMany();
  }

  async getUserComplaintById(complaintId: number) {
    return await getRepository(UserComplaints).findOne(complaintId);
  }

  async putWorkLogExamine(manager: EntityManager, admin: Admin) {
    return await manager.getRepository(WorkLogs).createQueryBuilder('WorkLogs').insert().into(WorkLogs).values({ admin, workTypes: 1, processTypes: 1 }).execute();
  }

  async examineUserReport(manager: EntityManager, complaintId: number) {
    return await manager
      .getRepository(UserComplaints)
      .findOne(complaintId)
      .then(userComplaint => {
        userComplaint.processState.processStateId = 2;
        manager.save(userComplaint);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('신고 접수 다음 단계로 넘어가지 않았습니다. 잠시후 다시 시도해주세요.');
      });
  }

  async putWorkLogCompleteBlind(manager: EntityManager, admin: Admin) {
    return await manager.getRepository(WorkLogs).createQueryBuilder('WorkLogs').insert().into(WorkLogs).values({ admin, workTypes: 1, processTypes: 2 }).execute();
  }

  async putWorkLogCompleteSuspensionOfUse(manager: EntityManager, admin: Admin) {
    return await manager.getRepository(WorkLogs).createQueryBuilder('WorkLogs').insert().into(WorkLogs).values({ admin, workTypes: 1, processTypes: 3 }).execute();
  }

  async completeReportHandlingOfUser(manager: EntityManager, complaintId: number) {
    return await manager
      .getRepository(UserComplaints)
      .findOne(complaintId)
      .then(userComplaint => {
        userComplaint.processState.processStateId = 3;
        manager.save(userComplaint);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('신고 검토가 제대로 되지 않았습니다. 잠시후 다시 시도해주세요.');
      });
  }

  async declineMannerTemp(manager: EntityManager, userName: String) {
    return await manager
      .getRepository(User)
      .findOne({
        where: {
          userName,
        },
      })
      .then(user => {
        if (user.mannerTemp > 0) {
          user.mannerTemp -= 0.1;
          manager.save(user);
        }
      });
  }

  async updateBlindState(manager: EntityManager, complaintId: number) {
    const userComplaint = await this.findOne(complaintId);
    if (!userComplaint) {
      throw new NotFoundException(`complaintId가 ${complaintId}에 해당하는 데이터가 없습니다.`);
    }
    return await manager
      .getRepository(User)
      .createQueryBuilder('User')
      .update(User)
      .set({ reportHandling: true })
      .where('phoneNumber = :phoneNumber', { phoneNumber: userComplaint.subjectUser.phoneNumber })
      .execute();
  }

  async afterCompleteReportHandlingOfUser(manager: EntityManager, complaintId: number) {
    return await manager
      .getRepository(UserComplaints)
      .findOne(complaintId)
      .then(userComplaint => {
        userComplaint.processState.processStateId = 4;
        manager.save(userComplaint);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('신고 검토 후 처리가 제대로 되지 않았습니다. 잠시후 다시 시도해주세요.');
      });
  }

  async afterCompleteHandlingOfUserOverThird(manager: EntityManager, complaintId: number) {
    return await manager
      .getRepository(UserComplaints)
      .findOne(complaintId)
      .then(userComplaint => {
        userComplaint.processState.processStateId = 5;
        manager.save(userComplaint);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('신고 검토 후 처리가 제대로 되지 않았습니다. 잠시후 다시 시도해주세요.');
      });
  }

  async updateUserReportedTimes(manager: EntityManager, phoneNumber: string) {
    const user = await manager.getRepository(User).findOne(phoneNumber);
    if (!user) {
      throw new NotFoundException('해당 유저는 존재하지 않습니다.');
    }
    if (user.reportedTimes < 4) {
      user.reportedTimes += 1;
      await manager.save(user);
    }
  }

  async updateUserSuspensionOfUse(manager: EntityManager, phoneNumber: string) {
    const user = await manager.getRepository(User).findOne(phoneNumber);
    if (!user) {
      throw new NotFoundException('해당 유저는 존재하지 않습니다.');
    }
    if (user.suspensionOfUse === true) {
      throw new BadRequestException('이미 이용정지된 유저입니다.');
    }
    user.suspensionOfUse = true;
    await manager.save(user);
  }

  async getUsersInSuspensionOfUse(page: number, perPage: number) {
    return await getRepository(User)
      .createQueryBuilder('user')
      .select()
      .where('suspensionOfUse = :suspensionOfUse', { suspensionOfUse: true })
      .orderBy('user.createdAt', 'DESC')
      .offset((page - 1) * perPage)
      .limit(perPage)
      .getMany();
  }

  async clearSuspenseOfUse(userName: string) {
    const user = await getRepository(User).findOne({
      where: {
        userName,
      },
    });
    if (!user) {
      throw new NotFoundException('해당 유저는 존재하지 않습니다.');
    }
    if (user.suspensionOfUse === false) {
      throw new BadRequestException('이용정지 처리된 유저가 아닙니다.');
    }
    user.suspensionOfUse = false;
    User.save(user);
  }
}
