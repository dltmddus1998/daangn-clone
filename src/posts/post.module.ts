import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/users/user.module';
import { PostRepository } from './repositories/post.repository';
import { PostResolver } from './post.resolver';
import { PostService } from './post.service';
import { PostComplaints } from './entities/postComplaints.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostRepository, PostComplaints]), UserModule],
  providers: [PostService, PostResolver],
})
export class PostModule {}
