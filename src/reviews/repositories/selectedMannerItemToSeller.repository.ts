import { EntityManager, EntityRepository, Repository } from 'typeorm';
import { MannerItem } from '../entities/mannerItem.entity';
import { SelectedMannerItemToSeller } from '../entities/selectedMannerItemToSeller.entity';

@EntityRepository(SelectedMannerItemToSeller)
export class SelectedMannerItemToSellerRepository extends Repository<SelectedMannerItemToSeller> {
  async setSelectedMannerItemToSeller(manager: EntityManager, sellerReview: number, selectedMannerItems: MannerItem[]) {
    for (const mannerItem of selectedMannerItems) await manager.createQueryBuilder().insert().into(SelectedMannerItemToSeller).values({ sellerReview, mannerItem }).execute();
  }
}
