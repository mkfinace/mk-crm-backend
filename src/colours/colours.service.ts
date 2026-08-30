import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ColoursService {
  constructor(private prisma: PrismaService) {}

  // ---- Library CRUD ----

  async createColour(data: { name: string; hexCode: string; type?: string }) {
    const existing = await this.prisma.colour.findUnique({ where: { name: data.name } });
    if (existing) {
      if (existing.status === 'ARCHIVED') {
        throw new BadRequestException(`"${data.name}" already exists as an archived colour — restore it instead of creating a duplicate.`);
      }
      throw new BadRequestException(`A colour named "${data.name}" already exists.`);
    }
    return this.prisma.colour.create({ data: { name: data.name, hexCode: data.hexCode, type: data.type || 'EXTERIOR' } });
  }

  listColours(includeArchived?: boolean, type?: string) {
    return this.prisma.colour.findMany({
      where: { ...(includeArchived ? {} : { status: 'ACTIVE' }), ...(type ? { type } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  async updateColour(id: string, data: { name?: string; hexCode?: string; type?: string; status?: string }) {
    const colour = await this.prisma.colour.findUnique({ where: { id } });
    if (!colour) throw new NotFoundException('Colour not found.');
    if (data.name && data.name !== colour.name) {
      const clash = await this.prisma.colour.findUnique({ where: { name: data.name } });
      if (clash) throw new BadRequestException(`A colour named "${data.name}" already exists.`);
    }
    return this.prisma.colour.update({ where: { id }, data });
  }

  async deleteColour(id: string) {
    const colour = await this.prisma.colour.findUnique({ where: { id } });
    if (!colour) throw new NotFoundException('Colour not found.');
    const inUse = await this.prisma.vehicleColour.count({ where: { colourId: id } });
    if (inUse > 0) {
      throw new BadRequestException(`"${colour.name}" is assigned to ${inUse} vehicle(s) — archive it instead of deleting, or remove those assignments first.`);
    }
    return this.prisma.colour.delete({ where: { id } });
  }

  // ---- Vehicle assignment ----
  // "Vehicle" here is the per-variant photo/colour record (Vehicle model),
  // matching how vehicles.service.ts already resolves one Vehicle per Variant.

  getVehicleColours(vehicleId: string) {
    return this.prisma.vehicleColour.findMany({
      where: { vehicleId },
      include: { colour: true },
      orderBy: [{ isDefault: 'desc' }, { colour: { name: 'asc' } }],
    });
  }

  async setVehicleColours(vehicleId: string, items: { colourId: string; imageUrl?: string; isDefault?: boolean }[]) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found.');
    // Only one default colour — if more than one is flagged, keep the first.
    let defaultSeen = false;
    const rows = items.map((item) => {
      const isDefault = !!item.isDefault && !defaultSeen;
      if (isDefault) defaultSeen = true;
      return { vehicleId, colourId: item.colourId, imageUrl: item.imageUrl, isDefault };
    });
    await this.prisma.$transaction([
      this.prisma.vehicleColour.deleteMany({ where: { vehicleId } }),
      ...rows.map((row) => this.prisma.vehicleColour.create({ data: row })),
    ]);
    return this.getVehicleColours(vehicleId);
  }

  // ---- Convenience: variant-based (the car-data admin page works in terms
  // of variantId, not the underlying Vehicle row — mirrors the get-or-create
  // pattern already used in vehicles.service.ts for images). ----

  async getVehicleColoursByVariant(variantId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { variantId } });
    if (!vehicle) return [];
    return this.getVehicleColours(vehicle.id);
  }

  async setVehicleColoursByVariant(variantId: string, items: { colourId: string; imageUrl?: string; isDefault?: boolean }[]) {
    const variant = await this.prisma.variant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found.');
    let vehicle = await this.prisma.vehicle.findFirst({ where: { variantId } });
    if (!vehicle) vehicle = await this.prisma.vehicle.create({ data: { variantId } });
    return this.setVehicleColours(vehicle.id, items);
  }
}
