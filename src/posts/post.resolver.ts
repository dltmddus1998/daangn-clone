import {PriceOffer} from './priceOffer.entity';
import {Resolver, Args, Mutation, Field, Query, Int} from '@nestjs/graphql';
import {Post} from './post.entity';
import {PostService} from './post.service';
import {PullUpPostInputDto} from './dto/pullUpPostInput.dto';
import {OfferPriceDto} from './dto/offerPrice.dto';

@Resolver('Post')
export class PostResolver {
  constructor(private readonly postService: PostService) {}

  // 게시글 끌올
  @Query(() => Post)
  async pullupPost(@Args('pullUpPostInputDto') pullUpPostInputDto: PullUpPostInputDto) {
    return await this.postService.pullUpPost(pullUpPostInputDto);
  }

  // 가격 제안 to 판매자
  @Mutation(() => PriceOffer)
  async offerPriceToSeller(@Args('offerPriceDto') offerPriceDto: OfferPriceDto): Promise<PriceOffer> {
    return await this.postService.offerPrice(offerPriceDto);
  }
}
