import { SetMetadata } from '@nestjs/common';
import { RoleType } from '../models/role.enum';

/**
 * 특정 역할을 가진 admin 계정만 사용할 수 있게 제한하기 위한 custom decorator
 *
 * @author 허정연(golgol22)
 * @return {admin} JwtAuthGuard로부터 반환받은 admin 정보
 */
export const Roles = (...roles: RoleType[]): any => SetMetadata('roles', roles);
