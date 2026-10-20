import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { users, User } from '@/db/schema';
import { HashUtil } from '@shared/utils/hash.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  async findById(id: number) {
    return this.toPublic(await this.getOrFail(id));
  }

  async findAll() {
    const allUsers = await db.select().from(users);
    return allUsers.map((user) => this.toPublic(user));
  }

  async create(dto: CreateUserDto) {
    await this.assertEmailAvailable(dto.email);

    const [user] = await db
      .insert(users)
      .values({
        email: dto.email,
        password: await HashUtil.hash(dto.password),
        role: dto.role,
      })
      .returning();

    return this.toPublic(user);
  }

  async update(id: number, dto: UpdateUserDto, currentUserId: number) {
    const user = await this.getOrFail(id);

    if (dto.email && dto.email !== user.email) {
      await this.assertEmailAvailable(dto.email, id);
    }

    if (dto.role && dto.role !== user.role && user.role === 'admin') {
      if (id === currentUserId) {
        throw new BadRequestException('You cannot change your own role');
      }
      await this.assertNotLastAdmin(id);
    }

    const changes: Partial<User> = { updatedAt: new Date() };
    if (dto.email) changes.email = dto.email;
    if (dto.role) changes.role = dto.role;
    if (dto.password) {
      changes.password = await HashUtil.hash(dto.password);
      // Force re-login everywhere after a password change
      changes.refreshToken = null;
    }

    const [updated] = await db.update(users).set(changes).where(eq(users.id, id)).returning();
    return this.toPublic(updated);
  }

  async delete(id: number, currentUserId: number) {
    const user = await this.getOrFail(id);

    if (id === currentUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    if (user.role === 'admin') {
      await this.assertNotLastAdmin(id);
    }

    await db.delete(users).where(eq(users.id, id));
  }

  private async getOrFail(id: number): Promise<User> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async assertEmailAvailable(email: string, excludeId?: number) {
    const existing = await db.query.users.findFirst({
      where: excludeId ? and(eq(users.email, email), ne(users.id, excludeId)) : eq(users.email, email),
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }
  }

  private async assertNotLastAdmin(excludeId: number) {
    const [{ value }] = await db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.role, 'admin'), ne(users.id, excludeId)));

    if (value === 0) {
      throw new BadRequestException('At least one admin account is required');
    }
  }

  private toPublic(user: User) {
    const { password, refreshToken, ...result } = user;
    return result;
  }
}
