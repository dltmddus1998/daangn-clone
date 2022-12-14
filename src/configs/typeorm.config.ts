import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as config from 'config';
import { Category } from 'src/posts/entities/category.entity';
import { DealState } from 'src/posts/entities/dealState.entity';
import { Post } from 'src/posts/entities/post.entity';
import { TownRange } from 'src/posts/entities/townRange.entity';
import { User } from 'src/users/entities/user.entity';
import { PriceOffer } from 'src/posts/entities/priceOffer.entity';
import { ComplaintReason } from 'src/posts/entities/complaintReason.entity';
import { PostComplaints } from 'src/posts/entities/postComplaints.entity';
import { ProcessState } from 'src/posts/entities/processState.entity';
import { PostsLikeRecord } from 'src/posts/entities/postsLikeRecord.entity';
import { PostsViewRecord } from 'src/posts/entities/postsViewRecord.entity';
import { Followings } from 'src/mypage/entities/followings.entity';
import { PostImage } from 'src/posts/entities/postImage.entity';
import { PurchaseHistory } from 'src/mypage/entities/purchaseHistory.entity';
import { Location } from 'src/users/entities/location.entity';
import { ChatRoom } from 'src/chats/entities/chatRoom.entity';
import { Chat } from 'src/chats/entities/chat.entity';
import { SellerReview } from 'src/reviews/entities/sellerReview.entity';
import { MannerItem } from 'src/reviews/entities/mannerItem.entity';
import { SelectedMannerItemToSeller } from 'src/reviews/entities/selectedMannerItemToSeller.entity';
import { BuyerReview } from 'src/reviews/entities/buyerReview.entity';
import { ScoreItem } from 'src/reviews/entities/scoreItem.entity';
import { SelectedMannerItemToBuyer } from 'src/reviews/entities/selectedMannerItemToBuyer.entity';
import { Admin } from 'src/admins/entities/admin.entity';
import { AdminAuthority } from 'src/admins/entities/adminAuthority.entity';
import { UserComplaints } from 'src/chats/entities/userComplaints.entity';
import { ChatComplaints } from 'src/chats/entities/chatComplaints.entity';
import { BlockUser } from 'src/chats/entities/blockUser.entity';
import { WorkLogs } from 'src/admins/entities/workLogs.entity';
import { WorkTypes } from 'src/admins/entities/workTypes.entity';
import { ProcessTypes } from 'src/admins/entities/processTypes.entity';

const dbConfig: any = config.get('db');

export const typeORMConfig: TypeOrmModuleOptions = {
  type: dbConfig.type,
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  entities: [
    Post,
    User,
    Category,
    PriceOffer,
    DealState,
    TownRange,
    ComplaintReason,
    PostComplaints,
    ProcessState,
    PostsLikeRecord,
    PostsViewRecord,
    Followings,
    PostImage,
    PurchaseHistory,
    Location,
    ChatRoom,
    Chat,
    SellerReview,
    BuyerReview,
    ScoreItem,
    MannerItem,
    SelectedMannerItemToSeller,
    SelectedMannerItemToBuyer,
    Admin,
    AdminAuthority,
    UserComplaints,
    ChatComplaints,
    BlockUser,
    WorkLogs,
    WorkTypes,
    ProcessTypes,
  ],
  synchronize: dbConfig.synchronize,
  timezone: dbConfig.timezone,
};
