import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, asc, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { menus, menuItems } from '@/db/schema';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuService {
  // ============ MENU CRUD ============
  async createMenu(createMenuDto: CreateMenuDto) {
    const [newMenu] = await db
      .insert(menus)
      .values(createMenuDto)
      .returning();

    return newMenu;
  }

  async findAllMenus() {
    const allMenus = await db.query.menus.findMany({
      with: {
        items: {
          orderBy: [asc(menuItems.order)],
        },
      },
    });

    // Build hierarchical structure
    return allMenus.map(menu => this.buildMenuHierarchy(menu));
  }

  async findMenuById(id: number) {
    const menu = await db.query.menus.findFirst({
      where: eq(menus.id, id),
      with: {
        items: {
          orderBy: [asc(menuItems.order)],
        },
      },
    });

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    // Build hierarchical structure
    return this.buildMenuHierarchy(menu);
  }

  private buildMenuHierarchy(menu: any) {
    const itemsMap = new Map();
    const rootItems: any[] = [];

    // First pass: create map of all items
    menu.items.forEach((item: any) => {
      itemsMap.set(item.id, { ...item, children: [] });
    });

    // Second pass: build hierarchy
    menu.items.forEach((item: any) => {
      const menuItem = itemsMap.get(item.id);
      if (item.parentId) {
        const parent = itemsMap.get(item.parentId);
        if (parent) {
          parent.children.push(menuItem);
        }
      } else {
        rootItems.push(menuItem);
      }
    });

    return {
      ...menu,
      items: rootItems,
    };
  }

  async findMenuByLocation(location: 'header' | 'footer') {
    // Use separate queries to avoid lateral join issues
    // First, fetch active menus with matching location
    const activeMenus = await db
      .select()
      .from(menus)
      .where(eq(menus.isActive, true));

    // Filter by location
    const filteredMenus = activeMenus.filter(
      menu => menu.location === location || menu.location === 'both'
    );

    if (filteredMenus.length === 0) {
      return [];
    }

    // Get menu IDs
    const menuIds = filteredMenus.map(m => m.id);

    // Fetch all items for these menus
    const allItems = await db
      .select()
      .from(menuItems)
      .where(inArray(menuItems.menuId, menuIds))
      .orderBy(asc(menuItems.order));

    // Build result with hierarchy
    return filteredMenus
      .map(menu => {
        // Get items for this menu
        const menuItemsList = allItems.filter(
          item => item.menuId === menu.id && item.isActive === true
        );

        // Build hierarchy from flat items
        const itemsMap = new Map();
        const rootItems: any[] = [];

        // First pass: create map of all active items
        menuItemsList.forEach((item: any) => {
          itemsMap.set(item.id, { ...item, children: [] });
        });

        // Second pass: build hierarchy
        menuItemsList.forEach((item: any) => {
          const menuItem = itemsMap.get(item.id);
          if (item.parentId) {
            const parent = itemsMap.get(item.parentId);
            if (parent) {
              parent.children.push(menuItem);
            }
          } else {
            rootItems.push(menuItem);
          }
        });

        return {
          ...menu,
          items: rootItems,
        };
      })
      .filter(menu => menu.items && menu.items.length > 0);
  }

  async updateMenu(id: number, updateMenuDto: UpdateMenuDto) {
    await this.findMenuById(id);

    const [updatedMenu] = await db
      .update(menus)
      .set({
        ...updateMenuDto,
        updatedAt: new Date(),
      })
      .where(eq(menus.id, id))
      .returning();

    return updatedMenu;
  }

  async deleteMenu(id: number) {
    await this.findMenuById(id);
    await db.delete(menus).where(eq(menus.id, id));
  }

  // ============ MENU ITEM CRUD ============
  async createMenuItem(createMenuItemDto: CreateMenuItemDto) {
    const [newItem] = await db
      .insert(menuItems)
      .values(createMenuItemDto)
      .returning();

    return newItem;
  }

  async findMenuItemById(id: number) {
    const item = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, id),
      with: {
        children: {
          orderBy: [asc(menuItems.order)],
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return item;
  }

  async updateMenuItem(id: number, updateMenuItemDto: UpdateMenuItemDto) {
    await this.findMenuItemById(id);

    const [updatedItem] = await db
      .update(menuItems)
      .set(updateMenuItemDto)
      .where(eq(menuItems.id, id))
      .returning();

    return updatedItem;
  }

  async deleteMenuItem(id: number) {
    await this.findMenuItemById(id);
    await db.delete(menuItems).where(eq(menuItems.id, id));
  }

  // ============ REORDER MENU ITEMS ============
  async reorderMenuItems(updates: Array<{ id: number; order: number; parentId?: number }>) {
    // Update all items in a transaction-like manner
    const promises = updates.map(update => 
      db
        .update(menuItems)
        .set({ 
          order: update.order,
          parentId: update.parentId,
          updatedAt: new Date(),
        })
        .where(eq(menuItems.id, update.id))
    );

    await Promise.all(promises);
    return { success: true };
  }
}

