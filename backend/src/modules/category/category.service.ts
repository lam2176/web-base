import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, like, or, isNull, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { categories, categoryImages } from '@/db/schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SlugUtil } from '@shared/utils/slug.util';
import { MediaUrlUtil } from '@shared/utils/media-url.util';

@Injectable()
export class CategoryService {
  async create(createCategoryDto: CreateCategoryDto) {
    // Check if slug already exists
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.slug, createCategoryDto.slug),
    });

    if (existingCategory) {
      throw new ConflictException('Category with this slug already exists');
    }

    // If parentId is provided, verify it exists
    if (createCategoryDto.parentId) {
      const parentCategory = await db.query.categories.findFirst({
        where: eq(categories.id, createCategoryDto.parentId),
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const { images, ...categoryData } = createCategoryDto;

    const [newCategory] = await db
      .insert(categories)
      .values({
        ...categoryData,
        slug: SlugUtil.generate(createCategoryDto.slug),
      })
      .returning();

    // Insert category images if provided
    if (images && images.length > 0) {
      await db.insert(categoryImages).values(
        images.map((image) => ({
          ...image,
          categoryId: newCategory.id,
        })),
      );
    }

    return this.findById(newCategory.id);
  }

  async findAll(search?: string) {
    const baseCategories = await db.query.categories.findMany({
      where: search
        ? or(like(categories.nameVi, `%${search}%`), like(categories.nameEn, `%${search}%`))
        : undefined,
    });

    return this.attachImages(baseCategories);
  }

  async findRootCategories() {
    const baseCategories = await db.query.categories.findMany({
      where: isNull(categories.parentId),
    });
    return this.attachImages(baseCategories);
  }

  private transformCategory(category: any, images: any[] = []) {
    const transformedImages =
      images.map((img: any) => ({
        id: img.id,
        mediaId: img.mediaId,
        order: img.order,
        isPrimary: img.isPrimary,
        media: img.media ? MediaUrlUtil.addUrl(img.media) : null,
      })) || [];

    const primaryImage =
      transformedImages.find((img: any) => img.isPrimary && img.media?.url) ||
      transformedImages.find((img: any) => img.media?.url);

    return {
      ...category,
      name: category.nameVi || category.nameEn,
      description: category.descriptionVi || category.descriptionEn,
      image: primaryImage?.media?.url || category.image || null,
      images: transformedImages,
    };
  }

  async findById(id: number) {
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const images = await this.fetchImagesByCategoryIds([category.id]);
    return this.transformCategory(category, images.get(category.id) || []);
  }

  async findBySlug(slug: string) {
    const category = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const images = await this.fetchImagesByCategoryIds([category.id]);
    return this.transformCategory(category, images.get(category.id) || []);
  }

  async findChildren(parentId: number) {
    const baseCategories = await db.query.categories.findMany({
      where: eq(categories.parentId, parentId),
    });
    return this.attachImages(baseCategories);
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findById(id);

    // If slug is being updated, check for conflicts
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existingCategory = await db.query.categories.findFirst({
        where: eq(categories.slug, updateCategoryDto.slug),
      });

      if (existingCategory) {
        throw new ConflictException('Category with this slug already exists');
      }
    }

    // If parentId is being updated, verify it exists and prevent circular reference
    if (updateCategoryDto.parentId !== undefined) {
      if (updateCategoryDto.parentId === id) {
        throw new ConflictException('Category cannot be its own parent');
      }

      if (updateCategoryDto.parentId) {
        const parentCategory = await db.query.categories.findFirst({
          where: eq(categories.id, updateCategoryDto.parentId),
        });

        if (!parentCategory) {
          throw new NotFoundException('Parent category not found');
        }
      }
    }

    const { images, ...categoryData } = updateCategoryDto;

    const [updatedCategory] = await db
      .update(categories)
      .set({
        ...categoryData,
        slug: updateCategoryDto.slug ? SlugUtil.generate(updateCategoryDto.slug) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    // Update images if provided
    if (images !== undefined) {
      // Delete existing images
      await db.delete(categoryImages).where(eq(categoryImages.categoryId, id));

      // Insert new images
      if (images.length > 0) {
        await db.insert(categoryImages).values(
          images.map((image) => ({
            ...image,
            categoryId: id,
          })),
        );
      }
    }

    return this.findById(id);
  }

  async delete(id: number) {
    const category = await this.findById(id);

    // Check if category has children
    const children = await this.findChildren(id);
    if (children.length > 0) {
      throw new ConflictException('Cannot delete category with child categories');
    }

    await db.delete(categories).where(eq(categories.id, id));
  }

  private async attachImages(categoryList: any[]) {
    if (categoryList.length === 0) {
      return [];
    }
    const imagesMap = await this.fetchImagesByCategoryIds(categoryList.map((cat) => cat.id));
    return categoryList.map((cat) =>
      this.transformCategory(cat, imagesMap.get(cat.id) || []),
    );
  }

  private async fetchImagesByCategoryIds(categoryIds: number[]) {
    if (categoryIds.length === 0) {
      return new Map<number, any[]>();
    }

    const images = await db.query.categoryImages.findMany({
      where: inArray(categoryImages.categoryId, categoryIds),
      with: {
        media: true,
      },
    });

    images.sort((a, b) => a.order - b.order);

    const map = new Map<number, any[]>();
    images.forEach((img) => {
      const list = map.get(img.categoryId) || [];
      list.push(img);
      map.set(img.categoryId, list);
    });

    return map;
  }
}
