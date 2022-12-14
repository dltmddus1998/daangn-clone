import { PostsViewDto } from './dto/addPostsView.dto';
import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { CreatePostDto } from './dto/createPost.dto';
import { SearchPostDto } from './dto/searchPost.dto';
import { UpdatePostDto } from './dto/updatePost.dto';
import { OfferPriceDto } from './dto/offerPrice.dto';
import { AcceptOfferedPriceDto } from './dto/acceptOfferedPrice.dto';
import { CreatePostsComplaintsDto } from './dto/createPostsComplaints.dto';
import { Post } from './entities/post.entity';
import { PriceOffer } from './entities/priceOffer.entity';
import { PostRepository } from './repositories/post.repository';
import { PostComplaints } from './entities/postComplaints.entity';
import { UpdateDealStateDto } from './dto/updateDealState.dto';
import { PostsLikeRecord } from './entities/postsLikeRecord.entity';
import { PostsLikeDto } from './dto/addPostsLike.dto';
import { PostsViewRecord } from './entities/postsViewRecord.entity';
import { v1 as uuid } from 'uuid';
import { EntityManager, getConnection, getRepository } from 'typeorm';
import { Location } from 'src/users/entities/location.entity';
import { UserService } from 'src/users/user.service';
import * as config from 'config';
import * as AWS from 'aws-sdk';
import { FileUpload } from 'src/users/models/fileUpload.model';
import { PostImage } from './entities/postImage.entity';
import { Category } from 'src/posts/entities/category.entity';

