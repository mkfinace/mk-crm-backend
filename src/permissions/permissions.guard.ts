import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from './permissions.decorator';
import { PermissionsService } from './permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private permissions: PermissionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // No @RequirePermission() on this endpoint — any authenticated user may call it.
    if (!requiredPermission) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('You do not have permission to perform this action.');

    const allowed = await this.permissions.hasPermission(user.role, requiredPermission);
    if (!allowed) throw new ForbiddenException('You do not have permission to perform this action.');
    return true;
  }
}
