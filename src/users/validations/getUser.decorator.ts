import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../entities/user.entity';

/**
 * JwtAuthGuard로부터 반환받은 유저 정보를 req없이 resolver에서 바로 사용하기 위한 custom decorator
 * user의 전체 정보가 아닌 특정 정보만 받아보고 싶은 경우를 위해 유저 칼럼을 파라미터로 받아 정보 반환
 *
 * @author 허정연(golgol22)
 * @return {user} JwtAuthGuard로부터 반환받은 유저 정보
 */
export const GetUser = createParamDecorator((data: string, context: ExecutionContext): User => {
  const ctx = GqlExecutionContext.create(context);
  const user = ctx.getContext().req.user;
  return data ? user?.[data] : user;
});
