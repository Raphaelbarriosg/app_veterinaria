import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Mocks
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn(),
};

const mockAuditService = {
  logAction: jest.fn(),
  logAsync: jest.fn(),
};

// Mock de bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      phone: '1234567890',
      role: 'OWNER',
    };

    const createdUser = {
      id: 'uuid-123',
      email: 'test@example.com',
      passwordHash: 'hashedPassword123',
      name: 'Test User',
      phone: '1234567890',
      role: 'OWNER',
    };

    it('should register a new user successfully', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'rt-1', token: 'refresh-token-123' });
      mockJwtService.sign.mockReturnValue('jwt-token-123');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          passwordHash: 'hashedPassword123',
          name: registerDto.name,
          phone: registerDto.phone,
          role: registerDto.role,
        },
      });
      expect(result.user).toEqual({
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        phone: createdUser.phone,
        role: createdUser.role,
      });
      expect(result.accessToken).toBe('jwt-token-123');
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-uuid',
        email: 'test@example.com',
      });

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'El email ya está registrado',
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const existingUser = {
      id: 'uuid-123',
      email: 'test@example.com',
      passwordHash: 'hashedPassword123',
      name: 'Test User',
      role: 'OWNER',
      isActive: true,
    };

    it('should login successfully with valid credentials', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update = jest.fn().mockResolvedValue(existingUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'rt-1', token: 'refresh-token-123' });
      mockJwtService.sign.mockReturnValue('jwt-token-123');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        existingUser.passwordHash,
      );
      expect(result.user).toEqual({
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
      });
      expect(result.accessToken).toBe('jwt-token-123');
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Credenciales inválidas',
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Credenciales inválidas',
      );
    });
  });

  describe('generateTokenPair', () => {
    it('should generate a pair of JWT tokens and save refresh token', async () => {
      // Arrange
      const userId = 'uuid-123';
      const email = 'test@example.com';
      const role = 'OWNER';
      mockJwtService.sign.mockReturnValue('jwt-token-123');
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'rt-1', token: 'refresh-token-123' });

      // Act
      const tokens = await service['generateTokenPair'](userId, email, role);

      // Assert
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: userId,
          email,
          role,
        },
        { expiresIn: '15m' },
      );
      expect(tokens.accessToken).toBe('jwt-token-123');
      expect(tokens.refreshToken).toBeDefined();
    });
  });
});