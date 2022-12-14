import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UserRepository } from '../repositories/user.repository';
import * as config from 'config';
import { User } from '../entities/user.entity';
import { Payload } from '../models/payload.model';

const jwtConfig: any = config.get('jwt');

/**
 * payload에 저장된 값을 기반으로 user 정보 조회
 *
 * @author 허정연(golgol22)
 * @return {user} payload에 저장된 정보로 조회한 유저 정보를 jwtAuth.guards에 반환
 * @throws {UnauthorizedException} payload에 저장된 정보로 조회했을 때 user 정보가 없을 경우 예외처리
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConfig.secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: Payload): Promise<User> {
    const { phoneNumber } = payload;
    const user: User = await this.userRepository.findOne({ where: { phoneNumber: phoneNumber } });
    if (!user) {
      throw new UnauthorizedException('user를 찾을 수 없습니다.');
    }
    return user;
  }
}
