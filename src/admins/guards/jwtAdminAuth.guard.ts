import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticationError } from 'apollo-server-core';

/**
 * JWT 토큰 유효성 검사, admin정보 반환
 *
 * @author 허정연(golgol22)
 * @return {admin} jwt.strategy로부터 전달받은 admin
 * @throws {UnauthorizedException} err가 있거나 admin 정보가 없을 경우 예외처리
 */
@Injectable()
export class JwtAdminAuthGuard extends AuthGuard('adminJWT') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  handleRequest(err: any, admin: any, info: any) {
    if (err || !admin) {
      throw new AuthenticationError('로그인을 해주세요.');
    }
    return admin;
  }
}
