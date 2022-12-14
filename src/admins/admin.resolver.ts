import { User } from './../users/entities/user.entity';
import { SearchWorkLogsDto } from './dto/searchWorkLogs.dto';
import { UseGuards, UsePipes, ValidationPipe, ParseIntPipe } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ChatComplaints } from 'src/chats/entities/chatComplaints.entity';
import { UserComplaints } from 'src/chats/entities/userComplaints.entity';
import { PostComplaints } from 'src/posts/entities/postComplaints.entity';
import { AdminService } from './admin.service';
import { Roles } from './decorators/role.decorator';
import { AdminDto } from './dto/admin.dto';
import { LoginAdminDto } from './dto/loginAdmin.dto';
import { SearchComplaintDto } from './dto/searchComplaint.dto';
import { Admin } from './entities/admin.entity';
import { JwtAdminAuthGuard } from './guards/jwtAdminAuth.guard';
import { RolesGuard } from './guards/roles.guard';
import { RoleType } from './models/role.enum';
import { AuthorityInputValidationPipe } from './pipes/authority.pipe';
import { WorkLogs } from './entities/workLogs.entity';
import { GetUser } from 'src/users/validations/getUser.decorator';

@Resolver(() => Admin)
export class AdminResolver {
  constructor(private readonly adminService: AdminService) {}

  // 관리자 로그인
  @Query(() => String)
  @UsePipes(ValidationPipe)
  loginAdmin(@Args('loginAdminDto') loginAdminDto: LoginAdminDto): Promise<string> {
    return this.adminService.loginAdmin(loginAdminDto);
  }

  // 관리자 계정 생성
  @Mutation(() => Admin)
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAdminAuthGuard, RolesGuard)
  @Roles(RoleType.ACCOUNT_CREATE)
  createAdmin(@Args('adminDto', AuthorityInputValidationPipe) adminDto: AdminDto): Promise<Admin> {
    return this.adminService.createAdmin(adminDto);
  }

  // 관라자 계정 수정
  @Mutation(() => Admin)
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAdminAuthGuard, RolesGuard)
  @Roles(RoleType.ACCOUNT_UPDATE)
  updateAdmin(@Args('adminDto', AuthorityInputValidationPipe) adminDto: AdminDto): Promise<Admin> {
    return this.adminService.updateAdmin(adminDto);
  }

  // 게시글 신고 목록 조회 및 검색
  @Query(() => [PostComplaints])
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAdminAuthGuard, RolesGuard)
  @Roles(RoleType.READ)
  getPostComplaints(@Args('searchComplaintDto') searchComplaintDto: SearchComplaintDto): Promise<PostComplaints[]> {
    return this.adminService.getPostComplaints(searchComplaintDto);
  }

  // 채팅 신고 목록 조회 및 검색
  @Query(() => [ChatComplaints])
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAdminAuthGuard, RolesGuard)
  @Roles(RoleType.READ)
  getChatComplaints(@Args('searchComplaintDto') searchComplaintDto: SearchComplaintDto): Promise<ChatComplaints[]> {
    return this.adminService.getChatComplaints(searchComplaintDto);
  }

  // 유저 신고 목록 조회 및 검색
  @Query(() => [UserComplaints])
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAdminAuthGuard, RolesGuard)
  @Roles(RoleType.READ)
  getUserComplaints(@Args('searchComplaintDto') searchComplaintDto: SearchComplaintDto): Promise<UserComplaints[]> {
    return this.adminService.getUserComplaints(searchComplaintDto);
  }

  // 게시글 신고 검토
  @Mutation(() => PostComplaints)
  @UseGuards(JwtAdminAuthGuard, RolesGuard)
  @Roles(RoleType.WRITE)
  examinePostReport(@GetUser() admin: Admin, @Args('complaintId', ParseIntPipe) complaintId: number): Promise<PostComplaints> {
    return this.adminService.examinePostReport(admin, complaintId);
  }

  // 유저 신고 검토
  @Mutation(() => UserComplaints)
  @UseGuards(JwtAdminAuthGuard, RolesGuard)
  @Roles(RoleType.WRITE)
  examineUserReport(@GetUser() admin: Admin, @Args('complaintId', ParseIntPipe) complaintId: number): Promise<UserComplaints> {
    return this.adminService.examineUserReport(admin, complaintId);
  }

  // 채팅 신고 검토
  @Mutation(() => ChatComplaints)
  @UseGuards(JwtAdminAuthGuard, RolesGuard)
  @Roles(RoleType.WRITE)
  examineChatReport(@GetUser() admin: Admin, @Args('complaintId', ParseIntPipe) complaintId: number): Promise<ChatComplaints> {
    return this.adminService.examineChatReport(admin, complaintId);
  }

  // 게시글 신고 검토 완료 허용 후 processState 4번 혹은 5번으로 처리
  @Mutation(() => PostComplaints)
  @UseGuards(JwtAdminAuthGuard, RolesGuard)
  @Roles(RoleType.WRITE, RoleType.READ)
  dealPostReport(@GetUser() admin: Admin, @Args('complaintId', ParseIntPipe) complaintId: number): Promise<PostComplaints> {
    return this.adminService.dealPostReport(admin, complaintId);
  }

  // 유저 신고 검토 완료 허용 후 processState 4번 혹은 5번으로 처리
  @Mutation(() => UserComplaints)
  @UseGuards(JwtAdminAuthGuard, RolesGuard)
  @Roles(RoleType.READ, RoleType.WRITE)
  dealUserReport(@GetUser() admin: Admin, @Args('complaintId', ParseIntPipe) complaintId: number): Promise<UserComplaints> {
    return this.adminService.dealUserReport(admin, complaintId);
  }

  // 채팅 신고 검토 완료 허용 후 processState 4번 혹은 5번으로 처리
  @Mutation(() => ChatComplaints)
  @UseGuards(JwtAdminAuthGuard, RolesGuard)
  @Roles(RoleType.READ, RoleType.WRITE)
  dealChatReport(@GetUser() admin: Admin, @Args('complaintId', ParseIntPipe) complaintId: number): Promise<ChatComplaints> {
    return this.adminService.dealChatReport(admin, complaintId);
  }

  // 이용정지 해제
  @Mutation(() => User)
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAdminAuthGuard, RolesGuard)
  @Roles(RoleType.WRITE, RoleType.READ)
  clearSuspenseOfUse(@Args('userName') userName: string): Promise<User> {
    return this.adminService.clearSuspenseOfUse(userName);
  }

  // 이용정지자 목록 조회
  @Query(() => [User])
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAdminAuthGuard, RolesGuard)
  @Roles(RoleType.READ)
  getUsersInSuspensionOfUse(@Args('page') page: number, @Args('perPage') perPage: number): Promise<User[]> {
    return this.adminService.getUsersInSuspensionOfUse(page, perPage);
  }

  // 현재까지 관리자 작업 로그 조회하기
  @Query(() => [WorkLogs])
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAdminAuthGuard, RolesGuard)
  @Roles(RoleType.READ)
  getWorkLogsList(@Args('searchWorkLogsDto') searchWorkLogsDto: SearchWorkLogsDto): Promise<WorkLogs[]> {
    return this.adminService.getWorkLogsList(searchWorkLogsDto);
  }
}
