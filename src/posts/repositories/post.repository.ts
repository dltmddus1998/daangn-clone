import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UpdateDealStateDto } from '../dto/updateDealState.dto';
import { CreatePostsComplaintsDto } from '../dto/createPostsComplaints.dto';
import { AcceptOfferedPriceDto } from '../dto/acceptOfferedPrice.dto';
import { OfferPriceDto } from '../dto/offerPrice.dto';
import { EntityManager, EntityRepository, getConnection, getRepository, Repository } from 'typeorm';
import { CreatePostDto } from '../dto/createPost.dto';
import { SearchPostDto } from '../dto/searchPost.dto';
import { UpdatePostDto } from '../dto/updatePost.dto';
import { Post } from '../entities/post.entity';
import { PriceOffer } from '../entities/priceOffer.entity';
import { ProcessState } from 'src/posts/entities/processState.entity';
import { PostComplaints } from '../entities/postComplaints.entity';
import { DealState } from 'src/posts/entities/dealState.entity';
import { User } from 'src/users/entities/user.entity';
import { PostsLikeRecord } from '../entities/postsLikeRecord.entity';
import { PostsLikeDto } from '../dto/addPostsLike.dto';
import { PostsViewDto } from '../dto/addPostsView.dto';
import { PostsViewRecord } from '../entities/postsViewRecord.entity';
import { PostImage } from '../entities/postImage.entity';
import { Location } from 'src/users/entities/location.entity';

@EntityRepository(Post)
export class PostRepository extends Repository<Post> {
  async createPost(manager: EntityManager, user: User, createPostDto: CreatePostDto, location: Location) {
    const { title, content, category, price, isOfferedPrice, townRange, dealState } = createPostDto;
    const query = await manager
      .getRepository(Post)
      .createQueryBuilder('Post')
      .insert()
      .into(Post)
      .values({ user, title, content, price, isOfferedPrice, category, townRange, location, dealState })
      .execute();
    return query.raw.insertId;
  }

  async deletePostImagePath(manager: EntityManager, postId: number) {
    await manager.getRepository(PostImage).createQueryBuilder('PostImage').delete().from(PostImage).where('postId = :postId', { postId }).execute();
  }

  async addPostImagePath(manager: EntityManager, post: number, imagePath: string) {
    await manager.getRepository(PostImage).createQueryBuilder('PostImage').insert().into(PostImage).values({ imagePath, post }).execute();
  }

  async updatePost(postId: number, updatePostDto: UpdatePostDto) {
    const { title, content, category, price, isOfferedPrice, townRange } = updatePostDto;
    await getRepository(Post).createQueryBuilder('Post').update(Post).set({ title, content, price, isOfferedPrice, category, townRange }).where('postId = :postId', { postId }).execute();
  }

  getPosts(searchPostDto: SearchPostDto) {
    const { search, minPrice, maxPrice, category, dealState, perPage, page } = searchPostDto;
    const queryBuilder = getRepository(Post)
      .createQueryBuilder('post')
      .innerJoinAndSelect('post.category', 'category')
      .innerJoinAndSelect('post.townRange', 'townRange')
      .innerJoinAndSelect('post.dealState', 'dealState')
      .innerJoinAndSelect('post.location', 'location')
      .leftJoinAndSelect('post.postImages', 'postImage')
      .innerJoinAndSelect('post.user', 'user')
      .where('isHidden = :isHidden', { isHidden: false })
      .andWhere('reportHandling = :reportHandling', { reportHandling: false })
      .andWhere('price >= :minPrice', { minPrice: minPrice })
      .orderBy('post.pulledAt', 'DESC')
      .offset((page - 1) * perPage)
      .limit(perPage);
    if (search) queryBuilder.andWhere('title like :title', { title: `%${search}%` });
    if (maxPrice !== -1) queryBuilder.andWhere('price <= :maxPrice', { maxPrice });
    if (category) queryBuilder.andWhere('category.categoryId = :category', { category });
    if (dealState) queryBuilder.andWhere('dealState.dealStateId = :dealState', { dealState });
    return queryBuilder.getMany();
  }

  async changePulled(postId: number) {
    await getRepository(Post).createQueryBuilder('post').update(Post).set({ pulledAt: new Date() }).where('postId = :postId', { postId }).execute();
  }

  async requestPriceToSeller(offerPriceDto: OfferPriceDto) {
    const { offerPrice, post } = offerPriceDto;
    const query = await getRepository(PriceOffer).createQueryBuilder('priceOffer').insert().into(PriceOffer).values({ offerPrice, post }).execute();
    return query.raw.insertId;
  }

  async responsePriceToSeller() {} // TODO: user 완성후 구현 예정

  async determineOfferedPrice(acceptOfferedPriceDto: AcceptOfferedPriceDto) {
    const { accept, priceOfferId } = acceptOfferedPriceDto;
    const priceOffered = await PriceOffer.findOne({
      where: {
        priceOfferId,
      },
    });
    const { post } = priceOffered;
    const priceOfferedPost = await Post.findOne({
      where: {
        postId: post.postId,
      },
    });
    if (accept) {
      priceOffered.accept = true;
      priceOfferedPost.isOfferedPrice = true;
      priceOfferedPost.price = priceOffered.offerPrice;
      Post.save(priceOfferedPost);
      PriceOffer.save(priceOffered);
      return priceOffered;
    } else {
      return;
    }
  }

  async updateHiddenStateTrue(postId: number) {
    await getRepository(Post).createQueryBuilder('Post').update(Post).set({ isHidden: true }).where('postId = :postId', { postId }).execute();
  }

