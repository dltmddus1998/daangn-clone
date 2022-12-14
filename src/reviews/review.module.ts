import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewResolver } from './review.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerReviewRepository } from './repositories/sellerReview.repository';
import { BuyerReviewRepository } from './repositories/buyerReview.repository';
import { SelectedMannerItemToSellerRepository } from './repositories/selectedMannerItemToSeller.repository';
import { SelectedMannerItemToBuyerRepository } from './repositories/selectedMannerItemToBuyer.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SellerReviewRepository, BuyerReviewRepository, SelectedMannerItemToSellerRepository, SelectedMannerItemToBuyerRepository])],
  providers: [ReviewResolver, ReviewService],
})
export class ReviewModule {}
