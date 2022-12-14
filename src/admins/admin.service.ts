import { User } from './../users/entities/user.entity';
import { SearchWorkLogsDto } from './dto/searchWorkLogs.dto';
import { AdminWorkLogsRepository } from './repositories/adminWorkLogs.repository';
import { WorkLogs } from 'src/admins/entities/workLogs.entity';
import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminRepository } from './repositories/admin.repository';
import { LoginAdminDto } from './dto/loginAdmin.dto';
import * as bcrypt from 'bcrypt';
import { AdminDto } from './dto/admin.dto';
import { Admin } from './entities/admin.entity';
import { AdminAuthorityRepository } from './repositories/adminAuthority.repository';
import { EntityManager, getConnection, getRepository } from 'typeorm';
import { PostComplaints } from 'src/posts/entities/postComplaints.entity';
import { PostComplaintsRepository } from 'src/posts/repositories/postComplaint.repository';
import { SearchComplaintDto } from './dto/searchComplaint.dto';
import { ChatComplaints } from 'src/chats/entities/chatComplaints.entity';
import { ChatComplaintsRepository } from 'src/chats/repositories/chatComplaints.repository';
import { UserComplaints } from 'src/chats/entities/userComplaints.entity';
import { UserComplaintsRepository } from 'src/chats/repositories/userComplaints.repository';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminRepository)
    private adminRepository: AdminRepository,
    @InjectRepository(AdminAuthorityRepository)
    private adminAuthorityRepository: AdminAuthorityRepository,
    @InjectRepository(PostComplaintsRepository)
    private postComplaintsRepository: PostComplaintsRepository,
    @InjectRepository(ChatComplaintsRepository)
    private chatComplaintsRepository: ChatComplaintsRepository,
    @InjectRepository(UserComplaintsRepository)
    private userComplaintsRepository: UserComplaintsRepository,
    @InjectRepository(AdminWorkLogsRepository)
    private adminWorkLogsRepository: AdminWorkLogsRepository,
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

  async getPostComplaints(searchComplaintDto: SearchComplaintDto): Promise<PostComplaints[]> {
    /**
     * 게시글 신고목록 조회 및 검색
     *
     * @author 허정연(golgol22)
     * @param { complaintReason, processState, memo, perPage, page } 신고 이유, 처리상태, 메모, 페이지 당 보여줄 개수, 페이지
     * @return {PostComplaints[]} 게시글 신고목록
     */
    return await this.postComplaintsRepository.getPostComplaints(searchComplaintDto);
  }

  async getChatComplaints(searchComplaintDto: SearchComplaintDto): Promise<ChatComplaints[]> {
    /**
     * 채팅 신고목록 조회 및 검색
     *
     * @author 허정연(golgol22)
     * @param { complaintReason, processState, memo, perPage, page } 신고 이유, 처리상태, 메모, 페이지 당 보여줄 개수, 페이지
     * @return {ChatComplaints[]} 채팅 신고목록
     */
    return await this.chatComplaintsRepository.getChatComplaints(searchComplaintDto);
  }

  async getUserComplaints(searchComplaintDto: SearchComplaintDto): Promise<UserComplaints[]> {
    /**
     * 유저 신고목록 조회 및 검색
     *
     * @author 허정연(golgol22)
     * @param { complaintReason, processState, memo, perPage, page } 신고 이유, 처리상태, 메모, 페이지 당 보여줄 개수, 페이지
     * @return {ChatComplaints[]} 채팅 신고목록
     */
    return await this.userComplaintsRepository.getUserComplaints(searchComplaintDto);
  }

  // 1. "신고 검토 중"으로 업데이트
  async examinePostReport(admin: Admin, complaintId: number): Promise<PostComplaints> {
    /**
     * 게시글 신고 검토
     *
     * @author 이승연(dltmddus1998)
     * @param {complaintId}
     * @return {PostComplaints}
     * @throws {NotFoundException} 존재하지 않는 신고
     * @throws {BadRequestException} 이미 신고 검토 중
     * @throws {InternalServerErrorException} 게시글 신고 검토 처리 실패
     */
    const postComplaint = await this.postComplaintsRepository.getPostComplaintById(complaintId);
    if (!postComplaint) {
      throw new NotFoundException('존재하지 않는 신고 내용입니다.');
    }
    if (postComplaint.processState.processStateId === 2) {
      throw new BadRequestException('이미 신고 검토 중인 게시글입니다.');
    }
    if (postComplaint.processState.processStateId !== 1) {
      throw new BadRequestException('잘못된 요청입니다.');
    }
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        await this.postComplaintsRepository.putWorkLogExamine(manager, admin);
        await this.postComplaintsRepository.examinePostReport(manager, complaintId);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('게시글 신고 검토 처리에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return await this.postComplaintsRepository.getPostComplaintById(complaintId);
  }

  async examineUserReport(admin: Admin, complaintId: number): Promise<UserComplaints> {
    /**
     * 유저 신고 검토
     *
     * @author 이승연(dltmddus1998)
     * @param {complaintId}
     * @return {UserComplaints}
     * @throws {NotFoundException} 존재하지 않는 신고
     * @throws {BadRequestException} 이미 신고 검토 중
     * @throws {InternalServerErrorException} 유저 신고 검토 처리 실패
     */
    const userComplaint = await this.userComplaintsRepository.getUserComplaintById(complaintId);
    if (!userComplaint) {
      throw new NotFoundException('존재하지 않는 신고 내용입니다.');
    }
    if (userComplaint.processState.processStateId === 2) {
      throw new BadRequestException('이미 신고 검토 중인 유저입니다.');
    }
    if (userComplaint.processState.processStateId !== 1) {
      throw new BadRequestException('잘못된 요청입니다.');
    }
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        await this.userComplaintsRepository.putWorkLogExamine(manager, admin);
        await this.userComplaintsRepository.examineUserReport(manager, complaintId);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('유저 신고 검토 처리에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return await this.userComplaintsRepository.getUserComplaintById(complaintId);
  }

  async examineChatReport(admin: Admin, complaintId: number) {
    /**
     * 채팅 신고 검토
     *
     * @author 이승연(dltmddus1998)
     * @param {complaintId}
     * @return {ChatComplaints}
     * @throws {NotFoundException} 존재하지 않는 신고
     * @throws {BadRequestException} 이미 신고 검토 중
     * @throws {InternalServerErrorException} 신고 검토 완료 실패
     */
    const chatComplaint = await this.chatComplaintsRepository.getChatComplaintById(complaintId);
    if (!chatComplaint) {
      throw new NotFoundException('존재하지 않는 신고 내용입니다.');
    }
    if (chatComplaint.processState.processStateId === 2) {
      console.log(chatComplaint.processState);
      throw new BadRequestException('이미 신고 검토 중인 유저입니다.');
    }
    if (chatComplaint.processState.processStateId !== 1) {
      throw new BadRequestException('잘못된 요청입니다.');
    }
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        await this.chatComplaintsRepository.putWorkLogExamine(manager, admin);
        await this.chatComplaintsRepository.examineChatReport(manager, complaintId);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('채팅 신고 검토 완료에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return this.chatComplaintsRepository.getChatComplaintById(complaintId);
  }

  // 2. 신고 검토 완료 허용 후 -> processState 4번 or 5번으로 처리
  async dealPostReport(admin: Admin, complaintId: number): Promise<PostComplaints> {
    /**
     * 1) 게시글 신고 검토 완료 허용 & 매너지수 감소 및 블라인드 처리 이후 신고 검토 완료 처리 (과거 신고 횟수가 3번 미만인 경우)
     * 2) 게시글 신고 검토 완료 허용 & 유저 이용정지 처리 및 블라인드 처리 이후 신고 검토 완료 처리 (과거 신고 횟수가 3번인 경우)
     *
     * @author 이승연(dltmddus1998)
     * @param {complaintId}
     * @return {PostComplaints}
     * @throws {NotFoundException} 존재하지 않는 신고
     * @throws {InternalServerErrorException} 신고 검토 완료 실패
     */
    const postComplaint = await this.postComplaintsRepository.getPostComplaintById(complaintId);
    if (!postComplaint) {
      throw new NotFoundException('존재하지 않는 신고 내용입니다.');
    }
    if (postComplaint.processState.processStateId === 4 || postComplaint.processState.processStateId === 5) {
      throw new BadRequestException('이미 신고 검토 완료 처리된 게시글입니다.');
    }
    if (postComplaint.processState.processStateId !== 2) {
      throw new BadRequestException('잘못된 요청입니다.');
    }
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        await this.postComplaintsRepository.completeReportHandlingOfPost(manager, complaintId);
        if (postComplaint.post.user.reportedTimes < 3 && postComplaint.post.user.reportedTimes >= 0) {
          await this.userComplaintsRepository.declineMannerTemp(manager, postComplaint.post.user.userName);
          await this.userComplaintsRepository.updateUserReportedTimes(manager, postComplaint.post.user.phoneNumber);
          await this.postComplaintsRepository.putWorkLogCompleteBlind(manager, admin);
          await this.postComplaintsRepository.afterCompleteReportHandlingOfPost(manager, complaintId);
        } else if (postComplaint.post.user.reportedTimes === 3) {
          await this.userComplaintsRepository.updateUserSuspensionOfUse(manager, postComplaint.post.user.phoneNumber);
          await this.postComplaintsRepository.putWorkLogCompleteSuspensionOfUse(manager, admin);
          await this.postComplaintsRepository.afterCompleteReportHandlingOfPostOverThird(manager, complaintId);
        }
        await this.postComplaintsRepository.updateBlindState(manager, complaintId);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('게시글 신고 검토 완료에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return await this.postComplaintsRepository.getPostComplaintById(complaintId);
  }

  async dealUserReport(admin: Admin, complaintId: number): Promise<UserComplaints> {
    /**
     * 1) 유저 신고 검토 완료 허용 & 매너지수 감소 및 블라인드 처리 이후 신고 검토 완료 처리 (과거 신고 횟수가 3번 미만인 경우)
     * 2) 유저 신고 검토 완료 허용 & 유저 이용정지 처리 및 블라인드 처리 이후 신고 검토 완료 처리 (과거 신고 횟수가 3번인 경우)
     *
     * @author 이승연(dltmddus1998)
     * @param {complaintId}
     * @return {UserComplaints}
     * @throws {NotFoundException} 존재하지 않는 신고
     * @throws {InternalServerErrorException} 신고 검토 완료 실패
     */
    const userComplaint = await this.userComplaintsRepository.getUserComplaintById(complaintId);
    if (!userComplaint) {
      throw new NotFoundException('존재하지 않는 신고 내용입니다.');
    }
    if (userComplaint.processState.processStateId === 4 || userComplaint.processState.processStateId === 5) {
      throw new BadRequestException('이미 신고 검토 완료 처리된 유저입니다.');
    }
    if (userComplaint.processState.processStateId !== 2) {
      throw new BadRequestException('잘못된 요청입니다.');
    }
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        await this.userComplaintsRepository.completeReportHandlingOfUser(manager, complaintId);
        if (userComplaint.subjectUser.reportedTimes < 3 && userComplaint.subjectUser.reportedTimes >= 0) {
          await this.userComplaintsRepository.declineMannerTemp(manager, userComplaint.subjectUser.userName);
          await this.userComplaintsRepository.updateUserReportedTimes(manager, userComplaint.subjectUser.phoneNumber);
          console.log(admin);
          await this.userComplaintsRepository.putWorkLogCompleteBlind(manager, admin);
          await this.userComplaintsRepository.afterCompleteReportHandlingOfUser(manager, complaintId);
        } else if (userComplaint.subjectUser.reportedTimes === 3) {
          await this.userComplaintsRepository.updateUserSuspensionOfUse(manager, userComplaint.subjectUser.phoneNumber);
          await this.userComplaintsRepository.putWorkLogCompleteSuspensionOfUse(manager, admin);
          await this.userComplaintsRepository.afterCompleteHandlingOfUserOverThird(manager, complaintId);
        }
        await this.userComplaintsRepository.updateBlindState(manager, complaintId);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('유저 신고 검토 완료에 실패하였습니다. 잠시후 다시 시도해주세요');
      });
    return await this.userComplaintsRepository.getUserComplaintById(complaintId);
  }

  async dealChatReport(admin: Admin, complaintId: number): Promise<ChatComplaints> {
    /**
     * 1) 채팅 신고 검토 완료 허용 & 매너지수 감소 및 블라인드 처리 이후 신고 검토 완료 처리 (과거 신고 횟수가 3번 미만인 경우)
     * 2) 채팅 신고 검토 완료 허용 & 유저 이용정지 처리 및 블라인드 처리 이후 신고 검토 완료 처리 (과거 신고 횟수가 3번인 경우)
     *
     * @author 이승연(dltmddus1998)
     * @param {complaintId}
     * @return {ChatComplaints}
     * @throws {NotFoundException} 존재하지 않는 신고
     * @throws {InternalServerErrorException} 신고 검토 완료 실패
     */
    const chatComplaint = await this.chatComplaintsRepository.getChatComplaintById(complaintId);
    if (!chatComplaint) {
      throw new NotFoundException('존재하지 않는 신고 내용입니다.');
    }
    if (chatComplaint.processState.processStateId === 4 || chatComplaint.processState.processStateId === 5) {
      throw new BadRequestException('이미 신고 검토 완료 처리된 채팅입니다.');
    }
    if (chatComplaint.processState.processStateId !== 2) {
      console.log(chatComplaint.processState);
      throw new BadRequestException('잘못된 요청입니다.');
    }
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        await this.chatComplaintsRepository.completeReportHandlingOfChat(manager, complaintId);
        if (chatComplaint.chat.user.reportedTimes < 3 && chatComplaint.chat.user.reportedTimes >= 0) {
          await this.userComplaintsRepository.declineMannerTemp(manager, chatComplaint.user.phoneNumber);
          await this.userComplaintsRepository.updateUserReportedTimes(manager, chatComplaint.chat.user.phoneNumber);
          await this.chatComplaintsRepository.putWorkLogCompleteBlind(manager, admin);
          await this.chatComplaintsRepository.afterCompleteReportHandlingOfChat(manager, complaintId);
        } else if (chatComplaint.chat.user.reportedTimes === 3) {
          console.log(chatComplaint.chat.user.reportedTimes);
          await this.userComplaintsRepository.updateUserSuspensionOfUse(manager, chatComplaint.user.phoneNumber);
          await this.chatComplaintsRepository.putWorkLogCompleteSuspensionOfUse(manager, admin);
          await this.chatComplaintsRepository.afterCompleteReportHandlingOfChatOverThird(manager, complaintId);
        }
        await this.chatComplaintsRepository.updateBlindState(manager, complaintId);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('채팅 신고 검토 완료에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return await this.chatComplaintsRepository.getChatComplaintById(complaintId);
  }

  async clearSuspenseOfUse(userName: string): Promise<User> {
    /**
     * 이용정지 해제
     *
     * @author 이승연(dltmddus1998)
     * @params {userName} 유저 닉네임
     * @return {User} 해당 유저
     * @throws {NotFoundException} 존재하지 않는 유저
     * @throws {BadRequestException} 이용정지 처리된 유저가 아님
     */
    await this.userComplaintsRepository.clearSuspenseOfUse(userName);
    return await getRepository(User).findOne({
      where: {
        userName,
      },
    });
  }

  async getUsersInSuspensionOfUse(page: number, perPage: number): Promise<User[]> {
    /**
     * 이용정지자 목록 조회
     *
     * @author 이승연(dltmddus1998)
     * @param {page, perPage}
     * @return {User[]}
     */
    return await this.userComplaintsRepository.getUsersInSuspensionOfUse(page, perPage);
  }

  /**
   * 관리자 작업 로그 전체 조회 (게시글, 유저, 채팅 별로 검색 가능)
   *
   * @author 이승연(dltmddus1998)
   * @param {SearchWorkLogsDto} workTypes, processTypes, page, perPage
   * @return {WorkLogs[]}
   */
  async getWorkLogsList(searchWorkLogsDto: SearchWorkLogsDto): Promise<WorkLogs[]> {
    return await this.adminWorkLogsRepository.getWorkLogsList(searchWorkLogsDto);
  }
}
