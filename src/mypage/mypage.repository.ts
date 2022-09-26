import { PostsLikeRecord } from 'src/posts/postsLikeRecord.entity';
import { InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { EntityRepository, getRepository, Repository, EntityManager, getConnection } from 'typeorm';
import { Followings } from './followings.entity';
import { User } from 'src/users/user.entity';
import { Post } from 'src/posts/post.entity';
import { PurchaseHistory } from './purchaseHistory.entity';
import { PurchaseHistoryDto } from './dto/purchaseHistory.dto';

@EntityRepository(Followings)
export class MypageRepository extends Repository<Followings> {
  async updateMarketingInfo(user: User, marketingInfoAgree: boolean) {
    await getRepository(User).createQueryBuilder('User').update(User).set({ marketingInfoAgree }).where('phoneNumber = :phoneNumber', { phoneNumber: user.phoneNumber }).execute();
  }

  async followUsers(user: User, followerUser: User): Promise<number> {
    const query = await getRepository(Followings).createQueryBuilder('Followings').insert().into(Followings).values({ followingUser: user, followerUser }).execute();
    return query.raw.insertId;
  }

  async deleteFollowUsers(followingId: number) {
    return await getRepository(Followings).createQueryBuilder('Followings').delete().from(Followings).where('followingId = :followingId', { followingId }).execute();
  }

  async seeFollowUsers(user: User, page: number, perPage: number) {
    return await getRepository(Followings)
      .createQueryBuilder('followings')
      .innerJoinAndSelect('followings.followingUser', 'user')
      .innerJoinAndSelect('followings.followerUser', 'subjectUser')
      .where('user.phoneNumber = :phoneNumber', { phoneNumber: user.phoneNumber })
      .orderBy('followings.createdAt', 'DESC')
      .offset((page - 1) * perPage)
      .limit(perPage)
      .getMany();
  }

  async getHiddenPostsList(user: User, page: number, perPage: number) {
    return await getRepository(Post)
      .createQueryBuilder('post')
      .innerJoinAndSelect('post.user', 'user')
      .where('user.phoneNumber = :phoneNumber', { phoneNumber: user.phoneNumber })
      .orderBy('post.createdAt', 'DESC')
      .offset((page - 1) * perPage)
      .limit(perPage)
      .getMany();
  }

  async buy(manager: EntityManager, user: User, purchaseHistoryDto: PurchaseHistoryDto) {
    const { post } = purchaseHistoryDto;
    await manager.getRepository(PurchaseHistory).createQueryBuilder('PurchaseHistory').insert().into(PurchaseHistory).values({ user: user, post }).execute();
  }

  async buyTransaction(user: User, purchaseHistoryDto: PurchaseHistoryDto) {
    const { post } = purchaseHistoryDto;
    const buyingPost = await Post.findOne(post);
    if (buyingPost.dealState.dealStateId === 3) {
      throw new BadRequestException('이미 구매처리가 확정된 게시글입니다.');
    }
    if (buyingPost.user.userName === user.userName) {
      throw new BadRequestException('게시글 작성자는 구매를 할 수 없습니다.');
    }
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        await this.buy(manager, user, purchaseHistoryDto);
        const buyingPost = await Post.findOne(post);
        buyingPost.dealState.dealStateId = 3;
        await manager.save(buyingPost);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('구매 확정에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return await Post.findOne(post);
  }

  async getBuyingListOfUser(user: User, page: number, perPage: number): Promise<PurchaseHistory[]> {
    const queryBuilder = getRepository(PurchaseHistory)
      .createQueryBuilder('purchaseHistory')
      .innerJoinAndSelect('purchaseHistory.user', 'user')
      .innerJoinAndSelect('purchaseHistory.post', 'post')
      .where('user.phoneNumber = :userPhoneNumber', { userPhoneNumber: user.phoneNumber })
      .orderBy('purchaseHistory.createdAt', 'DESC')
      .offset((page - 1) * perPage)
      .limit(perPage);
    return queryBuilder.getMany();
  }

  async getSellingListOfUser(user: User, page: number, perPage: number) {
    return await getRepository(Post)
      .createQueryBuilder('post')
      .innerJoinAndSelect('post.user', 'user')
      .where('user.phoneNumber = :phoneNumber', { phoneNumber: user.phoneNumber })
      .orderBy('post.createdAt', 'DESC')
      .offset((page - 1) * perPage)
      .limit(perPage)
      .getMany();
  }

  async getWatchListOfUser(user: User, page: number, perPage: number): Promise<PostsLikeRecord[]> {
    return await PostsLikeRecord.find();
  }

  async getMyProfileFromUser(user: User): Promise<User> {
    return await getRepository(User).createQueryBuilder().select().where('phoneNumber = :phoneNumber', { phoneNumber: user.phoneNumber }).getOne();
  }

  async getOtherProfileFromUser(phoneNumber: string): Promise<User> {
    return await getRepository(User).createQueryBuilder().select().where('phoneNumber = :phoneNumber', { phoneNumber: phoneNumber }).getOne();
  }
}
