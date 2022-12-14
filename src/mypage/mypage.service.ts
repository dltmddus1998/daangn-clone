import { Injectable, NotFoundException, BadRequestException, ParseBoolPipe } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Followings } from '../mypage/entities/followings.entity';
import { PurchaseHistory } from 'src/mypage/entities/purchaseHistory.entity';
import { MypageRepository } from './repositories/mypage.repository';
import { FollowDto } from './dto/follow.dto';
import { PurchaseHistoryDto } from './dto/purchaseHistory.dto';
import { Post } from 'src/posts/entities/post.entity';
import { GetOtherProfileDto } from './dto/getOtherProfile.dto';
import { PostsLikeRecord } from 'src/posts/entities/postsLikeRecord.entity';
import { ProfileType } from 'aws-sdk/clients/transfer';
import { SellerReview } from 'src/reviews/entities/sellerReview.entity';
import { BuyerReview } from 'src/reviews/entities/buyerReview.entity';
import { getRepository } from 'typeorm';

@Injectable()
export class MypageService {
  constructor(
    @InjectRepository(MypageRepository)
    private mypageRepository: MypageRepository,
  ) {}

  async getHiddenPostsList(user: User, page: number, perPage: number): Promise<Post[]> {
    /**
     * 숨김 처리한 게시글 리스트 조회하기
     *
     * @author 이승연(dltmddus1998)
     * @param {user, page, perPage} 로그인한 유저, 조회할 페이지, 한 페이지당 게시글 개수
     * @returns {Post[]} 조건에 맞는 게시글 리스트 반환
     */
    return await this.mypageRepository.getHiddenPostsList(user, page, perPage);
  }

  async buy(user: User, purchaseHistoryDto: PurchaseHistoryDto): Promise<PurchaseHistory> {
    /**
     * 특정 게시글 물건 구매 처리하기
     *
     * @author 이승연(dltmddus1998)
     * @param {user, post} 로그인한 유저, 게시글
     * @return {PurchaseHistory} 구매내역 반환
     * @throws {NotFoundException} 구매내역이 추가되지 않아 조회되지 않을 때 예외 처리
     */
    const insertId = await this.mypageRepository.buyTransaction(user, purchaseHistoryDto);
    const found = PurchaseHistory.findOne(insertId);
    if (!found) {
      throw new NotFoundException(`${insertId}의 구매내역이 제대로 추가되지 않았습니다.`);
    }
    return found;
  }
  async getBuyingListsOfUser(user: User, page: number, perPage: number): Promise<PurchaseHistory[]> {
    /**
     * 구매리스트 조회하기
     *
     * @author 이승연(dltmddus1998)
     * @param {user, page, perPage} 로그인한 유저, 조회할 페이지, 한 페이지당 게시글 개수
     * @returns {PurchaseHistory[]} 구매내역 전체 리스트 반환
     */
    return await this.mypageRepository.getBuyingListOfUser(user, page, perPage);
  }

  async getSellingListOfUser(user: User, page: number, perPage: number) {
    /**
     * TODO
     * 판매리스트 조회하기
     *
     * @author 이승연(dltmddus1998)
     * @param {user, page, perPage} 로그인한 유저, 조회할 페이지, 한 페이지당 게시글 개수
     * @returns {Post[]} 판매처리된 게시글 전체 리스트 반환
     */
    return await this.mypageRepository.getSellingListOfUser(user, page, perPage);
  }

  async getWatchListOfUser(user: User, page: number, perPage: number): Promise<PostsLikeRecord[]> {
    /**
     * 관심목록 조회하기
     *
     * @author 이승연(dltmddus1998)
     * @param {user, page, perPage} 로그인한 유저, 조회할 페이지, 한 페이지당 게시글 개수
     * @returns {PostsLikeRecord[]} 구매내역 전체 리스트 반환
     */
    return await this.mypageRepository.getWatchListOfUser(user, page, perPage);
  }

  async getUserByPhoneNumber({ phoneNumber }: { phoneNumber: string }): Promise<User> {
    return await User.findOne({ where: { phoneNumber: phoneNumber } });
  }

  async setMarketingInfoAgree(user: User, marketingInfoAgree: boolean) {
    /**
     * 마켓팅 수신 동의 여부 변경
     *
     * @author 이승연(dltmddus1998)
     * @param {user, marketingInfoAgree} 로그인한 유저, 마켓팅 동의 여부
     * @returns {User} 해당 유저 반환
     */
    await this.mypageRepository.updateMarketingInfo(user, marketingInfoAgree);
    return await this.getUserByPhoneNumber({ phoneNumber: user.phoneNumber });
  }

  async getFollowingsById(followingId: number): Promise<Followings> {
    const found = await Followings.findOne(followingId);
    if (!found) {
      throw new NotFoundException(`followingId가 ${followingId}인 것을 찾을 수 없습니다.`);
    }
    return found;
  }

