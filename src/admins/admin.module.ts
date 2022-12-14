import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminResolver } from './admin.resolver';
import { AdminRepository } from './repositories/admin.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import * as config from 'config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAdminAuthGuard } from './guards/jwtAdminAuth.guard';
import { AdminAuthorityRepository } from './repositories/adminAuthority.repository';
import { PostComplaintsRepository } from 'src/posts/repositories/postComplaint.repository';
import { ChatComplaintsRepository } from 'src/chats/repositories/chatComplaints.repository';
import { UserComplaintsRepository } from 'src/chats/repositories/userComplaints.repository';
import { AdminWorkLogsRepository } from './repositories/adminWorkLogs.repository';

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
    TypeOrmModule.forFeature([AdminRepository, AdminAuthorityRepository, PostComplaintsRepository, ChatComplaintsRepository, UserComplaintsRepository, AdminWorkLogsRepository]),
  ],
  providers: [AdminResolver, AdminService, JwtStrategy, JwtAdminAuthGuard],
})
export class AdminModule {}
