import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminResolver } from './admin.resolver';
import { AdminRepository } from './repositories/admin.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import * as config from 'config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwtAuth.guard';
import { AdminAuthorityRepository } from './repositories/adminAuthority.repository';
import { PostComplaintsRepository } from 'src/posts/repositories/postComplaint.repository';
import { UserComplaintsRepository } from 'src/users/repositories/userComplaints.repository';
import { ChatComplaintsRepository } from 'src/chats/repositories/chatComplaints.repository';

const jwtConfig: any = config.get('jwt');
const passportConfig: any = config.get('passport');

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: passportConfig.defaultStrategy,
      session: false,
    }),
    JwtModule.register({
      secret: jwtConfig.secret,
      signOptions: {
        expiresIn: jwtConfig.expiresIn,
      },
    }),
    TypeOrmModule.forFeature([AdminRepository, AdminAuthorityRepository, PostComplaintsRepository, UserComplaintsRepository, ChatComplaintsRepository]),
  ],
  providers: [AdminResolver, AdminService, JwtStrategy, JwtAuthGuard],
})
export class AdminModule {}
