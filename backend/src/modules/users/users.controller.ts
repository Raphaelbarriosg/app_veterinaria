import { Controller, Get, Post, Patch, Body, Query, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateTutorDto } from './dto/create-tutor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req: { user: { userId: string } }) {
    return this.usersService.findOne(req.user.userId);
  }

  @Patch('me')
  async updateProfile(
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.userId, dto);
  }

  @Get('tutors')
  @Roles(Role.VET, Role.CLINIC_ADMIN)
  async getTutors(@Query('q') query?: string) {
    return this.usersService.searchOwners(query);
  }

  @Post('tutors')
  @Roles(Role.VET, Role.CLINIC_ADMIN)
  async createTutor(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateTutorDto,
  ) {
    return this.usersService.createTutor(req.user.userId, dto);
  }
}
