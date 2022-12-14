import { EntityManager, EntityRepository, Repository } from 'typeorm';
import { ReviewDto } from '../dto/review.dto';
import { SellerReview } from '../entities/sellerReview.entity';

@EntityRepository(SellerReview)
export class SellerReviewRepository extends Repository<SellerReview> {
  async createSellerReview(manager: EntityManager, reviewDto: ReviewDto) {
    const { post, score, review, retransaction } = reviewDto;
    const query = await manager.createQueryBuilder().insert().into(SellerReview).values({ post, score, review, retransaction }).execute();
    return query.raw.insertId;
  }
}
