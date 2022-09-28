import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { EntityRepository, getRepository, Repository, EntityManager } from 'typeorm';
import { User } from 'src/users/user.entity';
import { UserComplaints } from 'src/chats/userComplaints.entity';

@EntityRepository(UserComplaints)
export class UserComplaintsRepository extends Repository<UserComplaints> {
  async getUserComplaintById(complaintId: number) {
    const found = await this.findOne(complaintId);
    return found;
  }

  async examineUserReport(complaintId: number) {
    return await getRepository(UserComplaints)
      .findOne(complaintId)
      .then(userComplaint => {
        userComplaint.processState.processStateId = 2;
        userComplaint.save();
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('신고 접수 다음 단계로 넘어가지 않았습니다. 잠시후 다시 시도해주세요.');
      });
  }

  async completeReportHandlingOfUser(complaintId: number) {
    return await getRepository(UserComplaints)
      .findOne(complaintId)
      .then(userComplaint => {
        userComplaint.processState.processStateId = 3;
        userComplaint.save();
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
        user.mannerTemp -= 0.1;
        user.save();
      });
  }

  async updateBlockStateOfUser(complaintId: number) {
    const userComplaint = await getRepository(UserComplaints).findOne(complaintId);
    if (!userComplaint) {
      throw new NotFoundException(`complaintId가 ${complaintId}에 해당하는 데이터가 없습니다.`);
    }
    return await getRepository(User)
      .createQueryBuilder('User')
      .update(User)
      .set({ reportHandling: true })
      .where('phoneNumber = :phoneNumber', { phoneNumber: userComplaint.complaintUser.phoneNumber })
      .execute();
  }

  async afterCompleteReportHandlingOfUser(complaintId: number) {
    return await getRepository(UserComplaints)
      .findOne(complaintId)
      .then(userComplaint => {
        userComplaint.processState.processStateId = 4;
        userComplaint.save();
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('신고 검토 후 처리가 제대로 되지 않았습니다. 잠시후 다시 시도해주세요.');
      });
  }

  async updateUserReportedTimes(phoneNumber: string) {
    const user = await getRepository(User).findOne(phoneNumber);
    user.reportedTimes += 1;
    user.save();
  }

  async updateUserBlockState(phoneNumber: string) {
    const user = await getRepository(User).findOne(phoneNumber);
    if (!user) {
      throw new NotFoundException('해당 유저는 존재하지 않습니다.');
    }
    /**
     * TODO - 유저 이용정지 처리
     */
  }
}
