import { EntityManager, EntityRepository, Repository } from 'typeorm';
import { Location } from '../entities/location.entity';

@EntityRepository(Location)
export class LocationRepository extends Repository<Location> {
  async addLocation(manager: EntityManager, siDo: string, siGunGu: string, eupMyeonDong: string, phoneNumber: string) {
    await manager.createQueryBuilder().insert().into(Location).values({ user: phoneNumber, siDo, siGunGu, eupMyeonDong }).execute();
  }
}
