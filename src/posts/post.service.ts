import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository, Connection, getManager} from 'typeorm';
import {PullUpPostInputDto} from './dto/pullUpPostInput.dto';
import {OfferPriceDto} from './dto/offerPrice.dto';
import {Post} from './post.entity';
import {PriceOffer} from './priceOffer.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(PriceOffer)
    private priceOfferRepository: Repository<PriceOffer>,
    private connection: Connection,
  ) {}

  async pullUpPost(pullUpPostInputDto: PullUpPostInputDto) {
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
    const {postId} = pullUpPostInputDto;
    // console.log(postId);
    const post = await this.findPost(postId);
    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.'); // 404 error
    }

    await this.changeUpdatedAt(postId);
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
    const {priceOfferId, postId, offerPrice, accept} = offerPriceDto;

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction(); // 트랜잭션 처리

    const priceOfferedPost = await this.requestPriceToSeller(priceOfferId, offerPrice);

    if (!priceOfferedPost) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.'); // 404 error
    }

    await this.responsePriceToSeller(); // TODO - 유저 테이블 구체화된 후 수정 (알림기능)

    const priceOffered = await this.determineOfferedPrice(accept, priceOfferId, postId);

    await queryRunner.manager.save(priceOfferedPost);

    return priceOffered;
  }

  async reportPost() {
    /**
     * @ 코드 작성자: 이승연
     * @ 기능: 게시물 신고
     * @ [ComplaintReason] static data -> 신고 이유 등록
     * @ [ReportHandling] static data -> 신고 처리 상태 등록
     * @ 1️⃣ 작성자 외 모든 사용자들이 해당 게시글 신고 가능 (신고 요청)
     * @ 👮🏻 관리자
     * @ 2️⃣ PostsComplaints entity에 등록
     */
  }

  // pullUpPost에서 사용할 private 메서드 생성
  private async findPost(postId: number): Promise<object> {
    const post = await this.postRepository.findOne({
      where: {
        postId,
      },
    });

    return post;
  }

  private async changeUpdatedAt(postId: number): Promise<boolean> {
    const post = await this.postRepository.findOne({
      where: {
        postId,
      },
    });

    // post.updatedAt = new Date();
    post.content = 'abc';

    await this.postRepository.save(post);

    return post === undefined;
  }

  // offerPrice에서 사용할 pirvate 메서드 생성
  private async requestPriceToSeller(priceOfferId: number, offerPrice: number): Promise<PriceOffer> {
    const priceOffered = await this.priceOfferRepository.findOne({
      where: {
        priceOfferId,
      },
    });

    priceOffered.offerPrice = offerPrice;

    await this.priceOfferRepository.save(priceOffered);
    // const data = {...priceOffered};
    return priceOffered;
  }

  private async responsePriceToSeller() {}

  private async determineOfferedPrice(accept: boolean, priceOfferId: number, postId: number): Promise<PriceOffer> {
    const post = await this.postRepository.findOne({
      where: {
        postId,
      },
    });
    const priceOffered = await this.priceOfferRepository.findOne({
      where: {
        priceOfferId,
      },
    });
    if (accept) {
      priceOffered.accept = true;
      post.isOfferedPrice = true;
      post.price = priceOffered.offerPrice;

      this.postRepository.save(post);
      this.priceOfferRepository.save(priceOffered);

      return priceOffered;
    } else {
      console.log('here you are!!');

      return;
    }
  }

  // reportPost에서 사용할 private 메서드 생성
  private async reportPostByUser() {}

  private async registerPostComplaints() {}
}