  async followUsers(user: User, followDto: FollowDto): Promise<Followings> {
    /**
     * 다른 유저 팔로우하기
     *
     * @author 이승연(dltmddus1998)
     * @param {user, followerUser} 로그인한 유저, 팔로우할 유저
     * @returns {Followings} 특정 유저 팔로우 현황 반환
     * @throws {BadRequestException} 본인을 팔로우 할 수 없는 경우 & 존재하지 않는 유저를 팔로우 할 수 없는 경우에 대한 예외 처리
     * @throws {NotFoundException} followingId에 해당하는 팔로잉이 없을 때 예외 처리
     */
    const { followerUser } = followDto;
    const followerUserFind = await User.findOne({ where: { phoneNumber: followerUser } });

    if (followerUser.toString() === user.phoneNumber) {
      throw new BadRequestException(`본인을 팔로우할 수 없습니다.`);
    } else if (!followerUserFind) {
      throw new BadRequestException(`존재하지 않는 유저입니다.`);
    } else {
      const insertId = await this.mypageRepository.followUsers(user, followerUser);
      const found = await Followings.findOne(insertId);
      if (!found) {
        throw new NotFoundException(`${insertId}에 해당하는 팔로우 기록이 없습니다.`);
      } else {
        return await this.getFollowingsById(insertId);
      }
    }
  }

  async deleteFollowUsers(user: User, followingId: number): Promise<String> {
    /**
     * 팔로우 취소하기
     *
     * @author 이승연(dltmddus1998)
     * @param {user, followerUser} 로그인한 유저, 팔로우 번호 (팔로우 테이블에서)
     * @returns {String} '삭제되었습니다' 반환
     * @throws {BadRequestException} 본인이 아닌 경우 예외 처리
     * @throws {NotFoundException} followingId에 해당하는 팔로잉이 없을 때 예외 처리
     */
    const following = await this.getFollowingsById(followingId);
    if (JSON.stringify(following.followingUser) !== JSON.stringify(user)) {
      throw new BadRequestException(`본인의 경우에만 팔로우를 취소할 수 있습니다.`);
    }
    const result = await this.mypageRepository.deleteFollowUsers(followingId);
    if (result.affected === 0) {
      throw new NotFoundException(`followingId가 ${followingId}인 것을 찾을 수 없습니다.`);
    }
    return '삭제되었습니다.';
  }

  async seeFollowUsers(user: User, page: number, perPage: number): Promise<Followings[]> {
    /**
     * 팔로잉 모아보기
     *
     * @author 이승연(dltmddus1998)
     * @param {page, perPage} 조회할 페이지, 한 페이지당 게시글 개수
     * @returns {Followings[]} 팔로우 리스트 전체 반환
     */
    return await this.mypageRepository.seeFollowUsers(user, page, perPage);
  }

  async getMyProfile(user: User): Promise<User> {
    /**
     * 내 프로필 조회하기
     *
     * @author 이승연(dltmddus1998)
     * @param {user}
     * @returns {userName, profileImage, mannerTemp, respTime}
     */
    const userInfo = await this.mypageRepository.getMyProfileFromUser(user);
    return userInfo;
  }

  async getMySellerReview(user: User): Promise<SellerReview[]> {
    /**
     * 내 프로필 조회 - 판매자 거래 후기 및 매너 평가 조회
     *
     * @author 이승연(dltmddus1998)
     * @param {user}
     * @return {SellerReview[]}
     *
     */
    const sellerReviews = await this.mypageRepository.getMySellerReviewList(user);
    return sellerReviews;
  }

  async getMyBuyerReview(user: User): Promise<BuyerReview[]> {
    /**
     * 내 프로필 조회 - 구매자 거래 후기 및 매너 평가 조회
     *
     * @author 이승연(dltmddus1998)
     * @param {user}
     * @return {BuyerReivew[]}
     *
     */
    const buyerReviews = await this.mypageRepository.getMyBuyerReviewList(user);
    return buyerReviews;
  }

  async getOtherProfile(userName: string): Promise<User> {
    /**
     * 다른 유저 프로필 조회하기
     *
     * @author 이승연(dltmddus1998)
     * @param {getOtherProfileDto} 팔로우하고자 하는 유저 번호
     * @returns {userName, profileImage, mannerTemp, respTime}
     */
    const otherProfileFromUser = await this.mypageRepository.getOtherProfileFromUser(userName);
    return otherProfileFromUser;
  }

  async getOtherSellerReview(userName: string): Promise<SellerReview[]> {
    /**
     * 다른 유저 프로필 조회 - 판매자 거래 후기 및 매너 평가 조회
     *
     * @author 이승연(dltmddus1998)
     * @param {userName}
     * @return {SellerReivew[]}
     */
    const sellerReviews = await this.mypageRepository.getOtherSellerReviewList(userName);
    return sellerReviews;
  }

  async getOtherBuyerReview(userName: string): Promise<BuyerReview[]> {
    /**
     * 다른 유저 프로필 조회 - 구매자 거래 후기 및 매너 평가 조회
     *
     * @author 이승연(dltmddus1998)
     * @param {userName}
     * @return {BuyerReview[]}
     *
     */
    const buyerReviews = await this.mypageRepository.getOtherBuyerReviewList(userName);
    return buyerReviews;
  }
}
