import { User } from 'src/users/user.entity';
import { ChatComplaints } from 'src/chats/chatComplaints.entity';
import { UserComplaints } from 'src/chats/userComplaints.entity';
import { ChatComplaintsRepository } from './../chats/repositories/chatComplaints.repository';
import { UserComplaintsRepository } from './../users/repositories/userComplaints.repository';
import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminRepository } from './repositories/admin.repository';
import { LoginAdminDto } from './dto/loginAdmin.dto';
import * as bcrypt from 'bcrypt';
import { AdminDto } from './dto/admin.dto';
import { Admin } from './entities/admin.entity';
import { AdminAuthorityRepository } from './repositories/adminAuthority.repository';
import { EntityManager, getConnection, getRepository } from 'typeorm';
import { SearchPostComplaintDto } from './dto/searchPostComplaint.dto';
import { PostComplaints } from 'src/posts/postComplaints.entity';
import { PostComplaintsRepository } from 'src/posts/repositories/postComplaint.repository';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminRepository)
    private adminRepository: AdminRepository,
    @InjectRepository(AdminAuthorityRepository)
    private adminAuthorityRepository: AdminAuthorityRepository,
    @InjectRepository(PostComplaintsRepository)
    private postComplaintsRepository: PostComplaintsRepository,
    @InjectRepository(UserComplaintsRepository)
    private userComplaintsRepository: UserComplaintsRepository,
    @InjectRepository(ChatComplaintsRepository)
    private chatComplaintsRepository: ChatComplaintsRepository,
    private readonly jwtService: JwtService,
  ) {}

  async loginAdmin(loginAdminDto: LoginAdminDto): Promise<string> {
    /**
     * 관리자 로그인
     *
     * @author 허정연(golgol22)
     * @param {adminId, adminPw} 관리자아이다, 관리자 패스워드
     * @return {accessToken} 로그인되었을 때 토큰 발급
     * @throws {UnauthorizedException} 일치하는 관리자 정보를 찾지 못했을 때 예외처리
     */
    const { adminId, adminPw } = loginAdminDto;
    const found = await this.adminRepository.findOne(adminId);
    if (!found) {
      throw new UnauthorizedException('아이디나 패스워드가 일치하지 않습니다.');
    }
    const validatePassword = await bcrypt.compare(adminPw, found.adminPw);
    if (!validatePassword) {
      throw new UnauthorizedException('아이디나 패스워드가 일치하지 않습니다.');
    }
    const payload = { adminId };
    const accessToken = this.jwtService.sign(payload);
    return accessToken;
  }

  async createAdmin(adminDto: AdminDto): Promise<Admin> {
    /**
     * 관리자 계정 생성
     *
     * @author 허정연(golgol22)
     * @param {adminId, adminPw, authorities} 관리자아이다, 관리자 패스워드, 가지게 될 권한
     * @return {Admin} 생성된 관리자 계정
     * @throws {ConflictException} 생성할 아이디가 이미 사용 중일 때 예외처리
     */
    const { adminId, adminPw, authorities } = adminDto;
    const found = await this.adminRepository.findOne(adminId);
    if (found) {
      throw new ConflictException('사용중인 아이디입니다.');
    }
    const hashedAdminPw = await bcrypt.hash(adminPw, 10);
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        await this.adminRepository.createAdmin(manager, adminId, hashedAdminPw);
        await this.adminAuthorityRepository.addAdminAuthorities(manager, adminId, authorities);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('관리자 계정 생성에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return await this.adminRepository.getAdminById(adminId);
  }

  async updateAdmin(adminDto: AdminDto): Promise<Admin> {
    /**
     * 관리자 계정 수정
     *
     * @author 허정연(golgol22)
     * @param {adminId, adminPw, authorities} 관리자아이다, 관리자 패스워드, 가지게 될 권한
     * @return {Admin} 수정된 관리자 계정
     * @throws {NotFoundException} 수정하려고 하는 계정이 없는 아이디일 때 예외처리
     */
    const { adminId, adminPw, authorities } = adminDto;
    const found = await this.adminRepository.findOne(adminId);
    if (!found) {
      throw new NotFoundException('없는 아이디입니다.');
    }
    const hashedAdminPw = await bcrypt.hash(adminPw, 10);
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        await this.adminRepository.updateAdmin(manager, adminId, hashedAdminPw);
        await this.adminAuthorityRepository.deleteAdminAuthorities(manager, adminId);
        await this.adminAuthorityRepository.addAdminAuthorities(manager, adminId, authorities);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('관리자 계정 수정에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return await this.adminRepository.getAdminById(adminId);
  }

  async getPostComplaints(searchPostComplaintDto: SearchPostComplaintDto): Promise<PostComplaints[]> {
    return await this.postComplaintsRepository.getPostComplaints(searchPostComplaintDto);
  }

  // 2. "신고 검토 중"으로 업데이트
  async examinePostReport(complaintId: number): Promise<PostComplaints> {
    /**
     * 게시글 신고 검토
     *
     * @author 이승연(dltmddus1998)
     * @param {complaintId}
     * @return
     * @throws
     */
    const postComplaint = await this.postComplaintsRepository.getPostComplaintById(complaintId);
    if (!postComplaint) {
      throw new NotFoundException('존재하지 않는 신고 내용입니다.');
    }
    if (postComplaint.processState.processStateId === 2) {
      throw new BadRequestException('이미 신고 검토 중인 게시글입니다.');
    }
    await this.postComplaintsRepository.examinePostReport(complaintId);
    return await this.postComplaintsRepository.getPostComplaintById(complaintId);
  }

  async examineUserReport(complaintId: number): Promise<UserComplaints> {
    /**
     * 유저 신고 검토
     *
     * @author 이승연(dltmddus1998)
     * @param {complaintId}
     * @return {UserComplaints}
     * @throws {NotFoundException} 존재하지 않는 신고
     * @throws {BadRequestException} 이미 신고 검토 중
     */
    const userComplaint = await this.userComplaintsRepository.getUserComplaintById(complaintId);
    if (!userComplaint) {
      throw new NotFoundException('존재하지 않는 신고 내용입니다.');
    }
    if (userComplaint.processState.processStateId === 2) {
      throw new BadRequestException('이미 신고 검토 중인 유저입니다.');
    }
    await this.userComplaintsRepository.examineUserReport(complaintId);
    return await this.userComplaintsRepository.getUserComplaintById(complaintId);
  }

  async examineChatReport(complaintId: number) {
    /**
     * 채팅 신고 검토
     *
     * @author 이승연(dltmddus1998)
     * @param {complaintId}
     * @return {ChatComplaints}
     * @throws {NotFoundException} 존재하지 않는 신고
     * @throws {BadRequestException} 이미 신고 검토 중
     */
    const chatComplaint = await this.chatComplaintsRepository.getChatComplaintById(complaintId);
    if (!chatComplaint) {
      throw new NotFoundException('존재하지 않는 신고 내용입니다.');
    }
    if (chatComplaint.processState.processStateId === 2) {
      throw new BadRequestException('이미 신고 검토 중인 유저입니다.');
    }
    await this.chatComplaintsRepository.examineChatReport(complaintId);
    return this.chatComplaintsRepository.getChatComplaintById(complaintId);
  }

  // 3. 신고 검토 완료 허용 후 -> processState 4번으로 처리
  async dealPostReportBeforeThreeTimes(complaintId: number): Promise<PostComplaints> {
    /**
     * 게시글 신고 검토 완료 허용 & 매너지수 감소 및 블라인드 처리 이후 신고 검토 완료 처리
     *
     * @author 이승연(dltmddus1998)
     * @param {complaintId}
     * @return
     * @throws {NotFoundException}
     */
    const postComplaint = await this.postComplaintsRepository.getPostComplaintById(complaintId);
    if (!postComplaint) {
      throw new NotFoundException('존재하지 않는 신고 내용입니다.');
    }
    await getConnection().transaction(async (manager: EntityManager) => {
      await this.postComplaintsRepository.completeReportHandlingOfPost(manager, complaintId);
      const user = await getRepository(User).findOne(postComplaint.post.user.phoneNumber);
      await this.userComplaintsRepository.declineMannerTemp(manager, user.userName);
      await this.postComplaintsRepository.updateBlindState(manager, postComplaint.post.postId);
      await this.postComplaintsRepository.afterCompleteReportHandlingOfPost(manager, complaintId);
    });
    return await this.postComplaintsRepository.getPostComplaintById(complaintId);
  }

  async dealUserReportBeforeThreeTimes(complaintId: number) {
    /**
     * 유저 신고 검토 완료 허용 & 매너지수 감소 및 블라인드 처리 이후 신고 검토 완료 처리
     *
     * @author 이승연(dltmddus1998)
     * @param {}
     * @return {}
     * @throws {}
     *
     */
  }
}
