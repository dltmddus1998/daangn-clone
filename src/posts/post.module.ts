import {Module} from '@nestjs/common';
import {PostService} from './post.service';
import {PostResolver} from './post.resolver';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Post} from './post.entity';
import {PriceOffer} from './priceOffer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), TypeOrmModule.forFeature([PriceOffer])],
  providers: [PostService, PostResolver],
})
export class PostModule {}
