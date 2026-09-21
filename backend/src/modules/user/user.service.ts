import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';

@Injectable()
export class UserService {
  async findById(id: number) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, refreshToken, ...result } = user;
    return result;
  }

  async findAll() {
    const allUsers = await db.select().from(users);
    return allUsers.map(({ password, refreshToken, ...user }) => user);
  }
}
