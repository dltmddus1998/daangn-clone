import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Strategy, ExtractJwt } from 'passport-jwt';
import * as config from 'config';
import { Payload } from '../models/payload.model';
import { Admin } from '../entities/admin.entity';
import { AdminRepository } from '../repositories/admin.repository';

const jwtConfig: any = config.get('jwt');

/**
 * payload에 저장된 값을 기반으로 admin 정보 조회
 *
 * @author 허정연(golgol22)
 * @return {admin} payload에 저장된 정보로 조회한 admin 정보를 jwtAuth.guards에 반환
 * @throws {UnauthorizedException} payload에 저장된 정보로 조회했을 때 admin 정보가 없을 경우 예외처리
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'adminJWT') {
  constructor(
    @InjectRepository(AdminRepository)
    private adminRepository: AdminRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConfig.secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: Payload): Promise<Admin> {
    const { adminId } = payload;
    const admin: Admin = await this.adminRepository.findOne({ where: { adminId } });
    if (!admin) {
      throw new UnauthorizedException('admin을 찾을 수 없습니다.');
    }
    return admin;
  }
}
