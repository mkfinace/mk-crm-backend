import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async getByVariant(variantId: string) {
    const variant = await this.prisma.variant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found.');
    const vehicle = await this.prisma.vehicle.findFirst({ where: { variantId } });
    if (!vehicle) return { variantId, colours: [], images: [] };
    return {
      variantId,
      colours: vehicle.colourOptionsJson ? JSON.parse(vehicle.colourOptionsJson) : [],
      images: vehicle.imagesJson ? JSON.parse(vehicle.imagesJson) : [],
    };
  }

  async upsertByVariant(variantId: string, data: { colours?: any[]; images?: string[] }) {
    const variant = await this.prisma.variant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found.');

    const existing = await this.prisma.vehicle.findFirst({ where: { variantId } });
    const colourOptionsJson = data.colours ? JSON.stringify(data.colours) : existing?.colourOptionsJson;
    const imagesJson = data.images ? JSON.stringify(data.images) : existing?.imagesJson;

    if (existing) {
      return this.prisma.vehicle.update({
        where: { id: existing.id },
        data: { colourOptionsJson, imagesJson },
      });
    }
    return this.prisma.vehicle.create({
      data: { variantId, colourOptionsJson, imagesJson },
    });
  }
}
