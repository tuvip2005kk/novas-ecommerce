import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Token không hợp lệ');
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: 'sanitary-store-secret-key-2024',
            });

            if (payload.role !== 'ADMIN') {
                throw new UnauthorizedException('Chỉ Admin mới có quyền truy cập');
            }

            request['user'] = payload;
        } catch {
            throw new UnauthorizedException('Không có quyền truy cập');
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
