import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, like, or, and, asc } from 'drizzle-orm';
import { db } from '@/db';
import { pages } from '@/db/schema';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { SlugUtil } from '@shared/utils/slug.util';
import { MediaUrlUtil } from '@shared/utils/media-url.util';

@Injectable()
export class PageService {
  async create(createPageDto: CreatePageDto) {
    // Check if slug already exists
    const existingPage = await db.query.pages.findFirst({
      where: eq(pages.slug, createPageDto.slug),
    });

    if (existingPage) {
      throw new ConflictException('Page with this slug already exists');
    }

    const [newPage] = await db
      .insert(pages)
      .values({
        ...createPageDto,
        slug: SlugUtil.generate(createPageDto.slug),
      })
      .returning();

    return newPage;
  }

  async findAll(search?: string) {
    const allPages = await db.query.pages.findMany({
      with: {
        featuredImage: true,
        featuredVideo: true,
      },
      orderBy: (pages, { asc }) => [asc(pages.order), asc(pages.createdAt)],
    });

    const transformedPages = allPages.map((page) => this.transformPage(page));

    if (search) {
      return transformedPages.filter(
        (page) =>
          page.titleVi.toLowerCase().includes(search.toLowerCase()) ||
          page.titleEn.toLowerCase().includes(search.toLowerCase())
      );
    }

    return transformedPages;
  }

  async findById(id: number) {
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, id),
      with: {
        featuredImage: true,
        featuredVideo: true,
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return this.transformPage(page);
  }

  async findBySlug(slug: string) {
    const page = await db.query.pages.findFirst({
      where: eq(pages.slug, slug),
      with: {
        featuredImage: true,
        featuredVideo: true,
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return this.transformPage(page);
  }

  async findMenuPages() {
    const menuPages = await db
      .select({
        id: pages.id,
        slug: pages.slug,
        titleVi: pages.titleVi,
        titleEn: pages.titleEn,
        order: pages.order,
      })
      .from(pages)
      .where(
        and(
          eq(pages.showInMenu, true),
          eq(pages.status, 'active')
        )
      )
      .orderBy(asc(pages.order));

    return menuPages;
  }

  private transformPage(page: any) {
    return {
      ...page,
      featuredImage: page.featuredImage ? MediaUrlUtil.addUrl(page.featuredImage) : null,
      featuredVideo: page.featuredVideo ? MediaUrlUtil.addUrl(page.featuredVideo) : null,
    };
  }

  async update(id: number, updatePageDto: UpdatePageDto) {
    const page = await this.findById(id);

    // If slug is being updated, check for conflicts
    if (updatePageDto.slug && updatePageDto.slug !== page.slug) {
      const existingPage = await db.query.pages.findFirst({
        where: eq(pages.slug, updatePageDto.slug),
      });

      if (existingPage) {
        throw new ConflictException('Page with this slug already exists');
      }
    }

    const [updatedPage] = await db
      .update(pages)
      .set({
        ...updatePageDto,
        slug: updatePageDto.slug ? SlugUtil.generate(updatePageDto.slug) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, id))
      .returning();

    return updatedPage;
  }

  async delete(id: number) {
    await this.findById(id);
    await db.delete(pages).where(eq(pages.id, id));
  }

  async reorder(reorderData: Array<{ id: number; order: number }>) {
    // Update all pages in a transaction-like manner
    const promises = reorderData.map((item) =>
      db
        .update(pages)
        .set({
          order: item.order,
          updatedAt: new Date(),
        })
        .where(eq(pages.id, item.id))
    );

    await Promise.all(promises);
    return { success: true };
  }
}
