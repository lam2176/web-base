import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
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

  @Post()
  @ApiOperation({ summary: '[Admin] Create a new admin/staff user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponseDto<any>> {
    const user = await this.userService.create(createUserDto);
    return ApiResponseDto.success(user, 'User created successfully');
  }

  @Put(':id')
  @ApiOperation({ summary: '[Admin] Update user (password optional)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: { id: number },
  ): Promise<ApiResponseDto<any>> {
    const user = await this.userService.update(id, updateUserDto, currentUser.id);
    return ApiResponseDto.success(user, 'User updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: { id: number },
  ): Promise<ApiResponseDto<null>> {
    await this.userService.delete(id, currentUser.id);
    return ApiResponseDto.success(null, 'User deleted successfully');
  }
}
