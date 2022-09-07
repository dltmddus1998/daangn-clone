import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { CreatePostDto } from './dto/createPost.dto';
import { SearchPostDto } from './dto/searchPost.dto';
import { UpdatePostDto } from './dto/updatePost.dto';
import { OfferPriceDto } from './dto/offerPrice.dto';
import { AcceptOfferedPriceDto } from './dto/acceptOfferedPrice.dto';
import { CreatePostsComplaintsDto } from './dto/createPostsComplaints.dto';
import { Post } from './post.entity';
import { PriceOffer } from './priceOffer.entity';
import { PostRepository } from './post.repository';
import { ComplaintReason } from 'src/complaintReasons/complaintReason.entity';
import { ProcessState } from 'src/processStates/processState.entity';
import { PostsComplaint } from './postsComplaint.entity';
import { DealState } from 'src/dealStates/dealState.entity';
import { UpdateDealStateDto } from './dto/updateDealState.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostRepository)
    private postRepository: PostRepository,
  ) {}

  async createPost(createPostDto: CreatePostDto): Promise<Post> {
    const insertId = await this.postRepository.createPost(createPostDto);
    return await this.getPostById(insertId);
  }

  async updatePost(postId: number, updatePostDto: UpdatePostDto): Promise<Post> {
    await this.getPostById(postId);
    await this.postRepository.updatePost(postId, updatePostDto);
    return await this.getPostById(postId);
  }

  async deletePost(postId: number): Promise<string> {
    const result = await this.postRepository.delete(postId);
    if (result.affected === 0) {
      throw new NotFoundException(`postId가 ${postId}인 것을 찾을 수 없습니다.`);
    }
    return '삭제되었습니다.';
  }

  async getPostById(postId: number): Promise<Post> {
    const found = await this.postRepository.findOne(postId);
    if (!found) {
      throw new NotFoundException(`postId가 ${postId}인 것을 찾을 수 없습니다.`);
    }
    return found;
  }

  async getPosts(searchPostDto: SearchPostDto): Promise<Post[]> {
    return this.postRepository.getPosts(searchPostDto);
  }

  async pullUpPost(postId: number) {
    /**
     * @ 코드작성자: 이승연
     * @ 기능: 게시글 끌어올리기
     * @ 1️⃣ POST 테이블을 기본적으로 updatedAt을 기준으로 (default: now() === createdAt) 정렬한다. -> 전체 조회 중 해당 사항 처리예정 (✔︎)
     * @ 2️⃣ POST 테이블에서 끌어올리고자 하는 게시글의 updatedAt을 현재 날짜로 수정한다. ()
     */
    /**
     * 1. postId로 해당 게시물 먼저 찾기
     * 2. 게시물 찾은 후 updatedAt을 현재날짜로 수정하기
     */
    const found = await this.postRepository.findOne(postId);

    if (!found) {
      throw new NotFoundException(`postId가 ${postId}인 것을 찾을 수 없습니다.`);
    }

    this.postRepository.changePulled(postId);

    return this.getPostById(postId);
  }

  async offerPrice(offerPriceDto: OfferPriceDto): Promise<PriceOffer> {
    /**
     * @ 코드작성자: 이승연
     * @ 기능: 가격 제시
     * @ 부가 설명: 구매 희망자 -> 판매자 가격 제시
     * @ 1️⃣ 가격 제안 요청 to 판매자 (제안하고자 하는 가격, 판매자 PUT) ()
     * @ 2️⃣ 판매자에게 가격 제안 알림 기능 ()
     * @ 🅰️ 수락시 - isOfferedPrice = true & price = offeredPrice로 재할당 ()
     * @ 🅱️ 거절시 - nothing ()
     */

    const priceOfferedId = await this.postRepository.requestPriceToSeller(offerPriceDto);

    // await this.postRepository.responsePriceToSeller(); // TODO - 유저 테이블 구체화된 후 수정 (알림기능)

    const priceOffer = await PriceOffer.findOne({
      where: {
        priceOfferId: priceOfferedId,
      },
    });
    return priceOffer;
  }

  async acceptOfferedPrice(acceptOfferedPriceDto: AcceptOfferedPriceDto): Promise<PriceOffer> {
    const priceOffered = await this.postRepository.determineOfferedPrice(acceptOfferedPriceDto);
    return priceOffered;
  }

  async setStaticData(postId: number): Promise<object> {
    // 임시방편으로 static data 저장하기
    const complaintReason = await ComplaintReason.find();
    const processState = await ProcessState.find();
    const dealState = await DealState.find();

    if (Object.keys(complaintReason).length === 0) {
      this.postRepository.putComplaintReasons();
    }
    if (Object.keys(processState).length === 0) {
      this.postRepository.putProcessStates();
    }
    if (Object.keys(dealState).length === 0) {
      this.postRepository.putDealState();
    }

    const data = { ...complaintReason, ...processState, ...dealState };

    return data;
  }

  async getPostsComplaintById(complaintId: number): Promise<PostsComplaint> {
    const found = await PostsComplaint.findOne(complaintId);
    if (!found) {
      throw new NotFoundException(`postId가 ${complaintId}인 것을 찾을 수 없습니다.`);
    }
    return found;
  }

  async reportPost(createPostsComplaintDto: CreatePostsComplaintsDto): Promise<PostsComplaint> {
    /**
     * @ 코드 작성자: 이승연
     * @ 기능: 게시물 신고
     * * @ 👮🏻 관리자
     * @ 1️⃣ PostsComplaints entity에 등록 - createPostsComplaints.dto.ts 생성
     * @ + [ComplaintReason] static data -> 신고 이유 등록
     * @ + [ReportHandling] static data -> 신고 처리 상태 등록
     * @ 2️⃣ 작성자 외 모든 사용자들이 해당 게시글 신고 가능 (신고요청)
     */

    const insertId = await this.postRepository.createPostsComplaint(createPostsComplaintDto);

    return this.getPostsComplaintById(insertId);
  }

  async updateDealState(postId: number, updateDealStateDto: UpdateDealStateDto): Promise<Post> {
    /**
     * @ 코드 작성자: 이승연
     * @ 기능: 거래 상태 변경
     * @ [dealState] static data -> 거래 상태 등록 ✔︎
     * @ default: 판매중 (1)
     * @ request에 담긴 state에 따라 예약중 || 거래완료로 변경
     * @ 💡 TODO -> 판매자(게시글 작성자만 가능 -> user부분 구현되면 추가 예정)
     */

    await this.postRepository.updateDealState(postId, updateDealStateDto);
    return await this.getPostById(postId);
  }

  async hidePost(postId: number) {
    /**
     * @ 코드 작성자: 이승연
     * @ 기능: 게시글 숨김 처리
     * @ 게시글 신고처리 (reportHandling=true) 상태일 때, isHidden = true로 변경하여 숨김처리
     * @ 전체 게시글 조회시 isHidden = false인 것만 filtering 하기
     */

    const post = await this.postRepository.findOne({
      where: {
        postId,
      },
    });

    if (!post) {
      throw new NotFoundException(`postId가 ${postId}인 것을 찾을 수 없습니다.`);
    }

    await this.postRepository.updateHiddenState(postId);

    return await this.getPostById(postId);
  }
}
