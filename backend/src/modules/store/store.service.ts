import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { storeInfo } from '@/db/schema';
import { CreateStoreInfoDto } from './dto/create-store-info.dto';
import { UpdateStoreInfoDto } from './dto/update-store-info.dto';
import { MediaUrlUtil } from '@shared/utils/media-url.util';

@Injectable()
export class StoreService {
  async get() {
    // Get the first (and only) store info record
    const store = await db.query.storeInfo.findFirst({
      with: {
        logo: true,
        bankQr: true,
      },
    });

    if (!store) {
      throw new NotFoundException('Store information not found');
    }

    // Add URL to logo if it exists
    if (store.logo) {
      store.logo = MediaUrlUtil.addUrl(store.logo);
    }

    // Add URL to bankQr if it exists
    if (store.bankQr) {
      store.bankQr = MediaUrlUtil.addUrl(store.bankQr);
    }

    return store;
  }

  async update(updateStoreInfoDto: UpdateStoreInfoDto) {
    // Get the existing store info
    const existingStore = await db.query.storeInfo.findFirst();

    if (!existingStore) {
      // If no store info exists, create one
      const [newStore] = await db
        .insert(storeInfo)
        .values({
          ...updateStoreInfoDto,
          shippingFee: updateStoreInfoDto.shippingFee?.toString(),
        } as any)
        .returning();

      return newStore;
    }

    // Update the existing store info (there should only be one record)
    const [updatedStore] = await db
      .update(storeInfo)
      .set({
        ...updateStoreInfoDto,
        shippingFee: updateStoreInfoDto.shippingFee?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(storeInfo.id, existingStore.id as any))
      .returning();

    return updatedStore;
  }
}
