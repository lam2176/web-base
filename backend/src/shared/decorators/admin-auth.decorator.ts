import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

/**
 * Combined decorator for admin authentication
 * Applies JWT auth guard, roles guard, and requires admin/staff role
 */
export function AdminAuth(...roles: string[]) {
  const rolesToApply = roles.length > 0 ? roles : ['admin', 'staff'];

  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(...rolesToApply),
    ApiBearerAuth()
  );
}
