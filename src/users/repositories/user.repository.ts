import { EntityManager, EntityRepository, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async join(manager: EntityManager, marketingInfoAgree: boolean, phoneNumber: string) {
    await manager.createQueryBuilder().insert().into(User).values({ marketingInfoAgree, phoneNumber }).execute();
  }

  async setProfileUserName(manager: EntityManager, phoneNumber: string, userName: string) {
    await manager.createQueryBuilder().update(User).set({ userName }).where('phoneNumber = :phoneNumber', { phoneNumber }).execute();
  }

  async setProfileImage(manager: EntityManager, phoneNumber: string, profileImage: string) {
    await manager.createQueryBuilder().update(User).set({ profileImage }).where('phoneNumber = :phoneNumber', { phoneNumber }).execute();
  }
}
