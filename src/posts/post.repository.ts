import { UpdateDealStateDto } from './dto/updateDealState.dto';
import { CreatePostsComplaintsDto } from './dto/createPostsComplaints.dto';
import { AcceptOfferedPriceDto } from './dto/acceptOfferedPrice.dto';
import { OfferPriceDto } from './dto/offerPrice.dto';
import { EntityRepository, getRepository, Repository } from 'typeorm';
import { CreatePostDto } from './dto/createPost.dto';
import { SearchPostDto } from './dto/searchPost.dto';
import { UpdatePostDto } from './dto/updatePost.dto';
import { Post } from './post.entity';
import { PriceOffer } from './priceOffer.entity';
import { ProcessState } from 'src/processStates/processState.entity';
import { PostsComplaint } from './postsComplaint.entity';
import { DealState } from 'src/dealStates/dealState.entity';
import { User } from 'src/users/user.entity';
import { PurchaseHistory } from '../mypage/purchaseHistory.entity';
import { PurchaseHistoryDto } from '../mypage/dto/purchaseHistory.dto';

@EntityRepository(Post)
export class PostRepository extends Repository<Post> {
  async createPost(user: User, createPostDto: CreatePostDto): Promise<number> {
    const { title, content, category, price, isOfferedPrice, townRange, dealState } = createPostDto;
    const query = await getRepository(Post).createQueryBuilder('Post').insert().into(Post).values({ user: user, title, content, price, isOfferedPrice, category, townRange, dealState }).execute();
    return query.raw.insertId;
  }

  async updatePost(postId: number, updatePostDto: UpdatePostDto): Promise<void> {
    const { title, content, category, price, isOfferedPrice, townRange } = updatePostDto;
    await getRepository(Post).createQueryBuilder('Post').update(Post).set({ title, content, price, isOfferedPrice, category, townRange }).where('postId = :postId', { postId: postId }).execute();
  }

  async getPosts(searchPostDto: SearchPostDto): Promise<Post[]> {
    const { search, minPrice, maxPrice, category, townRange, dealState, perPage, page } = searchPostDto;
    const queryBuilder = await getRepository(Post)
      .createQueryBuilder('post')
      .innerJoinAndSelect('post.category', 'category')
      .innerJoinAndSelect('post.townRange', 'townRange')
      .innerJoinAndSelect('post.dealState', 'dealState')
      .where('isHidden = :isHidden', { isHidden: false })
      .andWhere('reportHandling = :reportHandling', { reportHandling: false })
      .andWhere('price >= :minPrice', { minPrice: minPrice })
      .orderBy('post.pulledAt', 'DESC')
      .offset((page - 1) * perPage)
      .limit(perPage);
    if (search) queryBuilder.andWhere('title like :title', { title: `%${search}%` });
    if (maxPrice !== -1) queryBuilder.andWhere('price <= :maxPrice', { maxPrice: maxPrice });
    if (category) queryBuilder.andWhere('category.categoryId = :category', { category: category });
    if (townRange) queryBuilder.andWhere('townRange.townRangeId = :townRange', { townRange: townRange });
    if (dealState) queryBuilder.andWhere('dealState.dealStateId = :dealState', { dealState: dealState });
    return queryBuilder.getMany();
  }

  async changePulled(postId: number): Promise<void> {
    await getRepository(Post).createQueryBuilder('post').update(Post).set({ pulledAt: new Date() }).where('postId = :postId', { postId }).execute();
  }

  async requestPriceToSeller(offerPriceDto: OfferPriceDto): Promise<number> {
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

  async createPostsComplaint(createPostsComplaintsDto: CreatePostsComplaintsDto): Promise<number> {
    const { post, complaintReason, processState } = createPostsComplaintsDto;
    const query = await getRepository(PostsComplaint)
      .createQueryBuilder('PostsComplaint')
      .insert()
      .into(PostsComplaint)
      .values({
        post,
        complaintReason,
        processState,
      })
      .execute();
    return query.raw.insertId;
  }

  async updateDealState(postId: number, updateDealStateDto: UpdateDealStateDto) {
    const { dealState } = updateDealStateDto;
    await getRepository(Post).createQueryBuilder('Post').update(Post).set({ dealState }).where('postId = :postId', { postId: postId }).execute();
  }
}
