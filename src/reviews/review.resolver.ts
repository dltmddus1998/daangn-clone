import { ParseIntPipe, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from 'src/users/guards/jwtAuth.guard';
import { User } from 'src/users/entities/user.entity';
import { GetUser } from 'src/users/validations/getUser.decorator';
import { ReviewDto } from './dto/review.dto';
import { BuyerReview } from './entities/buyerReview.entity';
import { MannerItem } from './entities/mannerItem.entity';
import { ScoreItem } from './entities/scoreItem.entity';
import { SellerReview } from './entities/sellerReview.entity';
import { ReviewInputValidationPipe } from './pipes/review.pipe';
import { ReviewService } from './review.service';

@Resolver()
@UseGuards(JwtAuthGuard)
export class ReviewResolver {
  constructor(private readonly reviewService: ReviewService) {}

  // scoreItem 데이터 조회
  @Query(() => [ScoreItem])
  getScoreItemData(): Promise<ScoreItem[]> {
    return this.reviewService.getScoreItemData();
  }

  // mannerItem 데이터 조회
  @Query(() => [MannerItem])
  getMannerItemData(): Promise<MannerItem[]> {
    return this.reviewService.getMannerItemData();
  }

  // 판매자에 대한 거래후기 생성
  @Mutation(() => SellerReview)
  @UsePipes(ValidationPipe)
  createSellerReview(@GetUser() user: User, @Args('reviewDto', ReviewInputValidationPipe) reviewDto: ReviewDto): Promise<SellerReview> {
    return this.reviewService.createSellerReview(user, reviewDto);
  }

  // 구매자에 대한 거래후기 생성
  @Mutation(() => BuyerReview)
  @UsePipes(ValidationPipe)
  createBuyerReview(@GetUser() user: User, @Args('reviewDto', ReviewInputValidationPipe) reviewDto: ReviewDto): Promise<BuyerReview> {
    return this.reviewService.createBuyerReview(user, reviewDto);
  }

  // 판매자에 대한 거래후기 수정
  @Mutation(() => SellerReview)
  @UsePipes(ValidationPipe)
  updateSellerReview(@GetUser() user: User, @Args('reviewDto', ReviewInputValidationPipe) reviewDto: ReviewDto): Promise<SellerReview> {
    return this.reviewService.updateSellerReview(user, reviewDto);
  }

  // 구매자에 대한 거래후기 수정
  @Mutation(() => BuyerReview)
  @UsePipes(ValidationPipe)
  updateBuyerReview(@GetUser() user: User, @Args('reviewDto', ReviewInputValidationPipe) reviewDto: ReviewDto): Promise<BuyerReview> {
    return this.reviewService.updateBuyerReview(user, reviewDto);
  }

  // 판매자에 대한 거래후기 삭제
  @Mutation(() => String)
  @UsePipes(ValidationPipe)
  deleteSellerReview(@GetUser() user: User, @Args('post', ParseIntPipe) post: number): Promise<string> {
    return this.reviewService.deleteSellerReview(user, post);
  }

  // 구매자에 대한 거래후기 삭제
  @Mutation(() => String)
  @UsePipes(ValidationPipe)
  deleteBuyerReview(@GetUser() user: User, @Args('post', ParseIntPipe) post: number): Promise<string> {
    return this.reviewService.deleteBuyerReview(user, post);
  }
}