  async updateHiddenStateFalse(postId: number) {
    await getRepository(Post).createQueryBuilder('Post').update(Post).set({ isHidden: false }).where('postId = :postId', { postId }).execute();
  }

  async putProcessStates() {
    await getRepository(ProcessState)
      .createQueryBuilder()
      .insert()
      .into(ProcessState)
      .values([
        { processStateId: 1, processState: '신고 접수' },
        { processStateId: 2, processState: '신고 검토중' },
        { processStateId: 3, processState: '신고 검토 완료 허용' },
        { processStateId: 4, processState: '신고 검토 완료 후 {메시지, 채팅, 게시글} 블라인드 시키고 사용자 매너 점수 감소' },
        { processStateId: 5, processState: '신고 검토 완료 후 {메시지, 채팅, 게시글} 블라인드 시키고 사용자 이용 정지 처분' },
      ])
      .execute();
  }

  async putDealState() {
    await getRepository(DealState)
      .createQueryBuilder()
      .insert()
      .into(DealState)
      .values([
        { dealStateId: 1, dealState: '판매중' },
        { dealStateId: 2, dealState: '예약중' },
        { dealStateId: 3, dealState: '거래완료' },
      ])
      .execute();
  }

  async createPostsComplaint(createPostsComplaintsDto: CreatePostsComplaintsDto) {
    const { post, complaintReason } = createPostsComplaintsDto;
    const query = await getRepository(PostComplaints)
      .createQueryBuilder('PostComplaints')
      .insert()
      .into(PostComplaints)
      .values({
        post,
        complaintReason,
      })
      .execute();
    return query.raw.insertId;
  }

  async updateDealState(postId: number, updateDealStateDto: UpdateDealStateDto) {
    const { dealState } = updateDealStateDto;
    await getRepository(Post).createQueryBuilder('Post').update(Post).set({ dealState }).where('postId = :postId', { postId: postId }).execute();
  }

  async addLikeToPost(manager: EntityManager, user: User, postsLikeDto: PostsLikeDto) {
    const { post } = postsLikeDto;
    const query = await manager.getRepository(PostsLikeRecord).createQueryBuilder('postsLikeRecord').insert().into(PostsLikeRecord).values({ post, user }).execute();
    return query.raw.insertId;
  }

  async addLikeCntToPost(manager: EntityManager, post: Post, likes: number) {
    likes = likes + 1;
    return await manager.getRepository(Post).createQueryBuilder('post').update(Post).set({ likes }).where('postId = :postId', { postId: post }).execute();
  }

  async addLikeTransaction(user: User, postsLikeDto: PostsLikeDto, post: Post, likes: number) {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const insertId = await this.addLikeToPost(queryRunner.manager, user, postsLikeDto);
      await this.addLikeCntToPost(queryRunner.manager, post, likes);
      await queryRunner.commitTransaction();
      return insertId;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      throw new InternalServerErrorException(`좋아요 기록이 추가되지 않았습니다. 잠시후 다시 시도해주세요.`);
    } finally {
      await queryRunner.release();
    }
  }

  async substractLikeToPost(manager: EntityManager, postsLikeId: number) {
    const result = await manager.getRepository(PostsLikeRecord).createQueryBuilder().delete().from(PostsLikeRecord).where('postsLikeId = :postsLikeId', { postsLikeId }).execute();
    if (result.affected === 0) {
      throw new NotFoundException(`postsLikeId가 ${postsLikeId}인 것을 찾을 수 없습니다.`);
    } else {
      return '삭제되었습니다.';
    }
  }

  async substractLikeCntToPost(manager: EntityManager, post: Post, likes: number) {
    if (likes > 0) {
      likes = likes - 1;
      return await manager.getRepository(Post).createQueryBuilder('post').update(Post).set({ likes }).where('postId = :postId', { postId: post }).execute();
    } else {
      return;
    }
  }

  async substractLikeTransaction(user: User, postsLikeId: number, post: Post, likes: number) {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const substractLikeToPost = await this.substractLikeToPost(queryRunner.manager, postsLikeId);
      await this.substractLikeCntToPost(queryRunner.manager, post, likes);
      await queryRunner.commitTransaction();
      return substractLikeToPost;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      throw new InternalServerErrorException(`좋아요 취소 기록이 추가되지 않았습니다. 잠시후 다시 시도해주세요.`);
    } finally {
      await queryRunner.release();
    }
  }

  async addViewToPost(manager: EntityManager, user: User, postsViewDto: PostsViewDto) {
    const { post } = postsViewDto;
    const query = await manager.getRepository(PostsViewRecord).createQueryBuilder('postsViewRecord').insert().into(PostsViewRecord).values({ post, user }).execute();
    return query.raw.insertId;
  }

  async addViewCntToPost(manager: EntityManager, post: Post, views: number) {
    views = views + 1;
    return await manager.getRepository(Post).createQueryBuilder('post').update(Post).set({ views }).where('postId = :postId', { postId: post }).execute();
  }

  async addViewTransaction(user: User, postsViewDto: PostsViewDto, post: Post, views: number) {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const insertId = await this.addViewToPost(queryRunner.manager, user, postsViewDto);
      await this.addViewCntToPost(queryRunner.manager, post, views);
      await queryRunner.commitTransaction();
      return insertId;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(err);
      throw new InternalServerErrorException(`조회수 추가에 실패하였습니다. 잠시후 다시 시도해주세요.`);
    } finally {
      await queryRunner.release();
    }
  }
}