const s3Config: any = config.get('S3');
const AWS_S3_BUCKET_NAME = s3Config.AWS_S3_BUCKET_NAME;
const s3 = new AWS.S3({
  region: s3Config.AWS_S3_REGION,
  credentials: {
    accessKeyId: s3Config.AWS_ACCESS_KEY_ID,
    secretAccessKey: s3Config.AWS_SECRET_ACCESS_KEY,
  },
});

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostRepository)
    private postRepository: PostRepository,
    private readonly userService: UserService,
  ) {}

  async getCategoryItem(): Promise<Category[]> {
    /**
     * 게시글 카테고리 static data 조회
     *
     * @author 허정연(golgol22)
     * @return {Category[]} 카테고리 데이터 반환
     */
    return await getRepository(Category).find();
  }

  async imagesUploadToS3(manager: EntityManager, insertId: number, images: Promise<FileUpload>[]) {
    /**
     * S3에 게시글 이미지 저장
     *
     * @author 허정연(golgol22)
     * @param {insertId, images} 이미지 저장할 게시글 ID, 업로드할 이미지
     */
    for (const image of images) {
      const { encoding, mimetype, createReadStream } = await image;
      try {
        const newFileName = uuid();
        await s3
          .putObject({
            Key: `${newFileName}.png`,
            Body: createReadStream(),
            Bucket: `${AWS_S3_BUCKET_NAME}/post`,
            ContentEncoding: encoding,
            ContentType: mimetype,
            ContentLength: createReadStream().readableLength,
          })
          .promise();
        await this.postRepository.addPostImagePath(manager, insertId, `${newFileName}.png`);
      } catch (err) {
        console.error(err);
      }
    }
  }

  private async imageDeleteFromS3(postImages: PostImage[]) {
    /**
     * S3에서 게시글 이미지 삭제
     *
     * @author 허정연(golgol22)
     * @param {postImages} 삭제할 게시글 이미지
     */
    for (const file of postImages) {
      try {
        await s3
          .deleteObject({
            Key: file.imagePath,
            Bucket: `${AWS_S3_BUCKET_NAME}/post`,
          })
          .promise();
      } catch (err) {
        console.error(err);
      }
    }
  }

  async createPost(user: User, createPostDto: CreatePostDto): Promise<Post> {
    /**
     * 게시글 작성
     *
     * @author 허정연(golgol22)
     * @param {user, title, content, category, price, isOfferedPrice, townRange, dealState, images}
     *        로그인한 유저, 제목, 내용, 카테고리, 가격, 가격제안받기여부, 동네범위, 거래상태, 이미지
     * @return {Post} 게시글 반환
     * @throws {ForbiddenException} 동네 인증을 하지 않았을 때 예외처리
     * @throws {InternalServerErrorException} 게시글 생성 실패할 때 예외처리
     */
    const location = await getRepository(Location).findOne({ where: { user: user.phoneNumber, isSelected: true } });
    if (!location.isConfirmedPosition) {
      throw new ForbiddenException('동네 인증을 해야 게시글을 작성할 수 있습니다.');
    }
    let insertId = -1;
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        insertId = await this.postRepository.createPost(manager, user, createPostDto, location);
        const { images } = createPostDto;
        if (images) {
          await this.imagesUploadToS3(manager, insertId, images);
        }
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('게시글 생성에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return await this.getPostById(insertId);
  }

  async updatePost(user: User, postId: number, updatePostDto: UpdatePostDto): Promise<Post> {
    /**
     * 게시글 수정
     *
     * @author 허정연(golgol22)
     * @param {user, postId, title, content, category, price, isOfferedPrice, townRange, images}
     *        로그인한 유저, 게시글 ID, 제목, 내용, 카테고리, 가격, 가격제안받기여부, 동네범위, 이미지
     * @return {Post} 게시글 반환
     * @throws {NotFoundException} 해당 게시글이 없을 때 예외 처리
     * @throws {ForbiddenException} 권한없는 사용자의 수정 요청 예외처리
     * @throws {InternalServerErrorException} 게시글 수정 실패할 때 예외처리
     */
    const post = await this.getPostById(postId);
    if (!post) {
      throw new NotFoundException(`postId가 ${postId}인 것을 찾을 수 없습니다.`);
    }
    if (JSON.stringify(post.user) !== JSON.stringify(user)) {
      throw new ForbiddenException(`본인이 작성한 게시글만 수정할 수 있습니다.`);
    }
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        await this.postRepository.updatePost(postId, updatePostDto);
        const { images } = updatePostDto;
        if (images) {
          await this.imageDeleteFromS3(post.postImages);
          await this.postRepository.deletePostImagePath(manager, postId);
          await this.imagesUploadToS3(manager, postId, images);
        }
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('게시글 수정에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return await this.getPostById(postId);
  }

  async deletePost(user: User, postId: number): Promise<string> {
    /**
     * 게시글 삭제
     * 게시글 삭제시 DB에 저장된 게시글 이미지 경로 자동 삭제 (Cascade)
     *
     * @author 허정연(golgol22)
     * @param {user, postId} 로그인한 유저, 게시글 ID
     * @return {string} 삭제되었습니다.
     * @throws {NotFoundException} 해당 게시글이 없을 때 예외 처리
     * @throws {ForbiddenException} 권한없는 사용자의 삭제 요청 예외처리
     * @throws {InternalServerErrorException} 게시글 삭제 실패할 때 예외처리
     */
    const post = await this.getPostById(postId);
    if (!post) {
      throw new NotFoundException(`postId가 ${postId}인 것을 찾을 수 없습니다.`);
    }
    if (JSON.stringify(post.user) !== JSON.stringify(user)) {
      throw new ForbiddenException(`본인이 작성한 게시글만 삭제할 수 있습니다.`);
    }
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        await this.imageDeleteFromS3(post.postImages);
        await this.postRepository.delete(postId);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('게시글 삭제에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return '삭제되었습니다.';
  }

  async getPostById(postId: number): Promise<Post> {
    /**
     * 게시글 상세보기
     *
     * @author 허정연(golgol22)
     * @param {user, postId} 로그인한 유저, 게시글 ID
     * @return {Post} 게시글 반환
     * @throws {NotFoundException} 해당 게시글이 없을 때 예외 처리
     */
    const found = await this.postRepository.findOne(postId);
    if (!found) {
      throw new NotFoundException(`postId가 ${postId}인 것을 찾을 수 없습니다.`);
    }
    return found;
  }

  async getPosts(user: User, searchPostDto: SearchPostDto): Promise<Post[]> {
    /**
     * 게시글 목록 및 검색
     * 게시글은 post.location 지역의 post.townrange 범위에 있는 사람들까지 보여준다.
     * 유저는 location.isSelected = true인 위치의 location.townRage 범위 또는 검색 조건으로 받은 townRange 범위에 있는 게시글까지 볼 수 있다.
     *
     * @author 허정연(golgol22)
     * @param {search, minPrice, maxPrice, category, townRange, dealState, perPage, page}
     *        검색어, 최소가격, 최대가격, 카테고리, 동네범위, 거래상태, 한 페이지당 게시글 개수, 페이지
     * @return {Post[]} 게시글 목록 반환
     */
    const { townRange } = searchPostDto;
    const location = await getRepository(Location).findOne({ where: { user: user.phoneNumber, isSelected: true } });
    const searchTownRange = townRange ? townRange : location.townRange.townRangeId;
    const userAvailableTownList = await this.userService.getTownListByTownRange(user, location, searchTownRange);
    const posts = await this.postRepository.getPosts(searchPostDto);
    const filteredPosts = posts.reduce(async (result, post) => {
      const postAvailableTownList = await this.userService.getTownListByTownRange(user, post.location, post.townRange.townRangeId);
      if (postAvailableTownList.filter(x => userAvailableTownList.includes(x)).length > 0) {
        (await result).push(post);
      }
      return Promise.resolve(result);
    }, Promise.resolve([]));
    return filteredPosts;
  }

  async pullUpPost(postId: number): Promise<Post> {
    /**
     * 게시글 끌어올리기
     *
     * @author 이승연(dltmddus1998)
     * @param {postId} 게시글 번호
     * @return {Post} 게시글 전체 반환
     * @throws {NotFoundException} 해당 게시글이 없을 때 예외 처리
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
     * 가격 제안하기
     *
     * @author 이승연(dltmddus1998)
     * @param {offerPrice, post} 가격 제시, 게시글
     * @return {PriceOffer} 가격 제시 전체 반환
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
    /**
     * 가격 제안 수락하기
     *
     * @author 이승연(dltmddus1998)
     * @param {accept, priceOfferId} 가격 제시 수락 여부, 가격제시 번호
     * @return {PriceOffer} 가격 제시 전체 반환
     */
    const priceOffered = await this.postRepository.determineOfferedPrice(acceptOfferedPriceDto);
    return priceOffered;
  }

  async getPostsComplaintById(complaintId: number): Promise<PostComplaints> {
    const found = await PostComplaints.findOne(complaintId);
    if (!found) {
      throw new NotFoundException(`postId가 ${complaintId}인 것을 찾을 수 없습니다.`);
    }
    return found;
  }

  async reportPost(createPostsComplaintDto: CreatePostsComplaintsDto): Promise<PostComplaints> {
    /**
     * 게시글 신고하기
     *
     * @author 이승연(dltmddus1998)
     * @param {post, complaintReason, processState} 게시글, 신고 내용, 신고 처리 상태
     * @return {PostsComplaint} 게시글 신고 전체 반환
     * @throws {NotFoundException} 해당 게시글 없을 때 예외 처리
     */
    const { post } = createPostsComplaintDto;
    const reportedPost = await getRepository(PostComplaints).findOne({
      where: {
        post,
      },
    });
    if (reportedPost) {
      throw new BadRequestException('이미 신고한 게시글입니다.');
    }
    const insertId = await this.postRepository.createPostsComplaint(createPostsComplaintDto);
    return this.getPostsComplaintById(insertId);
  }

  async updateDealState(postId: number, updateDealStateDto: UpdateDealStateDto): Promise<Post> {
    /**
     * 거래 상태 변경하기
     *
     * @author 이승연(dltmddus1998)
     * @param {dealState} 거래 상태
     * @return {Post} 게시글 전체 반환
     * @throws {NotFoundException} 해당 게시글 없을 때 예외 처리
     */
    await this.postRepository.updateDealState(postId, updateDealStateDto);
    return await this.getPostById(postId);
  }

  async hidePost(user: User, postId: number) {
    /**
     * 게시글 숨김 처리하기
     *
     * @author 이승연(dltmddus1998)
     * @param {user, postId} 로그인한 유저, 게시글 번호
     * @return {Post} 게시글 전체 반환
     * @throws {NotFoundException} 해당 게시글 없을 때 예외 처리
     */
    const post = await this.getPostById(postId);
    if (JSON.stringify(post.user) !== JSON.stringify(user)) {
      throw new BadRequestException(`본인이 작성한 게시글만 숨김처리할 수 있습니다.`);
    }
    if (!post) {
      throw new NotFoundException(`postId가 ${postId}인 것을 찾을 수 없습니다.`);
    }
    await this.postRepository.updateHiddenStateTrue(postId);
    return await this.getPostById(postId);
  }

  async clearHiddenPostState(user: User, postId: number) {
    /**
     * 게시글 숨김 처리 해제하기
     *
     * @author 이승연(dltmddus1998)
     * @param {user, postId} 로그인한 유저, 게시글 번호
     * @return {Post} 게시글 전체 반환
     * @throws {NotFoundException} 해당 게시글 없을 때 예외 처리
     */
    const post = await this.getPostById(postId);
    if (JSON.stringify(post.user) !== JSON.stringify(user)) {
      throw new BadRequestException(`본인이 작성한 게시글만 숨김처리를 해제할 수 있습니다.`);
    }
    if (!post) {
      throw new NotFoundException(`postId가 ${postId}인 것을 찾을 수 없습니다.`);
    }
    await this.postRepository.updateHiddenStateFalse(postId);
    return await this.getPostById(postId);
  }

  async getPostsLikeRecordById(postsLikeId: number) {
    const found = await PostsLikeRecord.findOne(postsLikeId);
    if (!found) {
      throw new NotFoundException(`postsLikeId가 ${postsLikeId}인 기록을 찾을 수 없습니다.`);
    }
    return found;
  }

  async getPostsLikeRecordByUser(user: User, post: Post) {
    const found = await PostsLikeRecord.findOne({
      where: {
        user,
        post,
      },
    });
    return found;
  }

  async addLikeToPost(user: User, postsLikeDto: PostsLikeDto): Promise<PostsLikeRecord> {
    /**
     * 게시글 좋아요 누르기
     *
     * @author 이승연(dltmddus1998)
     * @param {user, addPostsLikeDto} 로그인한 유저, 게시글 번호
     * @return {PostsLikeRecord} 로그인한 유저가 해당 게시글에 좋아요 누른 기록 반환
     * @throws {BadRequestException} 이미 좋아요를 누른 경우 예외 처리
     */
    const { post } = postsLikeDto;
    const postsLikeReocrd = await this.getPostsLikeRecordByUser(user, post);
    if (postsLikeReocrd) {
      throw new BadRequestException(`이미 좋아요를 누른 게시물입니다.`);
    } else {
      const likeAddedPost = await Post.findOne(post);
      const likes = likeAddedPost.likes;
      const insertId = await this.postRepository.addLikeTransaction(user, postsLikeDto, post, likes);
      const updatedPostsLikeRecord = await PostsLikeRecord.findOne(insertId);
      return updatedPostsLikeRecord;
    }
  }

  async substractLikeToPost(user: User, postsLikeDto: PostsLikeDto): Promise<Post> {
    /**
     * 게시글 좋아요 취소하기
     *
     * @author 이승연(dltmddus1998)
     * @param {user, addPostsLikeDto} 로그인한 유저, 게시글 번호
     * @return {PostsLikeRecord} 해당 게시글 반환
     * @throws {BadRequestException} 좋아요를 누르지 않은 경우 예외 처리
     */
    const { post } = postsLikeDto;
    const postsLikeRecord = await this.getPostsLikeRecordByUser(user, post);
    if (!postsLikeRecord) {
      throw new BadRequestException(`해당 게시글에 좋아요를 누르지 않았습니다.`);
    } else {
      const likeSubstractedPost = await Post.findOne(post);
      const likeSubstractedPostsLikeRecord = await PostsLikeRecord.findOne({
        where: {
          post,
        },
      });
      const postsLikeId = likeSubstractedPostsLikeRecord.postsLikeId;
      const likes = likeSubstractedPost.likes;
      await this.postRepository.substractLikeTransaction(user, postsLikeId, post, likes);
      return await Post.findOne(post);
    }
  }

  async getPostsViewRecordByUser(user: User, post: Post) {
    const found = await PostsViewRecord.findOne({
      where: {
        user,
        post,
      },
    });
    return found;
  }

  async addViewToPost(user: User, postsViewDto: PostsViewDto): Promise<PostsViewRecord> {
    /**
     * 게시글 조회수 추가 (1인당 1개 Max)
     *
     * @author 이승연(dltmddus1998)
     * @param {user, addPostsViewDto} 로그인한 유저, 게시글 번호
     * @return {PostsViewRecord} 로그인한 유저가 해당 게시글을 조회한 기록 반환
     * @throws {BadRequestException} 이미 조회한 경우 예외 처리
     */
    const { post } = postsViewDto;
    const postsViewRecord = await this.getPostsViewRecordByUser(user, post);
    if (postsViewRecord) {
      throw new BadRequestException(`해당 유저가 이미 조회한 게시글입니다.`);
    } else {
      const viewAddedPost = await Post.findOne(post);
      const views = viewAddedPost.views;
      const insertId = await this.postRepository.addViewTransaction(user, postsViewDto, post, views);
      const updatedPostsViewRecord = await PostsViewRecord.findOne(insertId);
      return updatedPostsViewRecord;
    }
  }
}
