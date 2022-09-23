import { EntityRepository, getRepository, Repository } from 'typeorm';
import { Followings } from './followings.entity';
import { User } from 'src/users/user.entity';
import { Post } from 'src/posts/post.entity';
import { PurchaseHistory } from './purchaseHistory.entity';
import { PurchaseHistoryDto } from './dto/purchaseHistory.dto';

@EntityRepository(Followings)
export class MypageRepository extends Repository<Followings> {
  async updateMarketingInfo(user: User, marketingInfoAgree: boolean) {
    await getRepository(User).createQueryBuilder('User').update(User).set({ marketingInfoAgree }).where('userName = :userName', { userName: user.userName }).execute();
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
      .where('user.userName = :userName', { userName: user.userName })
      .orderBy('followings.createdAt', 'DESC')
      .offset((page - 1) * perPage)
      .limit(perPage)
      .getMany();
  }

  async getHiddenPostsList(user: User, page: number, perPage: number) {
    return await getRepository(Post)
      .createQueryBuilder('post')
      .innerJoinAndSelect('post.user', 'user')
      .where('user.userName = :userName', { userName: user.userName })
      .orderBy('post.createdAt', 'DESC')
      .offset((page - 1) * perPage)
      .limit(perPage)
      .getMany();
  }

  async buy(user: User, purchaseHistoryDto: PurchaseHistoryDto): Promise<number> {
    const { post } = purchaseHistoryDto;
    const query = await getRepository(PurchaseHistory).createQueryBuilder('PurchaseHistory').insert().into(PurchaseHistory).values({ user: user, post }).execute();
    return query.raw.insertId;
  }

  // async updateDealStateOfPost() {
  //   await getRepository(Post).createQueryBuilder().update();
  // }

  async getBuyingListOfUser(user: User, page: number, perPage: number): Promise<PurchaseHistory[]> {
    const queryBuilder = getRepository(PurchaseHistory)
      .createQueryBuilder('purchaseHistory')
      .innerJoinAndSelect('purchaseHistory.user', 'user')
      .innerJoinAndSelect('purchaseHistory.post', 'post')
      .where('user.userName = :userName', { userName: user.userName })
      .orderBy('purchaseHistory.createdAt', 'DESC')
      .offset((page - 1) * perPage)
      .limit(perPage);
    return queryBuilder.getMany();
  }

  async getSellingListOfUser(user: User, page: number, perPage: number) {
    return await getRepository(Post)
      .createQueryBuilder('post')
      .innerJoinAndSelect('post.user', 'user')
      .where('user.userName = :userName', { userName: user.userName })
      .orderBy('post.createdAt', 'DESC')
      .offset((page - 1) * perPage)
      .limit(perPage)
      .getMany();
  }

  async getWatchListOfUser(user: User, page: number, perPage: number): Promise<Post[]> {
    // 🔥 수정예정
    return await getRepository(Post)
      .createQueryBuilder('post')
      .innerJoinAndSelect('post.postsLikeRecord', 'postsLikeRecord')
      .where('postsLikeRecord.userName = :userName', { userName: user.userName })
      .orderBy('post.createdAt', 'DESC')
      .offset((page - 1) * perPage)
      .limit(perPage)
      .getMany();
  }

  async getMyProfileFromUser(user: User): Promise<User> {
    return await getRepository(User).createQueryBuilder().select().where('userName = :userName', { userName: user.userName }).getOne();
  }

  async getOtherProfileFromUser(userName: string): Promise<User> {
    return await getRepository(User).createQueryBuilder().select().where('userName = :userName', { userName }).getOne();
  }
}
