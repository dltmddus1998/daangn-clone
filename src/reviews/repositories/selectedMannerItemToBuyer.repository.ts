import { EntityManager, EntityRepository, Repository } from 'typeorm';
import { MannerItem } from '../entities/mannerItem.entity';
import { SelectedMannerItemToBuyer } from '../entities/selectedMannerItemToBuyer.entity';

@EntityRepository(SelectedMannerItemToBuyer)
export class SelectedMannerItemToBuyerRepository extends Repository<SelectedMannerItemToBuyer> {
  async setSelectedMannerItemToBuyer(manager: EntityManager, buyerReview: number, selectedMannerItems: MannerItem[]) {
    for (const mannerItem of selectedMannerItems) await manager.createQueryBuilder().insert().into(SelectedMannerItemToBuyer).values({ buyerReview, mannerItem }).execute();
  }
}
