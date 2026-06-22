import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
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
}
