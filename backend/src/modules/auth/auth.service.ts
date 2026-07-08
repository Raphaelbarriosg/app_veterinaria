import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService, AuditAction } from '../../common/services/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly ACCESS_TOKEN_EXPIRATION = '15m';
  private readonly REFRESH_TOKEN_EXPIRATION_DAYS = 7;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  // ============================================
  // REGISTRO
  // ============================================

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        role: dto.role,
      },
    });

    const { accessToken, refreshToken } = await this.generateTokenPair(
      user.id,
      user.email,
      user.role,
    );

    // Audit log
    this.auditService.logAsync({
      action: AuditAction.USER_REGISTER,
      userId: user.id,
      resourceType: 'user',
      resourceId: user.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
      accessToken,
      refreshToken,
    };
  }

  // ============================================
  // LOGIN
  // ============================================

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      this.auditService.logAsync({
        action: AuditAction.USER_LOGIN_FAILED,
        details: { email: dto.email, reason: 'user_not_found' },
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      this.auditService.logAsync({
        action: AuditAction.USER_LOGIN_FAILED,
        userId: user.id,
        details: { email: dto.email, reason: 'wrong_password' },
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Cuenta desactivada');
    }

    // Revocar refresh tokens anteriores (rotación por login)
    await this.revokeAllUserRefreshTokens(user.id);

    const { accessToken, refreshToken } = await this.generateTokenPair(
      user.id,
      user.email,
      user.role,
    );

    // Track last login (non-blocking)
    this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    }).catch(() => {});

    // Audit successful login
    this.auditService.logAsync({
      action: AuditAction.USER_LOGIN,
      userId: user.id,
      resourceType: 'user',
      resourceId: user.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
      accessToken,
      refreshToken,
    };
  }

  // ============================================
  // REFRESH TOKEN
  // ============================================

  async refreshToken(dto: RefreshTokenDto) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Si fue revocado -> posible reuso malicioso -> revocar TODOS los del usuario
    if (storedToken.isRevoked) {
      await this.revokeAllUserRefreshTokens(storedToken.userId);
      this.auditService.logAsync({
        action: AuditAction.USER_LOGIN_FAILED,
        userId: storedToken.userId,
        details: { reason: 'reused_refresh_token' },
      });
      throw new ForbiddenException(
        'Refresh token comprometido. Por favor inicie sesión nuevamente.',
      );
    }

    // Si expiró
    if (storedToken.expiresAt < new Date()) {
      await this.revokeRefreshToken(storedToken.id);
      throw new UnauthorizedException(
        'Refresh token expirado. Por favor inicie sesión nuevamente.',
      );
    }

    // Si el usuario está inactivo
    if (!storedToken.user.isActive) {
      throw new ForbiddenException('Cuenta desactivada');
    }

    // Rotación: revocar el token actual y emitir uno nuevo
    await this.revokeRefreshToken(storedToken.id);

    const { accessToken, refreshToken } = await this.generateTokenPair(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    );

    return {
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        name: storedToken.user.name,
        role: storedToken.user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  // ============================================
  // GET PROFILE (verificar sesión activa)
  // ============================================

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    return { user };
  }

  // ============================================
  // LOGOUT
  // ============================================

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });
      if (storedToken && storedToken.userId === userId) {
        await this.revokeRefreshToken(storedToken.id);
      }
    } else {
      // Si no se proporciona token, revocar todos los del usuario
      await this.revokeAllUserRefreshTokens(userId);
    }

    return { message: 'Sesión cerrada correctamente' };
  }

  // ============================================
  // LIMPIEZA DE TOKENS EXPIRADOS
  // ============================================

  async cleanExpiredTokens() {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true },
        ],
      },
    });
    return { deleted: result.count };
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  private async generateTokenPair(userId: string, email: string, role: string) {
    // Access token (corto plazo - 15min)
    const accessToken = this.jwtService.sign(
      { sub: userId, email, role },
      { expiresIn: this.ACCESS_TOKEN_EXPIRATION },
    );

    // Refresh token (largo plazo - 7 días, almacenado en BD)
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRATION_DAYS);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private async revokeRefreshToken(tokenId: string) {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { isRevoked: true },
    });
  }

  private async revokeAllUserRefreshTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }
}