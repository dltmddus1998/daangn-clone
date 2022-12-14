import { ParseIntPipe, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { JoinUserDto } from './dto/joinUser.dto';
import { InputNumberValidationPipe } from './validations/inputNumber.pipe';
import { PhoneNumberValidationPipe } from './validations/phoneNumber.pipe';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { LoginUserDto } from './dto/loginUser.dto';
import { ProfileUserDto } from './dto/profile.dto';
import { ProfileInputValidationPipe } from './validations/profile.pipe';
import { JwtAuthGuard } from './guards/jwtAuth.guard';
import { GetUser } from './validations/getUser.decorator';
import { MyLocationDto } from './dto/mylocation.dto';
import { Location } from './entities/location.entity';
import { DeleteTownDto } from './dto/deleteTown.dto';
import { getRepository } from 'typeorm';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  // 내 위치에서 가까운 주변 동네 불러오기
  @Query(() => [String])
  getAroundTownList(@Args('myLocationDto') myLocationDto: MyLocationDto): Promise<string[]> {
    return this.userService.getAroundTownList(myLocationDto);
  }

  // 동네 검색
  @Query(() => [String])
  getSearchTownList(@Args('area') area: string): Promise<string[]> {
    return this.userService.getSearchTownList(area);
  }

  // 회원가입
  @Mutation(() => String)
  @UsePipes(ValidationPipe)
  join(@Args('joinUserDto') joinUserDto: JoinUserDto): Promise<string> {
    return this.userService.join(joinUserDto);
  }

  // 로그인
  @Query(() => String)
  @UsePipes(ValidationPipe)
  login(@Args('loginUserDto') loginUserDto: LoginUserDto): Promise<string> {
    return this.userService.login(loginUserDto);
  }

  // 인증번호 sms 보내기
  @Mutation(() => String)
  sendSMS(@Args('phoneNumber', PhoneNumberValidationPipe) phoneNumber: string): Promise<string> {
    return this.userService.sendSMS(phoneNumber);
  }

  // 인증번호 확인
  @Query(() => String)
  checkSMS(@Args('phoneNumber', PhoneNumberValidationPipe) phoneNumber: string, @Args('inputNumber', InputNumberValidationPipe) inputNumber: string): Promise<string> {
    return this.userService.checkSMS(phoneNumber, inputNumber);
  }

  // 프로필 설정
  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  setProfile(@GetUser('phoneNumber') phoneNumber: string, @Args('profileUserDto', ProfileInputValidationPipe) profileUserDto: ProfileUserDto): Promise<User> {
    return this.userService.setProfile(phoneNumber, profileUserDto);
  }

  // 설정된 동네 목록 불러오기
  @Query(() => [Location])
  @UseGuards(JwtAuthGuard)
  getMyTownList(@GetUser() user: User): Promise<Location[]> {
    return this.userService.getMyTownList(user);
  }

  // 동네 선택 변경
  @Mutation(() => [Location])
  @UseGuards(JwtAuthGuard)
  updateTownSelection(@GetUser() user: User, @Args('eupMyeonDong') eupMyeonDong: string): Promise<Location[]> {
    return this.userService.updateTownSelection(user, eupMyeonDong);
  }

  // 동네 추가
  @Mutation(() => [Location])
  @UseGuards(JwtAuthGuard)
  addTown(@GetUser() user: User, @Args('area') area: string): Promise<Location[]> {
    return this.userService.addTown(user, area);
  }

  // 동네 삭제
  @Mutation(() => [Location])
  @UseGuards(JwtAuthGuard)
  deleteTown(@GetUser() user: User, @Args('deleteTownDto') deleteTownDto: DeleteTownDto): Promise<Location[]> {
    return this.userService.deleteTown(user, deleteTownDto);
  }

  // 동네 인증
  @Mutation(() => String)
  @UseGuards(JwtAuthGuard)
  setTownCertification(@GetUser() user: User, @Args('myLocationDto') myLocationDto: MyLocationDto): Promise<string> {
    return this.userService.setTownCertification(user, myLocationDto);
  }

  // 동네 범위 변경
  @Mutation(() => String)
  @UseGuards(JwtAuthGuard)
  setTownRange(@GetUser() user: User, @Args('townRange', ParseIntPipe) townRange: number): Promise<string> {
    return this.userService.setTownRange(user, townRange);
  }

  // 동네 범위에 따른 동네 개수
  @Query(() => Number)
  @UseGuards(JwtAuthGuard)
  async getTownCountByTownRange(@GetUser() user: User, @Args('townRange', ParseIntPipe) townRange: number): Promise<number> {
    const location = await getRepository(Location).findOne({ where: { user: user.phoneNumber, isSelected: true } });
    return this.userService.getTownCountByTownRange(user, location, townRange);
  }

  // 동네 범위에 따른 동네 목록
  @Query(() => [String])
  @UseGuards(JwtAuthGuard)
  async getTownListByTownRange(@GetUser() user: User, @Args('townRange', ParseIntPipe) townRange: number): Promise<string[]> {
    const location = await getRepository(Location).findOne({ where: { user: user.phoneNumber, isSelected: true } });
    return this.userService.getTownListByTownRange(user, location, townRange);
  }
}
