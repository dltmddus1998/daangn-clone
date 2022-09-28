import { InternalServerErrorException } from '@nestjs/common';
import { EntityManager, EntityRepository, getConnection, getRepository, Repository } from 'typeorm';
import { Location } from '../location.entity';
import { User } from '../user.entity';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async join(manager: EntityManager, marketingInfoAgree: boolean, phoneNumber: string) {
    await manager.getRepository(User).createQueryBuilder('User').insert().into(User).values({ marketingInfoAgree, phoneNumber }).execute();
  }

  async addLocation(manager: EntityManager, siDo: string, siGunGu: string, eupMyeonDong: string, phoneNumber: string) {
    await manager.getRepository(Location).createQueryBuilder('Location').insert().into(Location).values({ user: phoneNumber, siDo, siGunGu, eupMyeonDong }).execute();
  }

  async joinTransaction(marketingInfoAgree: boolean, phoneNumber: string, siDo: string, siGunGu: string, eupMyeonDong: string) {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await this.join(queryRunner.manager, marketingInfoAgree, phoneNumber);
      await this.addLocation(queryRunner.manager, siDo, siGunGu, eupMyeonDong, phoneNumber);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      throw new InternalServerErrorException('회원가입에 실패하였습니다. 잠시후 다시 시도해주세요.');
    } finally {
      await queryRunner.release();
    }
  }

  async setProfileUserName(manager: EntityManager, phoneNumber: string, userName: string) {
    await manager.getRepository(User).createQueryBuilder('User').update(User).set({ userName }).where('phoneNumber = :phoneNumber', { phoneNumber }).execute();
  }

  async setProfileImage(manager: EntityManager, phoneNumber: string, profileImage: string) {
    await manager.getRepository(User).createQueryBuilder('User').update(User).set({ profileImage }).where('phoneNumber = :phoneNumber', { phoneNumber }).execute();
  }
}
