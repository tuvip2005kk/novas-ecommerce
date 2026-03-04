import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private prisma: PrismaService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Token không hợp lệ');
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_SECRET') || 'sanitary-store-secret-key-2024',
            });

            const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

            if (!user || user.role !== 'ADMIN') {
                throw new UnauthorizedException('Chỉ Admin mới có quyền truy cập');
            }

            request['user'] = user;
        } catch (error) {
            console.error('[AdminGuard] JWT Verification Error:', error.message || error);
            console.error('[AdminGuard] Token received:', token.substring(0, 15) + '...');
            console.error('[AdminGuard] Secret used:', this.configService.get<string>('JWT_SECRET') || 'sanitary-store-secret-key-2024');
            throw new UnauthorizedException('Không có quyền truy cập');
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
