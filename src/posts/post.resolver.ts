import { ProcessState } from 'src/posts/entities/processState.entity';
import { PostsLikeDto } from './dto/addPostsLike.dto';
import { PostsLikeRecord } from 'src/posts/entities/postsLikeRecord.entity';
import { CreatePostsComplaintsDto } from './dto/createPostsComplaints.dto';
import { AcceptOfferedPriceDto } from './dto/acceptOfferedPrice.dto';
import { ParseFilePipe, ParseIntPipe, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { CreatePostDto } from './dto/createPost.dto';
import { SearchPostDto } from './dto/searchPost.dto';
import { UpdatePostDto } from './dto/updatePost.dto';
import { OfferPriceDto } from './dto/offerPrice.dto';
import { Post } from './entities/post.entity';
import { PriceOffer } from './entities/priceOffer.entity';
import { PostService } from './post.service';
import { PostComplaints } from './entities/postComplaints.entity';
import { UpdateDealStateDto } from './dto/updateDealState.dto';
import { GetUser } from 'src/users/validations/getUser.decorator';
import { JwtAuthGuard } from 'src/users/guards/jwtAuth.guard';
import { PostImagesValidationPipe } from './pipes/postImages.pipe';
import { PostsViewRecord } from './entities/postsViewRecord.entity';
import { PostsViewDto } from './dto/addPostsView.dto';
import { Category } from 'src/posts/entities/category.entity';

@Resolver(() => Post)
@UseGuards(JwtAuthGuard)
export class PostResolver {
  constructor(private readonly postService: PostService) {}

  // 게시글 카테고리 조회
  @Query(() => [Category])
  getCategoryItem(): Promise<Category[]> {
    return this.postService.getCategoryItem();
  }

  // 게시글 작성
  @Mutation(() => Post)
  @UsePipes(ValidationPipe)
  createPost(@GetUser() user: User, @Args('createPostDto', PostImagesValidationPipe) createPostDto: CreatePostDto): Promise<Post> {
    return this.postService.createPost(user, createPostDto);
  }

  // 게시글 수정
  @Mutation(() => Post)
  updatePost(@GetUser() user: User, @Args('postId', ParseIntPipe) postId: number, @Args('updatePostDto', PostImagesValidationPipe) updatePostDto: UpdatePostDto): Promise<Post> {
    return this.postService.updatePost(user, postId, updatePostDto);
  }

  // 게시글 삭제
  @Mutation(() => String)
  deletePost(@GetUser() user: User, @Args('postId', ParseIntPipe) postId: number): Promise<string> {
    return this.postService.deletePost(user, postId);
  }

  // 게시글 상세보기
  @Query(() => Post, { name: 'post' })
  getPostById(@Args('postId', ParseIntPipe) postId: number): Promise<Post> {
    return this.postService.getPostById(postId);
  }

  // 게시글 목록 조회 및 검색
  @Query(() => [Post], { name: 'posts' })
  @UsePipes(ValidationPipe)
  getPosts(@GetUser() user: User, @Args('searchPostDto') searchPostDto: SearchPostDto): Promise<Post[]> {
    return this.postService.getPosts(user, searchPostDto);
  }

  // 게시글 끌올
  @Mutation(() => Post)
  @UsePipes(ValidationPipe)
  pullupPost(@Args('postId', ParseIntPipe) postId: number): Promise<Post> {
    return this.postService.pullUpPost(postId);
  }

  // 가격 제안 to 판매자
  @Mutation(() => PriceOffer)
  @UsePipes(ValidationPipe)
  offerPriceToSeller(@Args('offerPriceDto') offerPriceDto: OfferPriceDto): Promise<PriceOffer> {
    return this.postService.offerPrice(offerPriceDto);
  }

  // 가격 제안 수락
  @Mutation(() => PriceOffer)
  @UsePipes(ValidationPipe)
  acceptOfferedPriceOfSeller(@Args('acceptOfferedPriceDto') acceptOfferPriceDto: AcceptOfferedPriceDto): Promise<PriceOffer> {
    return this.postService.acceptOfferedPrice(acceptOfferPriceDto);
  }

  // 게시글 신고
  @Mutation(() => PostComplaints)
  @UsePipes(ValidationPipe)
  reportPost(@Args('createPostsComplaintDto', ParseFilePipe) createPostsComplaintDto: CreatePostsComplaintsDto): Promise<PostComplaints> {
    return this.postService.reportPost(createPostsComplaintDto);
  }

  // 게시글 상태 변경
  @Mutation(() => Post)
  @UsePipes(ValidationPipe)
  updateDealState(@Args('postId', ParseIntPipe) postId: number, @Args('updateDealStateDto') updateDealStateDto: UpdateDealStateDto): Promise<Post> {
    return this.postService.updateDealState(postId, updateDealStateDto);
  }

  // 게시글 숨김 처리
  @Mutation(() => Post)
  hidePost(@GetUser() user: User, @Args('postId', ParseIntPipe) postId: number) {
    return this.postService.hidePost(user, postId);
  }

  // 게시글 숨김 처리 해제
  @Mutation(() => Post)
  clearHiddenPostState(@GetUser() user: User, @Args('postId', ParseIntPipe) postId: number) {
    return this.postService.clearHiddenPostState(user, postId);
  }

  // 게시글 좋아요 누르기
  @Mutation(() => PostsLikeRecord)
  addLikeToPost(@GetUser() user: User, @Args('postsLikeDto') postsLikeDto: PostsLikeDto): Promise<PostsLikeRecord> {
    return this.postService.addLikeToPost(user, postsLikeDto);
  }

  // 게시글 좋아요 취소하기
  @Mutation(() => Post)
  substractLikeToPost(@GetUser() user: User, @Args('postsLikeDto') postsLikeDto: PostsLikeDto): Promise<Post> {
    return this.postService.substractLikeToPost(user, postsLikeDto);
  }

  // 게시글 조회수 증가
  @Mutation(() => PostsViewRecord)
  addViewToPost(@GetUser() user: User, @Args('postsViewDto') postsViewDto: PostsViewDto): Promise<PostsViewRecord> {
    return this.postService.addViewToPost(user, postsViewDto);
  }
}
