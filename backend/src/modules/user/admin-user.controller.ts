import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { Roles } from '@shared/decorators/roles.decorator';
import { ApiResponseDto } from '@shared/dto/api-response.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';

@ApiTags('Admin - Users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/users')
@Roles('admin')
@ApiBearerAuth()
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users' })
  async findAll(): Promise<ApiResponseDto<any>> {
    const users = await this.userService.findAll();
    return ApiResponseDto.success(users);
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Get user by id' })
  @ApiResponse({ status: 200, description: 'Return user' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<any>> {
    const user = await this.userService.findById(id);
    return ApiResponseDto.success(user);
  }
}
