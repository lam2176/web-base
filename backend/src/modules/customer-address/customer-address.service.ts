import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { db } from '@/db';
import { customerAddresses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class CustomerAddressService {
  /**
   * Get all addresses for a customer
   */
  async findAll(customerId: number) {
    return db.query.customerAddresses.findMany({
      where: eq(customerAddresses.customerId, customerId),
      orderBy: (addresses, { desc }) => [desc(addresses.isDefault), desc(addresses.createdAt)],
    });
  }

  /**
   * Get a single address by ID
   */
  async findOne(addressId: number, customerId: number) {
    const address = await db.query.customerAddresses.findFirst({
      where: and(
        eq(customerAddresses.id, addressId),
        eq(customerAddresses.customerId, customerId),
      ),
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  /**
   * Create a new address
   */
  async create(customerId: number, createAddressDto: CreateAddressDto) {
    // If this is set as default, unset other default addresses
    if (createAddressDto.isDefault) {
      await db
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(eq(customerAddresses.customerId, customerId));
    }

    const [address] = await db
      .insert(customerAddresses)
      .values({
        customerId,
        ...createAddressDto,
      })
      .returning();

    return address;
  }

  /**
   * Update an address
   */
  async update(addressId: number, customerId: number, updateAddressDto: UpdateAddressDto) {
    // Verify address belongs to customer
    await this.findOne(addressId, customerId);

    // If setting as default, unset other default addresses
    if (updateAddressDto.isDefault) {
      await db
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(eq(customerAddresses.customerId, customerId));
    }

    const [updatedAddress] = await db
      .update(customerAddresses)
      .set({
        ...updateAddressDto,
        updatedAt: new Date(),
      })
      .where(eq(customerAddresses.id, addressId))
      .returning();

    return updatedAddress;
  }

  /**
   * Delete an address
   */
  async remove(addressId: number, customerId: number) {
    // Verify address belongs to customer
    await this.findOne(addressId, customerId);

    await db
      .delete(customerAddresses)
      .where(eq(customerAddresses.id, addressId));

    return { message: 'Address deleted successfully' };
  }

  /**
   * Set an address as default
   */
  async setDefault(addressId: number, customerId: number) {
    // Verify address belongs to customer
    await this.findOne(addressId, customerId);

    // Unset other default addresses
    await db
      .update(customerAddresses)
      .set({ isDefault: false })
      .where(eq(customerAddresses.customerId, customerId));

    // Set this address as default
    const [updatedAddress] = await db
      .update(customerAddresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(customerAddresses.id, addressId))
      .returning();

    return updatedAddress;
  }

  /**
   * Get default address for a customer
   */
  async getDefault(customerId: number) {
    const address = await db.query.customerAddresses.findFirst({
      where: and(
        eq(customerAddresses.customerId, customerId),
        eq(customerAddresses.isDefault, true),
      ),
    });

    return address;
  }
}
