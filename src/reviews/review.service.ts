import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PurchaseHistory } from 'src/mypage/entities/purchaseHistory.entity';
import { User } from 'src/users/entities/user.entity';
import { EntityManager, getConnection, getRepository } from 'typeorm';
import { ReviewDto } from './dto/review.dto';
import { BuyerReview } from './entities/buyerReview.entity';
import { MannerItem } from './entities/mannerItem.entity';
import { ScoreItem } from './entities/scoreItem.entity';
import { SelectedMannerItemToBuyer } from './entities/selectedMannerItemToBuyer.entity';
import { SelectedMannerItemToSeller } from './entities/selectedMannerItemToSeller.entity';
import { SellerReview } from './entities/sellerReview.entity';
import { BuyerReviewRepository } from './repositories/buyerReview.repository';
import { SelectedMannerItemToBuyerRepository } from './repositories/selectedMannerItemToBuyer.repository';
import { SelectedMannerItemToSellerRepository } from './repositories/selectedMannerItemToSeller.repository';
import { SellerReviewRepository } from './repositories/sellerReview.repository';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(SellerReviewRepository)
    private sellerReviewRepository: SellerReviewRepository,
    @InjectRepository(BuyerReviewRepository)
    private buyerReviewRepository: BuyerReviewRepository,
    @InjectRepository(SelectedMannerItemToSellerRepository)
    private selectedMannerItemToSellerRepository: SelectedMannerItemToSellerRepository,
    @InjectRepository(SelectedMannerItemToBuyerRepository)
    private selectedMannerItemToBuyerRepository: SelectedMannerItemToBuyerRepository,
  ) {}

  async getScoreItemData(): Promise<ScoreItem[]> {
    /**
     * 거래후기 작성 항목 중 ScoreItem(전체적인 거래 후기)에 대한 static data 조회
     *
     * @author 허정연(golgol22)
     * @return {ScoreItem[]} 전체적인 거래 후기 항목 목록 반환
     */
    return await getRepository(ScoreItem).find();
  }

  async getMannerItemData(): Promise<MannerItem[]> {
    /**
     * 거래후기 작성 항목 중 mannerItem(각가의 매너 항목)에 대한 static data 조회
     *
     * @author 허정연(golgol22)
     * @return {MannerItem[]} 매너항목 목록 반환
     */
    return await getRepository(MannerItem).find();
  }

  private async getSellerReviewById(sellerReviewId: number) {
    /**
     * 판매자에 대한 거래후기 조회
     *
     * @author 허정연(golgol22)
     * @param {sellerReviewId} 판매자 거래후기 ID
     * @return {SellerReview} 판매자에 대한 리뷰 반환
     */
    return await this.sellerReviewRepository.findOne(sellerReviewId);
  }

  async getBuyerReviewById(buyerReviewId: number): Promise<BuyerReview> {
    /**
     * 구매자에 대한 거래후기 조회
     *
     * @author 허정연(golgol22)
     * @param {buyerReviewId} 구매자 거래후기 ID
     * @return {BuyerReview} 구매자에 대한 리뷰 반환
     */
    return await this.buyerReviewRepository.findOne(buyerReviewId);
  }

  private async mannerTempCal(manager: EntityManager, user: User, score: number, selectedMannerItems: any[]) {
    /**
     * 리뷰에 따른 매너 온도 계산
     *
     * @author 허정연(golgol22)
     * @param {manager, user, score, selectedMannerItems} 트랜잭션 매니저, 매너 온도 변경해야 하는 유저, 매너 온도+/-, 선택된  매너 항목
     * @return {user} 리뷰 온도 변경된 유저 반환
     */
    if (score === 1 || score === 2) {
      user.mannerTemp = user.mannerTemp * 1 + 0.1 * selectedMannerItems.length;
    } else {
      user.mannerTemp = user.mannerTemp * 1 - 0.1 * selectedMannerItems.length;
    }
    await manager.save(user);
    return user;
  }

  async createSellerReview(user: User, reviewDto: ReviewDto): Promise<SellerReview> {
    /**
     * 판매자에 대한 거래후기 작성 (구매자가 작성)
     *
     * @author 허정연(golgol22)
     * @param {user, post, score, selectedMannerItems, review, retransaction}
     *        로그인한 유저, 작성한 리뷰의 게시글 ID, 전체적인 평가, 선택된 매너항목들, 후기, 재거래 희망 여부
     * @return {SellerReview} 판매자에 대한 리뷰 반환
     * @throws {NotFoundException} 구매자 정보가 등록되지 않은 게시글일 때 예외처리
     * @throws {ForbiddenException} 구매하지 않은 유저가 리뷰작성을 요청할 때 예외처리
     * @throws {BadRequestException} 이미 리뷰를 작성하였을 때 예외처리
     * @throws {InternalServerErrorException} 거래 후기 저장 실패할 때 예외처리
     */
    const { post, score, selectedMannerItems } = reviewDto;
    const purchase = await getRepository(PurchaseHistory).findOne({ where: { post } });
    if (!purchase) {
      throw new NotFoundException('아직 구매되지 않은 게시글입니다.');
    }
    if (JSON.stringify(purchase.user) !== JSON.stringify(user)) {
      throw new ForbiddenException('본인이 거래한 게시글에 대한 거래후기만 쓸 수 있습니다.');
    }
    const review = await this.sellerReviewRepository.findOne({ where: { post } });
    if (review) {
      throw new BadRequestException('이미 리뷰를 작성하였습니다.');
    }
    let insertId = -1;
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        insertId = await this.sellerReviewRepository.createSellerReview(manager, reviewDto);
        await this.selectedMannerItemToSellerRepository.setSelectedMannerItemToSeller(manager, insertId, selectedMannerItems);
        await this.mannerTempCal(manager, purchase.post.user, score.scoreItemId, selectedMannerItems);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('판매자에 대한 거래 후기 작성에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return await this.getSellerReviewById(insertId);
  }

  async createBuyerReview(user: User, reviewDto: ReviewDto): Promise<BuyerReview> {
    /**
     * 구매자에 대한 거래후기 작성 (판매자가 작성)
     *
     * @author 허정연(golgol22)
     * @param {user, post, score, selectedMannerItems, review, retransaction}
     *        로그인한 유저, 작성한 리뷰의 게시글 ID, 전체적인 평가, 선택된 매너항목들, 후기, 재거래 희망 여부
     * @return {SellerReview} 판매자에 대한 리뷰 반환
     * @throws {NotFoundException} 구매자 정보가 등록되지 않은 게시글일 때 예외처리
     * @throws {ForbiddenException} 구매하지 않은 유저가 리뷰작성을 요청할 때 예외처리
     * @throws {BadRequestException} 이미 리뷰를 작성하였을 때 예외처리
     * @throws {InternalServerErrorException} 거래 후기 저장 실패할 때 예외처리
     */
    const { post, score, selectedMannerItems } = reviewDto;
    const purchase = await getRepository(PurchaseHistory).findOne({ where: { post } });
    if (!purchase) {
      throw new NotFoundException('아직 구매되지 않은 게시글입니다.');
    }
    if (JSON.stringify(purchase.post.user) !== JSON.stringify(user)) {
      throw new ForbiddenException('본인이 거래한 게시글에 대한 거래후기만 쓸 수 있습니다.');
    }
    const review = await this.buyerReviewRepository.findOne({ where: { post } });
    if (review) {
      throw new BadRequestException('이미 리뷰를 작성하였습니다.');
    }
    let insertId = -1;
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        insertId = await this.buyerReviewRepository.createBuyerReview(manager, reviewDto);
        await this.selectedMannerItemToBuyerRepository.setSelectedMannerItemToBuyer(manager, insertId, selectedMannerItems);
        await this.mannerTempCal(manager, purchase.user, score.scoreItemId, selectedMannerItems);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('구매자에 대한 거래 후기 작성에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return await this.getBuyerReviewById(insertId);
  }

  async updateSellerReview(user: User, reviewDto: ReviewDto): Promise<SellerReview> {
    /**
     * 판매자에 대한 거래후기 수정 (구매자가 수정)
     *
     * @author 허정연(golgol22)
     * @param {user, post, score, selectedMannerItems, review, retransaction}
     *        로그인한 유저, 작성한 리뷰의 게시글 ID, 전체적인 평가, 선택된 매너항목들, 후기, 재거래 희망 여부
     * @return {SellerReview} 판매자에 대한 리뷰 반환
     * @throws {NotFoundException} 구매자 정보가 등록되지 않은 게시글일 때 예외처리
     * @throws {ForbiddenException} 로그인한 유저가 작성한 거래 후기가 아닐 때 예외처리
     * @throws {BadRequestException} 작성된 리뷰가 없을 때 예외처리
     * @throws {InternalServerErrorException} 거래 후기 수정 실패할 때 예외처리
     */
    const { post, score, selectedMannerItems, review, retransaction } = reviewDto;
    const purchase = await getRepository(PurchaseHistory).findOne({ where: { post } });
    if (!purchase) {
      throw new NotFoundException('아직 구매되지 않은 게시글입니다.');
    }
    if (JSON.stringify(purchase.user) !== JSON.stringify(user)) {
      throw new ForbiddenException('본인이 작성한 거래후기만 수정할 수 있습니다.');
    }
    const sellerReview = await this.sellerReviewRepository.findOne({ where: { post } });
    if (!sellerReview) {
      throw new NotFoundException('작성된 거래후기가 없습니다.');
    }
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        const userMannerTempReset = await this.mannerTempCal(manager, purchase.post.user, sellerReview.score.scoreItemId === 3 ? 1 : 3, sellerReview.selectedMannerItems);
        sellerReview.score = score;
        sellerReview.review = review;
        sellerReview.retransaction = retransaction;
        await manager.save(sellerReview);
        await manager.delete(SelectedMannerItemToSeller, { sellerReview: sellerReview.sellerReviewId });
        await this.selectedMannerItemToSellerRepository.setSelectedMannerItemToSeller(manager, sellerReview.sellerReviewId, selectedMannerItems);
        await this.mannerTempCal(manager, userMannerTempReset, score.scoreItemId, selectedMannerItems);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('거래 후기 수정에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return await this.getSellerReviewById(sellerReview.sellerReviewId);
  }

  async updateBuyerReview(user: User, reviewDto: ReviewDto): Promise<BuyerReview> {
    /**
     * 구매자에 대한 거래후기 수정 (판매자가 수정)
     *
     * @author 허정연(golgol22)
     * @param {user, post, score, selectedMannerItems, review, retransaction}
     *        로그인한 유저, 작성한 리뷰의 게시글 ID, 전체적인 평가, 선택된 매너항목들, 후기, 재거래 희망 여부
     * @return {SellerReview} 판매자에 대한 리뷰 반환
     * @throws {NotFoundException} 구매자 정보가 등록되지 않은 게시글일 때 예외처리
     * @throws {ForbiddenException} 로그인한 유저가 작성한 거래 후기가 아닐 때 예외처리
     * @throws {BadRequestException} 작성된 리뷰가 없을 때 예외처리
     * @throws {InternalServerErrorException} 거래 후기 수정 실패할 때 예외처리
     */
    const { post, score, selectedMannerItems, review, retransaction } = reviewDto;
    const purchase = await getRepository(PurchaseHistory).findOne({ where: { post } });
    if (!purchase) {
      throw new NotFoundException('아직 구매되지 않은 게시글입니다.');
    }
    if (JSON.stringify(purchase.post.user) !== JSON.stringify(user)) {
      throw new ForbiddenException('본인이 작성한 거래후기만 수정할 수 있습니다.');
    }
    const buyerReview = await this.buyerReviewRepository.findOne({ where: { post } });
    if (!buyerReview) {
      throw new NotFoundException('작성된 거래후기가 없습니다.');
    }
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        const userMannerTempReset = await this.mannerTempCal(manager, purchase.post.user, buyerReview.score.scoreItemId === 3 ? 1 : 3, buyerReview.selectedMannerItems);
        buyerReview.score = score;
        buyerReview.review = review;
        buyerReview.retransaction = retransaction;
        await manager.save(buyerReview);
        await manager.delete(SelectedMannerItemToBuyer, { buyerReview: buyerReview.buyerReviewId });
        await this.selectedMannerItemToBuyerRepository.setSelectedMannerItemToBuyer(manager, buyerReview.buyerReviewId, selectedMannerItems);
        await this.mannerTempCal(manager, userMannerTempReset, score.scoreItemId, selectedMannerItems);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('거래 후기 수정에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return await this.getBuyerReviewById(buyerReview.buyerReviewId);
  }

  async deleteSellerReview(user: User, post: number): Promise<string> {
    /**
     * 판매자에 대한 거래후기 삭제 (구매자가 삭제)
     * 선택된 매너 항목은 거래 후기가 삭제되면 자동으로 삭제 (Cascade)
     *
     * @author 허정연(golgol22)
     * @param {user, post} 로그인한 유저, 삭제할 리뷰를 적은 게시글 ID
     * @return {string} 거래후기가 삭제되었습니다 반환
     * @throws {NotFoundException} 구매자 정보가 등록되지 않은 게시글일 때 예외처리
     * @throws {ForbiddenException} 로그인한 유저가 작성한 거래 후기가 아닐 때 예외처리
     * @throws {NotFoundException} 작성된 거래후기가 없을 때 예외처리
     * @throws {InternalServerErrorException} 거래 후기 수정 실패할 때 예외처리
     */
    const purchase = await getRepository(PurchaseHistory).findOne({ where: { post } });
    if (!purchase) {
      throw new NotFoundException('아직 구매되지 않은 게시글입니다.');
    }
    if (JSON.stringify(purchase.user) !== JSON.stringify(user)) {
      throw new ForbiddenException('본인이 작성한 거래후기만 수정할 수 있습니다.');
    }
    const sellerReview = await this.sellerReviewRepository.findOne({ where: { post } });
    if (!sellerReview) {
      throw new NotFoundException('작성된 거래후기가 없습니다.');
    }
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        await this.mannerTempCal(manager, purchase.post.user, sellerReview.score.scoreItemId === 3 ? 1 : 3, sellerReview.selectedMannerItems);
        await manager.delete(SellerReview, { post });
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('거래 후기 삭제에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return '거래후기가 삭제되었습니다';
  }

  async deleteBuyerReview(user: User, post: number): Promise<string> {
    /**
     * 구매자에 대한 거래후기 삭제 (판매자가 삭제)
     * 선택된 매너 항목은 거래후기가 삭제되면 자동으로 삭제 (Cascade)
     *
     * @author 허정연(golgol22)
     * @param {user, post} 로그인한 유저, 삭제할 리뷰를 적은 게시글 ID
     * @return {string} 거래후기가 삭제되었습니다 반환
     * @throws {NotFoundException} 구매자 정보가 등록되지 않은 게시글일 때 예외처리
     * @throws {ForbiddenException} 로그인한 유저가 작성한 거래 후기가 아닐 때 예외처리
     * @throws {NotFoundException} 작성된 거래후기가 없을 때 예외처리
     * @throws {InternalServerErrorException} 거래 후기 수정 실패할 때 예외처리
     */
    const purchase = await getRepository(PurchaseHistory).findOne({ where: { post } });
    if (!purchase) {
      throw new NotFoundException('아직 구매되지 않은 게시글입니다.');
    }
    if (JSON.stringify(purchase.post.user) !== JSON.stringify(user)) {
      throw new ForbiddenException('본인이 작성한 거래후기만 수정할 수 있습니다.');
    }
    const buyerReview = await this.buyerReviewRepository.findOne({ where: { post } });
    if (!buyerReview) {
      throw new NotFoundException('작성된 거래후기가 없습니다.');
    }
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        await this.mannerTempCal(manager, purchase.post.user, buyerReview.score.scoreItemId === 3 ? 1 : 3, buyerReview.selectedMannerItems);
        await manager.delete(BuyerReview, { post });
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('거래 후기 삭제에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return '거래후기가 삭제되었습니다';
  }
}
