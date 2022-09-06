import { Bind, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { JoinUserDto } from './dto/joinUser.dto';
import { InputNumberValidationPipe } from './validations/inputNumber.pipe';
import { PhoneNumberValidationPipe } from './validations/phoneNumber.pipe';
import { User } from './user.entity';
import { UserService } from './user.service';
import { LoginUserDto } from './dto/loginUser.dto';
import { ProfileUserDto } from './dto/profile.dto';
import { ProfileInputValidationPipe } from './validations/profile.pipe';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => String)
  @UsePipes(ValidationPipe)
  join(@Args('joinUserDto') joinUserDto: JoinUserDto): Promise<string> {
    return this.userService.join(joinUserDto);
  }

  @Query(() => String)
  @UsePipes(ValidationPipe)
  login(@Args('loginUserDto') loginUserDto: LoginUserDto): Promise<string> {
    return this.userService.login(loginUserDto);
  }

  @Mutation(() => String)
  sendSMS(@Args('phoneNumber', PhoneNumberValidationPipe) phoneNumber: string): Promise<string> {
    return this.userService.sendSMS(phoneNumber);
  }

  @Query(() => String)
  checkSMS(@Args('phoneNumber', PhoneNumberValidationPipe) phoneNumber: string, @Args('inputNumber', InputNumberValidationPipe) inputNumber: string): Promise<string> {
    return this.userService.checkSMS(phoneNumber, inputNumber);
  }

  @Mutation(() => Boolean)
  async setProfile(@Args('profileUserDto', ProfileInputValidationPipe) profileUserDto: ProfileUserDto): Promise<boolean> {
    return this.userService.setProfile(profileUserDto);
  }
}
