import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, asc } from 'drizzle-orm';
import { db } from '@/db';
import { banners } from '@/db/schema';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { MediaUrlUtil } from '@shared/utils/media-url.util';

@Injectable()
export class BannerService {
  async create(createBannerDto: CreateBannerDto) {
    const [newBanner] = await db
      .insert(banners)
      .values(createBannerDto)
      .returning();

    return newBanner;
  }

  async findAll() {
    const bannerList = await db.query.banners.findMany({
      with: {
        image: true,
      },
      orderBy: [asc(banners.order)],
    });

    return bannerList.map((banner) => this.transformBanner(banner));
  }

  async findActive() {
    const bannerList = await db.query.banners.findMany({
      where: eq(banners.status, 'active'),
      with: {
        image: true,
      },
      orderBy: [asc(banners.order)],
    });

    return bannerList.map((banner) => this.transformBanner(banner));
  }

  async findById(id: number) {
    const banner = await db.query.banners.findFirst({
      where: eq(banners.id, id),
      with: {
        image: true,
      },
    });

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    return this.transformBanner(banner);
  }

  private transformBanner(banner: any) {
    const imageUrl = banner.image
      ? MediaUrlUtil.addUrl(banner.image).url
      : null;

    return {
      ...banner,
      image: imageUrl,
    };
  }

  async update(id: number, updateBannerDto: UpdateBannerDto) {
    await this.findById(id);

    const [updatedBanner] = await db
      .update(banners)
      .set({
        ...updateBannerDto,
        updatedAt: new Date(),
      })
      .where(eq(banners.id, id))
      .returning();

    return updatedBanner;
  }

  async delete(id: number) {
    await this.findById(id);
    await db.delete(banners).where(eq(banners.id, id));
  }
}
