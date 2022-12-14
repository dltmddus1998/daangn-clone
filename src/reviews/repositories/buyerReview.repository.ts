import { EntityManager, EntityRepository, Repository } from 'typeorm';
import { ReviewDto } from '../dto/review.dto';
import { BuyerReview } from '../entities/buyerReview.entity';

@EntityRepository(BuyerReview)
export class BuyerReviewRepository extends Repository<BuyerReview> {
  async createBuyerReview(manager: EntityManager, reviewDto: ReviewDto) {
    const { post, score, review, retransaction } = reviewDto;
    const query = await manager.createQueryBuilder().insert().into(BuyerReview).values({ post, score, review, retransaction }).execute();
    return query.raw.insertId;
  }
}
